/**
 * 创建顶栏按钮，快速插入子文档列表
 * 插入设置跟随config.js的custom_attr默认设置，只支持url 、 引用块 、 1.url、 1. 引用块模式。
 */
import { getCurrentDocIdF, queryAPI, getSubDocsAPI, insertBlockAPI, updateBlockAPI, prependBlockAPI, getDocOutlineAPI } from "./API.js";
import { printerList } from "./listChildDocsClass.js";
import { custom_attr, language } from "./config.js";
import { isValidStr, isSafelyUpdate, isInvalidValue, transfromAttrToIAL } from "./common.js";
import { setting } from "./config.js";

let myPrinter = new printerList[custom_attr.printMode]();

// SQL 获取文档详情
async function getTargetBlockBoxPath(currentDocId) {
    let queryResult = await queryAPI(`SELECT * FROM blocks WHERE id = '${currentDocId}'`);
    if (queryResult == null || queryResult.length != 1) throw new Error("获取当前打开的文档id错误", currentDocId);
    let notebook = queryResult[0].box;//笔记本名
    let g_targetDocPath = queryResult[0].path;// 块在笔记本下的路径
    return [notebook, g_targetDocPath];
}

// 递归获取全部
async function main() {
    let currentDocId = await getCurrentDocIdF();
    let [notebook, docPath] = await getTargetBlockBoxPath(currentDocId);
    let insertText = "";
    insertText = await getText(notebook, docPath, currentDocId);
    
    await addText2File(insertText, "", currentDocId);
}

// 绑定顶栏按钮
let barVipElem = document.getElementById("toolbarVIP");
barVipElem.insertAdjacentHTML("afterend", `
<button id="barAddChildDocList" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="快速插入子文档列表"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="M18 9v6"></path><path d="M21 12h-6"></path></svg></button>
`);
let barButton = document.getElementById("barAddChildDocList");
barButton.addEventListener(
    "click",
    async function (e) {
        e.stopPropagation();
        barButton.setAttribute("disabled", "true");
        barButton.setAttribute("aria-label", "正在插入");
        barButton.classList.add("toolbar__item--disabled");
        try {
            await main();
        }catch(err) {
            console.error("listChildDocs 快速插入时出现错误", err);
        }
        barButton.removeAttribute("disabled");
        barButton.setAttribute("aria-label", "快速插入子文档列表");
        barButton.classList.remove("toolbar__item--disabled");
    },
    false
);


// 
async function addText2File(markdownText, blockid = "", insertTargetId) {
    // 这里insertTargetId一定是文档id，所以isSafelyUpdate可以使用其进行只读判断
    if (isSafelyUpdate(insertTargetId, {widgetMode: true}, insertTargetId) == false) {
        throw new Error(language["readonly"]);
    }
    let attrData = {};
    //读取属性.blockid为null时不能去读
    if (isValidStr(blockid) && setting.inheritAttrs) {
        //判断是否是分列的目录块（是否是超级块）
        // let subLists = await queryAPI(`SELECT id FROM blocks WHERE type = 'l' AND parent_id IN (SELECT id from blocks where parent_id = '${blockid}' and type = 's')`);
        let subDirectLists = await queryAPI(`SELECT id FROM blocks WHERE type = 'l' AND parent_id = '${blockid}'`);
        // console.log("超级块内超级块下的列表数？", subLists.length);
        // console.log("超级块下直接的列表数", subDirectLists.length);
        //如果是分列的目录块，那么以超级块中一个随机的无序列表的属性为基准，应用于更新后的块
        attrData = await getblockAttrAPI(subDirectLists.length >= 1 ? subDirectLists[0].id : blockid);
        // console.log("更新前，", subDirectLists, "attrGet", attrData);
        attrData = attrData.data;
        //避免重新写入id和updated信息
        delete attrData.id;
        delete attrData.updated;
    }else if (setting.blockInitAttrs != undefined){ // 为新创建的列表获取默认属性
        attrData = Object.assign({}, setting.blockInitAttrs);
    }
    // 导入模式属性
    let modeCustomAttr = myPrinter.getAttributes();
    if (!isInvalidValue(modeCustomAttr)) {
        attrData = Object.assign(attrData, modeCustomAttr);
    }
    // 分列操作（分列并使得列继承属性）
    if (custom_attr.listColumn > 1 && setting.inheritAttrs && setting.superBlockBeta) {
        markdownText = myPrinter.splitColumns(markdownText, custom_attr["listColumn"], custom_attr["listDepth"], attrData);
    }

    // 将属性以IAL的形式写入text，稍后直接更新块
    let blockAttrString = transfromAttrToIAL(attrData);
    if (blockAttrString != null) {
        markdownText += "\n" + blockAttrString;
    }
    //创建/更新块
    let response;
    // 变为后置子块插入
    response = await prependBlockAPI(markdownText, insertTargetId);
}

//获取子文档层级目录输出文本
async function getText(notebook, nowDocPath, currentDocId) {
    if (myPrinter == undefined) {
        console.error("输出类Printer错误", myPrinter);
        throw Error(language["wrongPrintMode"]);
    }
    let insertData = myPrinter.beforeAll();
    let rawData = "";
    let rowCountStack = new Array();
    rowCountStack.push(1);
    
    // 单独处理起始为笔记本上级的情况
    if (notebook === "/") {
        rawData = await getTextFromNotebooks(rowCountStack);
    }else{
        // 单独处理 返回父文档../
        // 用户自行指定目标时，不附加../
        if (!isValidStr(custom_attr["targetId"]) &&
          (setting.backToParent == "true" || (setting.backToParent == "auto" && window.screen.availWidth <= 768)) &&
          myPrinter.write2file == 0) {
            let tempPathData = nowDocPath.split("/");
            // 排除为笔记本、笔记本直接子文档的情况，split后首个为''
            if (tempPathData.length > 2) {
                let tempVirtualDocObj = {
                    id: tempPathData[tempPathData.length - 2],
                    name: "../",
                    icon: "1f519"//图标🔙
                };
                rawData += myPrinter.align(rowCountStack.length);
                rawData += myPrinter.oneDocLink(tempVirtualDocObj, rowCountStack);
                rowCountStack[rowCountStack.length - 1]++;
            }
        }
        // 处理大纲和子文档两种情况，子文档情况兼容从笔记本级别列出
        if (custom_attr.listDepth == 0) {
            rawData = await getDocOutlineText(currentDocId, false, rowCountStack);
        } else {
            rawData = await getOneLevelText(notebook, nowDocPath, rawData, rowCountStack);//层级从1开始
        }
    }

    if (rawData == "") {
        if (custom_attr.listDepth > 0) {
            rawData = myPrinter.noneString(language["noChildDoc"]);
        } else {
            rawData = myPrinter.noneString(language["noOutline"]);
        }
    }
    insertData += rawData + myPrinter.afterAll();
    return insertData;
}

/**
 * 从笔记本上级列出子文档
 * @param {*} notebook 
 * @param {*} nowDocPath 
 * @return 返回的内容非累加内容，覆盖返回
 */
async function getTextFromNotebooks(rowCountStack) {
    let result = "";
    // 防止没有获取到笔记本列表
    if (g_notebooks == null) {
        g_notebooks = await getNodebookList();
    }
    // 遍历笔记本
    for (let i = 0; i < g_notebooks.length; i++) {
        // 关闭的笔记本无法跳转，没有创建的意义
        if (g_notebooks[i].closed == true) continue;
        // 插入笔记本名和笔记本图标（本部分逻辑同getOneLevelText）
        let tempVirtualDocObj = {
            id: "",
            name: g_notebooks[i].name,
            icon: g_notebooks[i].icon === "" ? "1f5c3" : g_notebooks[i].icon
        };
        result += myPrinter.align(rowCountStack.length);
        result += myPrinter.oneDocLink(tempVirtualDocObj, rowCountStack);
        // 处理笔记本下级文档
        if ((rowCountStack.length + 1) <= custom_attr.listDepth) {
            result += myPrinter.beforeChildDocs(rowCountStack.length);
            rowCountStack.push(1);
            result = await getOneLevelText(g_notebooks[i].id, "/", result, rowCountStack);
            rowCountStack.pop();
            result += myPrinter.afterChildDocs(rowCountStack.length);
        }
        rowCountStack[rowCountStack.length - 1]++;
    }
    return result;
}

/**
 * 获取一层级子文档输出文本
 * @param {*} notebook 
 * @param {*} nowDocPath 
 * @param {*} insertData 
 * @param {*} rowCountStack 
 * @returns 返回的内容非累加内容，需=接收
 */
async function getOneLevelText(notebook, nowDocPath, insertData, rowCountStack) {
    if (rowCountStack.length > custom_attr.listDepth) {
        return insertData;
    }
    let docs = await getSubDocsAPI(notebook, nowDocPath);
    //生成写入文本
    for (let doc of docs) {
        insertData += myPrinter.align(rowCountStack.length);
        insertData += myPrinter.oneDocLink(doc, rowCountStack);
        if (doc.subFileCount > 0 && (rowCountStack.length + 1) <= custom_attr.listDepth) {//获取下一层级子文档
            insertData += myPrinter.beforeChildDocs(rowCountStack.length);
            rowCountStack.push(1);
            insertData = await getOneLevelText(notebook, doc.path, insertData, rowCountStack);
            rowCountStack.pop();
            insertData += myPrinter.afterChildDocs(rowCountStack.length);
        } else if (custom_attr.endDocOutline && custom_attr.outlineDepth > 0) {//终端文档列出大纲
            let outlines = await getDocOutlineAPI(doc.id);
            if (outlines != null) {
                insertData += myPrinter.beforeChildDocs(rowCountStack.length);
                rowCountStack.push(1);
                insertData += getOneLevelOutline(outlines, true, rowCountStack);
                rowCountStack.pop();
                insertData += myPrinter.afterChildDocs(rowCountStack.length);
            }
        }
        rowCountStack[rowCountStack.length - 1]++;
    }
    return insertData;
}

/**
 * 生成文档大纲输出文本
 * @param {*} docId
 * @param {*} distinguish 区分大纲和页面，如果同时列出文档且需要区分，为true
 * @param {*} rowCountStack 生成行数记录
 * @return {*} 仅大纲的输出文本，（返回内容为累加内容）如果有其他，请+=保存
 */
async function getDocOutlineText(docId, distinguish, rowCountStack) {
    let outlines = await getDocOutlineAPI(docId);
    if (outlines == null) { console.warn("获取大纲失败"); return ""; }
    let result = "";
    result += getOneLevelOutline(outlines, distinguish, rowCountStack);
    return result;
}

/**
 * 生成本层级大纲文本
 * @param {*} outlines 大纲对象
 * @param {*} distinguish 区分大纲和页面，如果同时列出文档且需要区分，为true
 * @param {*} rowCountStack 生成行数记录
 * @returns 本层级及其子层级大纲生成文本，请+=保存；
 */
function getOneLevelOutline(outlines, distinguish, rowCountStack) {
    //大纲层级是由API返回值确定的，混合列出时不受“层级”listDepth控制
    if (outlines == null || outlines == undefined || outlines.length <= 0
        || outlines[0].depth >= custom_attr.outlineDepth) return "";
    let result = "";
    for (let outline of outlines) {
        if (!isValidStr(outline.name)) {//处理内部大纲类型NodeHeading的情况，也是由于Printer只读取name属性
            outline.name = outline.content;
        }
        if (distinguish) {
            outline.name = setting.outlineDistinguishingWords + outline.name;
        }
        result += myPrinter.align(rowCountStack.length);
        result += myPrinter.oneDocLink(outline, rowCountStack);
        if (outline.type === "outline" && outline.blocks != null) {
            result += myPrinter.beforeChildDocs();
            rowCountStack.push(1);
            result += getOneLevelOutline(outline.blocks, distinguish, rowCountStack);
            rowCountStack.pop();
            result += myPrinter.afterChildDocs();
        } else if (outline.type == "NodeHeading" && outline.children != null) {
            result += myPrinter.beforeChildDocs();
            rowCountStack.push(1);
            result += getOneLevelOutline(outline.children, distinguish, rowCountStack);
            rowCountStack.pop();
            result += myPrinter.afterChildDocs();
        } else if (outline.type != "outline" && outline.type != "NodeHeading") {
            console.warn("未被处理的大纲情况");
        }
        rowCountStack[rowCountStack.length - 1]++;
    }
    return result;
}
