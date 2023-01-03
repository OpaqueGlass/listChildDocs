/**
 * addChildDocLink.js 全局监视文件创建/删除操作，向父文档插入文本内容
 * 此代码文件是listChildDocs的一部分，基于AGPL-3.0（https://www.gnu.org/licenses/agpl-3.0.txt）许可协议开源。
 * THIS FILE IS A PART OF listChildDocs PROJECT, LICENSED UNDER AGPL-3.0 LICENSE (SEE AS https://www.gnu.org/licenses/agpl-3.0.txt).
 * @author OpaqueGlass
 * 
 * 使用方法：
 * 设置-外观-代码片段-添加js片段： import("/widgets/listChildDocs/src/addChildDocLinkHelper.js");
 * 触发方式/触发条件：websocket message事件，cmd为"create" / "removeDoc"
 * 依赖listChildDocs挂件的部分代码，若未经修改，不能单独作为代码片段插入。
 * 
 * 代码标记说明：
 * WARN: 警告，这些部分可能和其他js代码冲突，或导致性能问题；
 * TODO: 未完成的部分；
 * UNSTABLE: 不稳定的实现，可能跟随版本更新而失效；
 */
import {
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    isValidStr,
    appendBlockAPI,
    prependBlockAPI,
    getKramdown,
    removeBlockAPI
} from './API.js';
import {
    helperSettings
} from './config.js'
/* 全局变量和快速自定义设置 */
let g_attrName = helperSettings.attrName;
let g_docLinkTemplate = helperSettings.docLinkTemplate;
/* 插入挂件 `<iframe src=\"/widgets/listChildDocs\" data-src=\"/widgets/listChildDocs\" data-subtype=\"widget\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>`
   插入双链 "((%DOC_ID% '%DOC_NAME%'))"
   不建议修改为URL，URL文件名确定，新建文档时将固定插入为Untitled
*/
// 将文本内容插入到文档末尾？
let g_insertAtEnd = helperSettings.insertAtEnd;
let g_mode = helperSettings.mode;
let g_checkEmptyDocInsertWidget = helperSettings.checkEmptyDocInsertWidget;
let g_removeLink = helperSettings.removeLinkEnable;
let CONSTANTS = {
    RANDOM_DELAY: 500,
    OBSERVER_RANDOM_DELAY: 500,
    OBSERVER_RANDOM_DELAY_ADD: 100,
    OBSERVER_RETRY_INTERVAL: 1000,
}
let g_observerRetryInterval;
let g_observerStartupRefreshTimeout;
/*
目前支持g_mode取值为
插入挂件 add_list_child_docs
插入链接 add_link
*/
// let g_insertToParentDoc = true;
// let g_insertWidgetToParent = true;
const docInfoBlockTemplate = {
    docId: "", // 子文档id
    linkId: "", // 链接所在块id
    docName: "", // 文档名
}

/**
 * 添加触发器，新建文件、删除文件行为发生时执行；
 * WARN: 编辑过程中会高频触发，可能导致卡顿；
 */
let mywebsocket = window.siyuan.ws.ws;
mywebsocket.addEventListener("message", websocketEventHandler);

/**
 * 页签变更触发器
 * 使用当前页面监视获得触发，不会和其他页面执行冲突。但无法处理多用户的情况。
 * WARN: UNSTABLE: 依赖页签栏、窗口元素。
 */
let g_tabbarElement;
// 处理找不到Element的情况，interval重试寻找
let tabBarObserver = new MutationObserver((mutationList) =>{
    for (let mutation of mutationList) {
        console.log("监视到页签变化", mutation);
        if (mutation.addedNodes.length > 0) {
            setTimeout(() => {tabChangeHandler(mutation.addedNodes)}, Math.round(Math.random() * CONSTANTS.OBSERVER_RANDOM_DELAY) + CONSTANTS.OBSERVER_RANDOM_DELAY_ADD);
        }
        // 由windowObserver代管。关闭页签后，tabBar移除重设，触发器锚定的元素丢失，不会触发
        // if (mutation.removedNodes.length > 0) {
        //     if (!window.siyuan.layout.centerLayout.element.querySelector("[data-type='wnd'] ul.layout-tab-bar")) {
        //         console.log("DISCONNECT2");
        //         g_observerRetryInterval = setInterval(observerRetry, CONSTANTS.OBSERVER_RETRY_INTERVAL);
        //         tabBarObserver.disconnect();
        //     }
        // }
        
    }
});

/**处理分屏的情况：若页签栏刷新，则触发重设页签变更触发器
 * WARN: 依赖窗口变化
 * */ 
let windowObserver = new MutationObserver((mutationList) => {
    for (let mutation of mutationList) {
        console.log("监视到窗口变化", mutation);
        if (mutation.removedNodes.length > 0 || mutation.addedNodes.length > 0) {
            console.log("DISCONNECT");
            tabBarObserver.disconnect();
            clearInterval(g_observerRetryInterval);
            g_observerRetryInterval = setInterval(observerRetry, CONSTANTS.OBSERVER_RETRY_INTERVAL);
        }
        
    }
    
});
// 窗口变化监视器设定
let g_centerLayoutElement = window.siyuan.layout.centerLayout.element;

// 只有移除link为启用时才执行
if (g_removeLink) {
    console.log("检查页签");
    clearInterval(g_observerRetryInterval);
    g_observerRetryInterval = setInterval(observerRetry, CONSTANTS.OBSERVER_RETRY_INTERVAL);
    windowObserver.observe(g_centerLayoutElement, {childList: true});
}
/**
 * 重试页签监听
 */
function observerRetry() {
    g_tabbarElement = window.siyuan.layout.centerLayout.element.querySelectorAll("[data-type='wnd'] ul.layout-tab-bar");
    console.log(g_tabbarElement);
    if (g_tabbarElement.length > 0) {
        console.log("重新监视页签变化");
        g_tabbarElement.forEach((element)=>{
            tabBarObserver.observe(element, {childList: true});
            // 重启监听后立刻执行检查
            if (element.children.length > 0) {
                clearTimeout(g_observerRetryInterval);
                g_observerStartupRefreshTimeout = setTimeout(() => {tabChangeHandler(element.children)}, Math.round(Math.random() * CONSTANTS.OBSERVER_RANDOM_DELAY) + CONSTANTS.OBSERVER_RANDOM_DELAY_ADD);
            }
        });
        clearInterval(g_observerRetryInterval);
    }
}
/**
 * websocket message事件处理函数
 * 由于多个窗口的触发时间一致，这里通过随机延迟避开冲突。
 * @param {*} msg 
 */
function websocketEventHandler(msg) {
    try {
        if (msg && msg.data){
            let wsmessage = JSON.parse(msg.data);
            if (wsmessage.cmd == "create") {
                console.log(wsmessage);
                let random = Math.round(Math.random() * CONSTANTS.RANDOM_DELAY) * 10; // *10是为了扩大随机数之间的差距
                console.log("随机延迟", random);
                switch (g_mode) {
                    case "插入挂件":
                    case "add_list_child_docs": {
                        // 随机延迟，防止多个窗口中的代码片段同时执行导致重复插入
                        setTimeout(() => {addWidgetHandler(wsmessage.data)}, random);
                        break;
                    }
                    case "插入链接":
                    case "add_link": {
                        setTimeout(() => {createHandler(wsmessage.data)}, random);
                        break;
                    }
                    default: {
                        throw new Error("模式配置错误，请检查您的设置。");
                    }
                }
            }
            // OR "transactions"  "removeDoc"
        }
    }catch(err) {
        console.error("helper执行时发生错误，已断开，如果可以，请向开发者反馈：", err);
        mywebsocket.removeEventListener("message", websocketEventHandler);
    }
}

/**
 * 处理新建文档
 * @param msgdata websocket信息的data属性
 */
async function createHandler(msgdata) {
    if (!isValidStr(msgdata)) return;
    let dividedPath = msgdata.path.split("/");
    let parentDocId = dividedPath[dividedPath.length - 2];
    let newDocId = msgdata.id;
    // 笔记本根目录下文档不处理
    if (parentDocId == "") return; 
    // 获取新创建的文档名
    let newDocName = "Untitled";
    for (let i = 0; i < msgdata.files.length; i++) {
        if (msgdata.files[i].path == msgdata.path) {
            newDocName = msgdata.files[i].name.substring(0, msgdata.files[i].name.length - 3);
            break;
        }
    }
    // 确定未被插入，生成插入链接属性信息
    let parentDocAttr = await getCustomAttr(parentDocId);
    console.log("获取到父文档属性", parentDocAttr);
    if (parentDocAttr && "docInfo" in parentDocAttr) {
        for (let docInfoItem of parentDocAttr.docInfo) {
            if (docInfoItem.docId == newDocId) {
                console.log("其他实例已经添加");
                return;
            }
        }
    }
    // 处理插入文档的文本信息，进行关键词替换
    let insertText;
    insertText = g_docLinkTemplate.replaceAll("%DOC_ID%", msgdata.id)
                    .replaceAll("%DOC_NAME%", newDocName);
    console.log(insertText);
    let addResponse = null;
    if (g_insertAtEnd) {
        addResponse = await appendBlockAPI(insertText, parentDocId);
    }else{
        addResponse = await prependBlockAPI(insertText, parentDocId);
    }

    let childDocLinkId = addResponse.id;
    console.log(`helper已自动插入链接(${childDocLinkId})到父文档(${parentDocId})`);
    let newDocInfoBlock = Object.assign({}, docInfoBlockTemplate);
    newDocInfoBlock.docId = newDocId;
    newDocInfoBlock.linkId = childDocLinkId;
    if (parentDocAttr && "docInfo" in parentDocAttr) {
        parentDocAttr.docInfo.push(newDocInfoBlock);
    }else if (parentDocAttr){
        parentDocAttr["docInfo"] = [newDocInfoBlock];
    }else{
        parentDocAttr = {};
        parentDocAttr["docInfo"] = [newDocInfoBlock];
    }

    // 保存链接信息
    console.log("写入", parentDocAttr);
    await saveCustomAttr(parentDocId, parentDocAttr);
}

/**
 * 处理添加挂件
 * @param msgdata websocket信息的data属性
 */
async function addWidgetHandler(msgdata) {
    if (!isValidStr(msgdata)) return;
    let dividedPath = msgdata.path.split("/");
    let parentDocId = dividedPath[dividedPath.length - 2];
    let newDocId = msgdata.id;
    if (parentDocId == "") return;
    if (g_checkEmptyDocInsertWidget) {
        // 检查父文档是否为空
        // 获取父文档内容
        let parentDocContent = await getKramdown(parentDocId);
        // 简化判断，过长的父文档内容必定有文本，不插入 // 作为参考，空文档的kramdown长度约为400
        if (parentDocContent.length > 1000) {
            console.log("父文档较长，认为非空，不插入挂件", parentDocContent.length);
            return;
        }
        console.log(parentDocContent);

        // 清理ial和换行、空格
        let parentDocPlainText = parentDocContent;
        // 清理ial中的对象信息（例：文档块中的scrool字段），防止后面匹配ial出现遗漏
        parentDocPlainText = parentDocPlainText.replace(new RegExp('(?<=\"){[^\n]*}(?=\")', "gm"), "")
        console.log("替换内部对象中间结果", parentDocPlainText);
        // 清理ial
        parentDocPlainText = parentDocPlainText.replace(new RegExp('{:[^}]*}', "gm"), "");
        // 清理换行
        parentDocPlainText = parentDocPlainText.replace(new RegExp('\n', "gm"), "");
        // 清理空格
        parentDocPlainText = parentDocPlainText.replace(new RegExp(' +', "gm"), "");
        console.log(`父文档文本（+标记）为 ${parentDocPlainText}`);
        console.log(`父文档内容为空？${parentDocPlainText == ""}`);
        if (parentDocPlainText != "") return;
    }else{
        // 获取父文档属性，判断是否插入过挂件
        let parentDocAttr = await getblockAttrAPI(parentDocId).data;
        if (parentDocAttr != undefined && "id" in parentDocAttr && g_attrName in parentDocAttr) {
            return;
        }
    }
    // 若未插入/文档为空，则插入挂件
    let insertText = `<iframe src=\"/widgets/listChildDocs\" data-src=\"/widgets/listChildDocs\" data-subtype=\"widget\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>`;
    let addResponse;
    if (g_insertAtEnd) {
        addResponse = await appendBlockAPI(insertText, parentDocId);
    }else{
        addResponse = await prependBlockAPI(insertText, parentDocId);
    }
    if (addResponse == null) {
        console.warn("helper插入挂件失败");
        return;
    }
    // 写入文档属性
    if (!g_checkEmptyDocInsertWidget) {
        let attr = {};
        attr[g_attrName] = "{}";
        await addblockAttrAPI(attr, parentDocId);
    }
    console.log(`helper已自动插入挂件块${addResponse.id}，于父文档${parentDocId}`);
}

/**
 * 处理页签节点变化
 * 本部分只检查并执行删除链接，不检查新增
 */
// TODO: 打开页签时，刷新判断其下子文档变动，进行移除操作（对文档属性，检查其在子文档中是否存在）
async function tabChangeHandler(addedNodes) {
    let openDocIds = [];
    // WARN: UNSTABLE: 获取打开Tab的对应文档id
    // addedNodes.forEach(element => {
    // 重启监听后立刻执行检查时，传入的addedNodes类型为HTMLCollections，不支持forEach
    [].forEach.call(addedNodes, (element) => {
        let docDataId = element.getAttribute("data-id");
        // document.querySelector("div[data-id='7fadb0ac-e27d-4d2a-b910-0a8b5c185162']").querySelector(".protyle-background").getAttribute("data-node-id")
        if (document.querySelector(`div[data-id="${docDataId}"]`) == null) return;
        if (document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background") == null) return;
        let openDocId = document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background").getAttribute("data-node-id");
        openDocIds.push(openDocId);
    });
    console.log("刚开启的页签文档id", openDocIds);
    if (openDocIds.length <= 0) return;
    for (let docId of openDocIds) {
        let queryResult = await queryAPI(`SELECT box, path FROM blocks WHERE id = '${docId}'`);
        if (queryResult == null || queryResult.length < 1) {
            console.warn("获取文档路径失败，该文件可能是刚创建"); 
            return;
        }
        let subDocInfoList = await getSubDocsAPI(queryResult[0].box, queryResult[0].path);
        console.log("API子文档信息", subDocInfoList);
        if (subDocInfoList == null) {
            console.warn("获取子文档无结果");
            return;
        }
        // 读取属性，获取原来的内容
        let docCustomAttr = await getCustomAttr(docId);
        if (!docCustomAttr) {
            console.log("属性为空");
            return;
        }
        let docInfos = docCustomAttr.docInfo;
        console.log("属性中的文件信息", docInfos);
        // 需要从attr列表中移除的
        let removeIndex = [];
        // 需要加入到attr列表的（于API请求中的下标）
        let existDocSubDocIndex = [];
        docInfos.forEach(async (addedDocInfoBlock, index) => {
            let currentDocExistFlag = false;
            for (let [index, subDocInfo] of subDocInfoList.entries()) {
                if (addedDocInfoBlock.docId == subDocInfo.id) {
                    currentDocExistFlag = true;
                    // existDocSubDocIndex.push(index);
                    break;
                }
            }
            if (!currentDocExistFlag) {
                removeIndex.push(index);
                await removeBlockAPI(addedDocInfoBlock.linkId);
            }
        });
        console.log("Remove Indexes", removeIndex);
        if (removeIndex.length == 0) {
            console.log("未发现文档被删除");
            return;
        }
        let removedIds = [];
        for (let i = removeIndex.length - 1; i >= 0; i--) {
            removedIds.push(docInfos[i].docId);
            docInfos.splice(removeIndex[i], 1);
        }
        console.log("移除不存在的文档后", docInfos);
        await saveCustomAttr(docId, docCustomAttr);
    }

    return;
}
// 在data.ids字段
async function deleteHandler(msgdata) {
    if (!isValidStr(msgdata)) return;
    let deletDocsId = msgdata.ids;
    // TODO: 删除后，不知道父文档是哪个，无法删除对应的链接
}


async function getCustomAttr(parentDocId) {
    let docAttrResponse = await getblockAttrAPI(parentDocId);
    docAttrResponse = docAttrResponse.data;
    if (docAttrResponse == undefined || !("id" in docAttrResponse) || !(g_attrName in docAttrResponse)) {
        console.log("未获取到父文档属性");
        return null;
    }
    
    return JSON.parse(docAttrResponse[g_attrName].replaceAll("&quot;", "\""));
}

async function saveCustomAttr(parentDocId, customAttr) {
    let attrString = JSON.stringify(customAttr);
    let attr = {};
    attr[g_attrName] = attrString;
    let response = await addblockAttrAPI(attr, parentDocId);
}