/**
 * addChildDocLink.js 全局监视文件创建/删除操作，向父文档插入文本内容
 * 此代码文件是listChildDocs的一部分，基于AGPL-3.0许可协议开源。（许可协议详见：https://www.gnu.org/licenses/agpl-3.0.txt，或本项目根目录/LICENSE文件）
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
    appendBlockAPI,
    prependBlockAPI,
    getKramdown,
    removeBlockAPI,
    updateBlockAPI
} from './API.js';
import {
    helperSettings,
    language,
    setting
} from './config.js';
import {
    isSafelyUpdate,
    isValidStr
} from './common.js';
/* 全局变量和快速自定义设置 */
let g_attrName = helperSettings.attrName;
let g_docLinkTemplate = helperSettings.docLinkTemplate;
// 将文本内容插入到文档末尾？
let g_insertAtEnd = helperSettings.insertAtEnd;
let g_mode = helperSettings.mode;
let g_checkEmptyDocInsertWidget = helperSettings.checkEmptyDocInsertWidget;
let g_removeLink = helperSettings.removeLinkEnable;
let g_renameLink = helperSettings.renameLinkEnable;
let CONSTANTS = {
    RANDOM_DELAY: 300, // 插入挂件的延迟最大值，300（之后会乘以10）对应最大延迟3秒
    OBSERVER_RANDOM_DELAY: 500, // 插入链接、引用块和自定义时，在OBSERVER_RANDOM_DELAY_ADD的基础上增加延时，单位毫秒
    OBSERVER_RANDOM_DELAY_ADD: 100, // 插入链接、引用块和自定义时，延时最小值，单位毫秒
    OBSERVER_RETRY_INTERVAL: 1000, // 找不到页签时，重试间隔
}
let g_observerRetryInterval;
let g_observerStartupRefreshTimeout;
let g_TIMER_LABLE_NAME_COMPARE = "acdlh子文件比对";
let g_insertWidgetPath = helperSettings.widgetPath;
/*
目前支持g_mode取值为
插入挂件 add_list_child_docs
插入链接 add_link
插入引用块 add_ref
插入自定义 add_custom
*/
// let g_insertToParentDoc = true;
// let g_insertWidgetToParent = true;
const docInfoBlockTemplate = {
    docId: "", // 子文档id
    linkId: "", // 链接所在块id
    docName: "", // 文档名
}

/* ********************  事件触发器（当发生事件时调用处理函数） ******************** */

let g_mywebsocket = window.siyuan.ws.ws;


/**
 * 页签变更触发器
 * 使用当前页面监视获得触发，不会和其他页面执行冲突。但无法处理多用户的情况。
 * WARN: UNSTABLE: 依赖页签栏、窗口元素。
 */
let g_tabbarElement;
// 处理找不到Element的情况，interval重试寻找
let tabBarObserver = new MutationObserver((mutationList) =>{
    for (let mutation of mutationList) {
        // console.log("发现页签变化", mutation);
        // if (mutation.addedNodes.length > 0) {
        //     setTimeout(() => {tabChangeHandler(mutation.addedNodes)}, Math.round(Math.random() * CONSTANTS.OBSERVER_RANDOM_DELAY) + CONSTANTS.OBSERVER_RANDOM_DELAY_ADD);
        // }
        // 由windowObserver代管。关闭页签后，tabBar移除重设，触发器锚定的元素丢失，不会触发
    }
});

/**处理分屏的情况：若页签栏刷新，则触发重设页签变更触发器
 * WARN: 依赖窗口变化
 * */ 
let windowObserver = new MutationObserver((mutationList) => {
    for (let mutation of mutationList) {
        // console.log("发现窗口变化", mutation);
        if (mutation.removedNodes.length > 0 || mutation.addedNodes.length > 0) {
            // console.log("断开Observer");
            // tabBarObserver.disconnect();
            switchTabObserver.disconnect();
            clearInterval(g_observerRetryInterval);
            g_observerRetryInterval = setInterval(observerRetry, CONSTANTS.OBSERVER_RETRY_INTERVAL);
        }
        
    }
    
});

let switchTabObserver = new MutationObserver(async (mutationList) => {
    for (let mutation of mutationList) {
        // console.log("发现页签切换", mutation);
        setTimeout(async () => {
            console.time(g_TIMER_LABLE_NAME_COMPARE);
            try{
                if (helperSettings.switchTabEnable) {
                    if (g_mode == "插入挂件" || g_mode == "add_list_child_docs") {
                        await tabChangeWidgetHandler([mutation.target]);
                    }else{
                        await tabChangeHandler([mutation.target]);
                    }
                }else {
                    if (g_mode == "插入挂件" || g_mode == "add_list_child_docs") {
                        await tabChangeWidgetHandler(mutation.addedNodes);
                    }else{
                        await tabChangeHandler(mutation.addedNodes);
                    }
                }
                
            }catch(err) {
                console.error(err);
            }
            console.timeEnd(g_TIMER_LABLE_NAME_COMPARE);
        }, Math.round(Math.random() * CONSTANTS.OBSERVER_RANDOM_DELAY) + CONSTANTS.OBSERVER_RANDOM_DELAY_ADD);
    }
});

// 窗口变化监视器设定
let g_centerLayoutElement = window.siyuan.layout.centerLayout.element;

// 只有移除link为启用时才执行
function startObserver() {
    clearInterval(g_observerRetryInterval);
    g_observerRetryInterval = setInterval(observerRetry, CONSTANTS.OBSERVER_RETRY_INTERVAL);
    windowObserver.observe(g_centerLayoutElement, {childList: true});
}
/**
 * 重试页签监听
 */
function observerRetry() {
    g_tabbarElement = window.siyuan.layout.centerLayout.element.querySelectorAll("[data-type='wnd'] ul.layout-tab-bar");
    if (g_tabbarElement.length > 0) {
        // console.log("重新监视页签变化");
        g_tabbarElement.forEach((element)=>{
            if (helperSettings.switchTabEnable) {
                switchTabObserver.observe(element, {"attributes": true, "attributeFilter": ["data-activetime"], subtree: true});
            }else{
                switchTabObserver.observe(element, {childList: true});
            }
            // 重启监听后立刻执行检查
            if (element.children.length > 0) {
                // clearTimeout(g_observerStartupRefreshTimeout);
                g_observerStartupRefreshTimeout = setTimeout(async () => {
                    console.time(g_TIMER_LABLE_NAME_COMPARE);
                    try{
                        if (g_mode == "插入挂件" || g_mode == "add_list_child_docs") {
                            await tabChangeWidgetHandler(element.children);
                        }else{
                            await tabChangeHandler(element.children);
                        }
                    }catch (err) {
                        console.error(err);
                    }
                    console.timeEnd(g_TIMER_LABLE_NAME_COMPARE);
                }, Math.round(Math.random() * CONSTANTS.OBSERVER_RANDOM_DELAY) + CONSTANTS.OBSERVER_RANDOM_DELAY_ADD);
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
                setTimeout(() => {addWidgetHandler(wsmessage.data)}, random);
                console.log("随机延迟", random);
            }
            // OR "transactions"  "removeDoc"
        }
    }catch(err) {
        console.error(language["helperErrorHint"], err);
        g_mywebsocket.removeEventListener("message", websocketEventHandler);
    }
}
/* ********************  事件处理（插入/移除执行函数）******************** */

/**
 * 处理新建文档
 * @param msgdata websocket信息的data属性
 */
async function createHandler(msgdata) {
    if (!isValidStr(msgdata)) return;
    let dividedPath = msgdata.path.split("/");
    let parentDocId = dividedPath[dividedPath.length - 2];
    let newDocId = msgdata.id;
    if (!isSafelyUpdate(parentDocId)) {
        console.log("只读模式，已停止操作");
        return;
    }
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


async function isDocEmpty(docId) {
    // 检查父文档是否为空
    // 获取父文档内容
    let parentDocContent = await getKramdown(docId);
    // 简化判断，过长的父文档内容必定有文本，不插入 // 作为参考，空文档的kramdown长度约为400
    if (parentDocContent.length > 1000) {
        console.log("父文档较长，认为非空，不插入挂件", parentDocContent.length);
        return;
    }
    // console.log(parentDocContent);
    // 清理ial和换行、空格
    let parentDocPlainText = parentDocContent;
    // 清理ial中的对象信息（例：文档块中的scrool字段），防止后面匹配ial出现遗漏
    parentDocPlainText = parentDocPlainText.replace(new RegExp('\\"{[^\n]*}\\"', "gm"), "\"\"")
    // console.log("替换内部对象中间结果", parentDocPlainText);
    // 清理ial
    parentDocPlainText = parentDocPlainText.replace(new RegExp('{:[^}]*}', "gm"), "");
    // 清理换行
    parentDocPlainText = parentDocPlainText.replace(new RegExp('\n', "gm"), "");
    // 清理空格
    parentDocPlainText = parentDocPlainText.replace(new RegExp(' +', "gm"), "");
    console.log(`父文档文本（+标记）为 ${parentDocPlainText}`);
    console.log(`父文档内容为空？${parentDocPlainText == ""}`);
    if (parentDocPlainText != "") return false;
    return true;
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
    if (!isSafelyUpdate(parentDocId, {"targetDoc": false})) {
        console.log("只读模式，已停止操作");
        return;
    }
    if (parentDocId == "") return;
    if (g_checkEmptyDocInsertWidget) {
        // 检查父文档是否为空
        if (!await isDocEmpty(parentDocId)) return;
    }else{
        // 获取父文档属性，判断是否插入过挂件
        let parentDocAttr = await getblockAttrAPI(parentDocId).data;
        if (parentDocAttr != undefined && "id" in parentDocAttr && g_attrName in parentDocAttr) {
            return;
        }
    }
    let addedWidgetIds = [];
    // 若未插入/文档为空，则插入挂件
    for (let widgetPath of g_insertWidgetPath) {
        let insertText = `<iframe src=\"${widgetPath}\" data-src=\"${widgetPath}\" data-subtype=\"widget\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>`;
        let addResponse;
        if (g_insertAtEnd) {
            addResponse = await appendBlockAPI(insertText, parentDocId);
        }else{
            addResponse = await prependBlockAPI(insertText, parentDocId);
        }
        if (addResponse == null) {
            console.warn(`helper插入挂件失败`, widgetPath);
        }else{
            addedWidgetIds.push(addResponse.id);
        }
    }
    
    // 写入文档属性
    if (!g_checkEmptyDocInsertWidget) {
        let attr = {};
        attr[g_attrName] = "{}";
        await addblockAttrAPI(attr, parentDocId);
    }
    console.log(`helper已自动插入挂件块${addedWidgetIds}，于父文档${parentDocId}`);
}


/**
 * 处理页签变化，对打开的空白父文档执行插入挂件操作
 * @param {*} addedNodes 
 */
async function tabChangeWidgetHandler(addedNodes) {
    let openDocIds = [];
    let safelyUpdateFlag = true;
    // WARN: UNSTABLE: 获取打开Tab的对应文档id
    // addedNodes.forEach(element => {
    // 重启监听后立刻执行检查时，传入的addedNodes类型为HTMLCollections，不支持forEach
    [].forEach.call(addedNodes, (element) => {
        let docDataId = element.getAttribute("data-id");
        // document.querySelector("div[data-id='7fadb0ac-e27d-4d2a-b910-0a8b5c185162']").querySelector(".protyle-background").getAttribute("data-node-id")
        if (document.querySelector(`div[data-id="${docDataId}"]`) == null) return;
        if (document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background") == null) return;
        let openDocId = document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background").getAttribute("data-node-id");
        if (!isSafelyUpdate(openDocId)) {
            safelyUpdateFlag = false;
            return;
        }
        openDocIds.push(openDocId);
    });
    if (!safelyUpdateFlag) {
        console.log("只读模式，已停止操作");
        return;
    }
    console.log("刚开启的页签文档id", openDocIds);
    if (openDocIds.length <= 0) return;
    for (let docId of openDocIds) {
        // 判断是否为父文档
        let queryResult = await queryAPI(`SELECT * FROM blocks WHERE path like '%${docId}/%' and type = "d"`);
        console.log("子文档信息", queryResult);
        if (!isValidStr(queryResult) || queryResult <= 0) {
            console.log("并非父文档");
            return;
        }
        // 判断父文档是否为空
        if (g_checkEmptyDocInsertWidget) {
            // 检查父文档是否为空
            if (!await isDocEmpty(docId)) return;
        }else{
            // 获取父文档属性，判断是否插入过挂件
            let parentDocAttr = await getblockAttrAPI(docId).data;
            if (parentDocAttr != undefined && "id" in parentDocAttr && g_attrName in parentDocAttr) {
                return;
            }
        }
        // 执行插入
        let addedWidgetIds = [];
        // 若未插入/文档为空，则插入挂件
        for (let widgetPath of g_insertWidgetPath) {
            let insertText = `<iframe src=\"${widgetPath}\" data-src=\"${widgetPath}\" data-subtype=\"widget\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>`;
            let addResponse;
            if (g_insertAtEnd) {
                addResponse = await appendBlockAPI(insertText, docId);
            }else{
                addResponse = await prependBlockAPI(insertText, docId);
            }
            if (addResponse == null) {
                console.warn(`helper插入挂件失败`, widgetPath);
            }else{
                addedWidgetIds.push(addResponse.id);
            }
        }
        
        // 写入文档属性
        if (!g_checkEmptyDocInsertWidget) {
            let attr = {};
            attr[g_attrName] = "{}";
            await addblockAttrAPI(attr, docId);
        }
        console.log(`helper已自动插入挂件块${addedWidgetIds}，于父文档${docId}`);
    }
}

/**
 * 处理页签节点变化
 * 本部分只检查并执行删除链接，不检查新增
 */
// TODO: 打开页签时，刷新判断其下子文档变动，进行增加、移除操作（对文档属性，检查其在子文档中是否存在）
async function tabChangeHandler(addedNodes) {
    let openDocIds = [];
    let safelyUpdateFlag = true;
    // WARN: UNSTABLE: 获取打开Tab的对应文档id
    // addedNodes.forEach(element => {
    // 重启监听后立刻执行检查时，传入的addedNodes类型为HTMLCollections，不支持forEach
    [].forEach.call(addedNodes, (element) => {
        let docDataId = element.getAttribute("data-id");
        // document.querySelector("div[data-id='7fadb0ac-e27d-4d2a-b910-0a8b5c185162']").querySelector(".protyle-background").getAttribute("data-node-id")
        if (document.querySelector(`div[data-id="${docDataId}"]`) == null) return;
        if (document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background") == null) return;
        let openDocId = document.querySelector(`div[data-id="${docDataId}"]`).querySelector(".protyle-background").getAttribute("data-node-id");
        if (!isSafelyUpdate(openDocId)) {
            safelyUpdateFlag = false;
            return;
        }
        openDocIds.push(openDocId);
    });
    if (!safelyUpdateFlag) {
        console.log("只读模式，已停止操作");
        return;
    }
    console.log("刚开启的页签文档id", openDocIds);
    if (openDocIds.length <= 0) return;
    for (let docId of openDocIds) {
        let queryResult = await queryAPI(`SELECT box, path FROM blocks WHERE id = '${docId}'`);
        if (queryResult == null || queryResult.length < 1) {
            console.warn("获取文档路径失败，文档可能刚创建"); 
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
        if (!docCustomAttr || !("docInfo" in docCustomAttr)) {
            console.log("属性为空", docCustomAttr);
            docCustomAttr = {
                "docInfo": []
            };
        }
        // 由于赋值的是引用，修改会同步。
        let docInfos = docCustomAttr.docInfo;
        console.log("属性中的文件信息", docInfos);
        // 已经被删除的文档在属性列表中的下标(需要被移除的链接)
        let removeIndex = [];
        // 已经添加过链接的子文档在API请求列表中的下标
        let existDocSubDocIndex = [];
        // 需要修改文件名的文档在两个列表中的下标
        let renameNeededDocIndexBlockList = [];
        let needUpdateAttrFlag = false;
        docInfos.forEach(async (addedDocInfoBlock, index) => {
            let currentDocExistFlag = false;
            for (let [subDocIndex, subDocInfo] of subDocInfoList.entries()) {
                if (addedDocInfoBlock.docId == subDocInfo.id) {
                    currentDocExistFlag = true;
                    existDocSubDocIndex.push(subDocIndex);
                    if (addedDocInfoBlock.docName != subDocInfo.name.substring(0, subDocInfo.name.length - 3)) {
                        // renameIndexInfo 对象格式：
                        renameNeededDocIndexBlockList.push({
                            attrListIndex: index,
                            subDocListIndex: subDocIndex
                        });
                    }
                    break;
                }
            }
            if (!currentDocExistFlag) {
                removeIndex.push(index);
                await removeBlockAPI(addedDocInfoBlock.linkId);
            }
        });
        console.log("Remove Indexes", removeIndex);
        // 重命名（依赖原有属性中文件列表的顺序，在执行此部分之前，不要增加/删除docInfos数组中的元素）
        if (renameNeededDocIndexBlockList.length > 0 && g_renameLink) {
            console.log("需要重命名的链接", renameNeededDocIndexBlockList);
            for (let renameIndexInfo of renameNeededDocIndexBlockList) {
                let docName = subDocInfoList[renameIndexInfo.subDocListIndex].name;
                docName = docName.substring(0, docName.length - 3);
                docInfos[renameIndexInfo.attrListIndex].docName = docName;
                // 更新链接
                let updateText;
                updateText = g_docLinkTemplate.replaceAll("%DOC_ID%", subDocInfoList[renameIndexInfo.subDocListIndex].id)
                                .replaceAll("%DOC_NAME%", docName);
                updateText += `\n{: memo=\"${language["helperAddBlockMemo"]}\"}`;
                let updateResponse = await updateBlockAPI(updateText, docInfos[renameIndexInfo.attrListIndex].linkId);
                // 更新失败的块，移除
                if (updateResponse == null) {
                    console.warn(`对应文档${docInfos[renameIndexInfo.attrListIndex].docId}的子文档链接块${docInfos[renameIndexInfo.attrListIndex].linkId}更新失败，该块的记录将被移除，稍后重新创建。`);
                    removeIndex.push(renameIndexInfo.attrListIndex);
                    let removeInfoBlockIndex = existDocSubDocIndex.indexOf(renameIndexInfo.subDocListIndex);
                    if (removeInfoBlockIndex != -1) {
                        existDocSubDocIndex.splice(removeInfoBlockIndex, 1);
                    }
                }
            }
            needUpdateAttrFlag = true;
        }else{
            if (g_renameLink) console.log("未发现子文档文档名变化");
        }
        // 删除
        if (removeIndex.length > 0 && g_removeLink) {
            let removedIds = [];
            for (let i = removeIndex.length - 1; i >= 0; i--) {
                removedIds.push(docInfos[i].docId);
                docInfos.splice(removeIndex[i], 1);
            }
            needUpdateAttrFlag = true;
        }else{
            if (g_removeLink) console.log("未发现文档被删除");
        }

        // 新增文档链接，这些文档链接直接插入到属性中文件列表，在此操作之后，不要删除docInfos中的元素
        if (existDocSubDocIndex.length != subDocInfoList.length) {
            for (let [index, subDocInfo] of subDocInfoList.entries()) {
                if (existDocSubDocIndex.indexOf(index) == -1) {
                    let newDocInfoBlock = Object.assign({}, docInfoBlockTemplate);
                    newDocInfoBlock.docId = subDocInfo.id;
                    newDocInfoBlock.docName = subDocInfo.name.substring(0, subDocInfo.name.length - 3);
                    let insertText;
                    insertText = g_docLinkTemplate.replaceAll("%DOC_ID%", newDocInfoBlock.docId)
                                    .replaceAll("%DOC_NAME%", newDocInfoBlock.docName);
                    insertText += `\n{: memo=\"${language["helperAddBlockMemo"]}\"}`;
                    let addResponse;
                    if (g_insertAtEnd) {
                        addResponse = await appendBlockAPI(insertText, docId);
                    }else{
                        addResponse = await prependBlockAPI(insertText, docId);
                    }
                    let newLinkId = addResponse.id;
                    newDocInfoBlock.linkId = newLinkId;
                    docInfos.push(newDocInfoBlock);
                    // console.log("插入新文档信息块", newDocInfoBlock);
                }
            }
            needUpdateAttrFlag = true;
        }else{
            console.log("未发现新增文档");
        }
        if (!needUpdateAttrFlag) return;
        console.log("修改后", docInfos);
        await saveCustomAttr(docId, docCustomAttr);
    }

    return;
}

/* ******************** 工具方法 ******************** */


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

/* ******************** 模式切换 ******************** */

console.log(`用户设定：插入到结尾？${g_insertAtEnd} 移除？${g_removeLink} 重命名？${g_renameLink}`);
switch (g_mode) {
    case "插入挂件": 
    case "add_list_child_docs":{
        if (!g_insertAtEnd) g_insertAtEnd = false;
        /*
         * 添加触发器，任意操作均触发，只在新建文件行为发生时执行；
         * WARN: 编辑过程中会高频触发，可能导致卡顿；
         */
        if (setting.safeModePlus && helperSettings.insertWidgetMoment == "create") g_mywebsocket.addEventListener("message", websocketEventHandler);
        if (setting.safeModePlus && helperSettings.insertWidgetMoment == "open") startObserver();
        break;
    }

    case "插入链接":
    case "add_link": {
        g_docLinkTemplate = "[%DOC_NAME%](siyuan://blocks/%DOC_ID%)";
        if (g_insertAtEnd == undefined || g_insertAtEnd == null) g_insertAtEnd = true;
        if (g_removeLink == undefined || g_removeLink == null) g_removeLink = true;
        if (g_renameLink == undefined || g_renameLink == null) g_renameLink = true;
        if (setting.safeModePlus) startObserver();
        break;
    }

    case "add_ref":
    case "插入引用块": {
        g_docLinkTemplate = "((%DOC_ID% '%DOC_NAME%'))";
        if (g_insertAtEnd == undefined || g_insertAtEnd == null) g_insertAtEnd = true;
        if (g_removeLink == undefined || g_removeLink == null) g_removeLink = true;
        if (g_renameLink == undefined || g_renameLink == null) g_renameLink = false;
        if (setting.safeModePlus) startObserver();
        break;
    }
    
    case "add_custom": 
    case "插入自定义": {
        if (g_insertAtEnd == undefined || g_insertAtEnd == null) g_insertAtEnd = true;
        if (g_removeLink == undefined || g_removeLink == null) g_removeLink = false;
        if (g_renameLink == undefined || g_renameLink == null) g_renameLink = false;
        if (setting.safeModePlus) startObserver();
        break;
    }

    default: {
        console.error("不支持的模式，请检查模式设置是否正确 / Unsupported mode, check your input please.");
    }
}

if (!setting.safeModePlus){
    console.warn("自动插入助手只在开启只读安全模式（safeModePlus）的前提下运行");
}

console.log(`未设定值修改为默认后：插入到结尾？${g_insertAtEnd} 移除？${g_removeLink} 重命名？${g_renameLink}`);