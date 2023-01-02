/**
 * addChildDocLink.js 全局监视文件创建/删除操作，向父文档插入文本内容
 * 此代码文件是listChildDocs的一部分，若未经修改，不能单独作为代码片段插入。
 * 
 * 使用方法：
 * 设置-外观-代码片段-添加js片段： import("/widgets/listChildDocs/src/addChildDocLinkHelper.js");
 * 触发方式/触发条件：websocket message事件，cmd为"create" / "removeDoc"
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
    getKramdown
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
mywebsocket.addEventListener("message", (msg) => {
    if (msg && msg.data){
        let wsmessage = JSON.parse(msg.data);
        if (wsmessage.cmd == "create") {
            console.log(wsmessage);
            switch (g_mode) {
                case "插入挂件":
                case "add_list_child_docs": {
                    addWidgetHandler(wsmessage.data);
                    break;
                }
                case "插入链接":
                case "add_link": {
                    createHandler(wsmessage.data);
                    break;
                }
                default: {
                    console.log("配置错误");
                }
            }
        }
        // else if (wsmessage.cmd == "removeDoc") {
        //     console.log(wsmessage);
        //     // TODO: 删除链接 
        // }
    }
});

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
    // DONE: 保存链接信息到文档属性，但暂时无法完成删除，写入这个属性没意义
    // 生成链接信息
    // let parentDocAttr = await getCustomAttr(parentDocId);
    // console.log("获取到", parentDocAttr);
    // let newDocInfoBlock = Object.assign({}, docInfoBlockTemplate);
    // newDocInfoBlock.docId = newDocId;
    // newDocInfoBlock.linkId = childDocLinkId;
    // if (parentDocAttr && "docInfo" in parentDocAttr) {
    //     parentDocAttr.docInfo.push(newDocInfoBlock);
    // }else if (parentDocAttr){
    //     parentDocAttr["docInfo"] = [newDocInfoBlock];
    // }else{
    //     parentDocAttr = {};
    //     parentDocAttr["docInfo"] = [newDocInfoBlock];
    // }
    // console.log("写入", parentDocAttr);
    // // 保存链接信息
    // await saveCustomAttr(parentDocId, parentDocAttr);
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
 * 比较器：比较原有子块和现有子块，做对应更改
 */
async function compareAddHandler(msgdata) {
    // TODO: 发生删除后，不知道父文档是哪个，无法对应进行子文档动态对比；但可以在新建文档时执行
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
    console.log("返回值", addResponse);
    // TODO: 判断哪些文档被删除，移除对应的链接
    // 生成链接信息
    // let parentDocAttr = await getCustomAttr(parentDocId);
    // console.log("获取到", parentDocAttr);
    // let newDocInfoBlock = Object.assign({}, docInfoBlockTemplate);
    // newDocInfoBlock.docId = newDocId;
    // newDocInfoBlock.linkId = childDocLinkId;
    // if (parentDocAttr && "docInfo" in parentDocAttr) {
    //     parentDocAttr.docInfo.push(newDocInfoBlock);
    // }else if (parentDocAttr){
    //     parentDocAttr["docInfo"] = [newDocInfoBlock];
    // }else{
    //     parentDocAttr = {};
    //     parentDocAttr["docInfo"] = [newDocInfoBlock];
    // }
    // console.log("写入", parentDocAttr);
    // TODO: getBlockPath获取子文档数据，比对是否有不存在的子文档
    // // 保存链接信息
    // await saveCustomAttr(parentDocId, parentDocAttr);
}
// 在data.ids字段
async function deleteHandler(msgdata) {
    if (!isValidStr(msgdata)) return;
    let deletDocsId = msgdata.ids;
    // TODO: 删除后，不知道父文档是哪个，无法删除对应的链接
}


async function getCustomAttr(parentDocId) {
    let docAttrResponse = await getblockAttrAPI(parentDocId).data;
    if (docAttrResponse == undefined || !("id" in docAttrResponse) || !(g_attrName in docAttrResponse)) {
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