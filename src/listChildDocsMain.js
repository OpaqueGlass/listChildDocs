/**
 * listChildDocsMain.js
 * 挂件主体代码。
 * 
 * 标注有UNSTABLE:的方法或代码行，通过jQuery定位界面元素实现，当protyle界面变化时，很可能需要更改
 */
import { DefaultPrinter, printerList } from './listChildDocsClass.js';
import {
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    pushMsgAPI,
    getCurrentDocIdF,
    getCurrentWidgetId,
    updateBlockAPI,
    insertBlockAPI,
    checkOs,
    getDocOutlineAPI,
    getNodebookList,
    getKramdown,
    removeBlockAPI,
    removeDocAPI,
    renameDocAPI,
    isDarkMode,
    createDocWithMdAPI,
    createDocWithPath
} from './API.js';
import { custom_attr, language, setting } from './config.js';
import { openRefLink, showFloatWnd } from './ref-util.js';
import { generateBlockId, isInvalidValue, isSafelyUpdate, isValidStr, pushDebug, transfromAttrToIAL } from './common.js';

//将Markdown文本写入文件(当前挂件之后的块)
async function addText2File(markdownText, blockid = "") {
    if (isSafelyUpdate(thisDocId, {widgetMode: true}, thisWidgetId) == false) {
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
    if (isValidStr(blockid)) {
        response = await updateBlockAPI(markdownText, blockid);
    } else {
        response = await insertBlockAPI(markdownText, thisWidgetId);
    }
    if (response != null && isValidStr(response.id)) {
        //将子文档无序列表块id写入属性
        custom_attr['childListId'] = response.id;
    } else if (response == null || response.id == "") {
        //找不到块，移除原有属性
        custom_attr['childListId'] = "";
        console.warn("更新失败，下次将创建新块", blockid);
        await setCustomAttr();//移除id属性后需要保存
        throw Error(language["refreshNeeded"]);
    } else {
        console.error("插入/更新块失败", response.id);
        throw Error(language["insertBlockFailed"]);
    }
}

/**
 * 获取挂件属性custom-list-child-docs
 * 也包括了对挂件属性进行批量更改的代码
 * 仅用于初始化
 */ 
async function getCustomAttr() {
    let widgetNodeDom = window.frameElement.parentElement.parentElement;
    let response = {
        "data": {
            "custom-list-child-docs": null,
            "custom-lcd-cache": null,
            "custom-resize-flag": null,
            "id": thisWidgetId,
        },
    };
    for (let key in response.data) {
        if (key != "id") {
            response.data[key] = widgetNodeDom?.getAttribute(key);
        }else{
            response.data[key] = widgetNodeDom?.getAttribute("data-node-id");
        }
    }
    
    if (response.data['custom-lcd-cache'] == undefined && response.data["custom-list-child-docs"] == undefined) {
        console.warn("无法从DOM读取挂件属性，改为使用API", response);
        response = await getblockAttrAPI(thisWidgetId);
    }
    let attrObject = {};
    let attrResetFlag = false;
    let parseErrorFlag = false;
    let deleteBlockFlag = false;
    // 解析挂件设置
    if ('custom-list-child-docs' in response.data) {
        try {
            attrObject = JSON.parse(response.data['custom-list-child-docs'].replaceAll("&quot;", "\""));
        }catch(err) {
            console.warn("解析挂件属性json失败", err.message);
            parseErrorFlag = true;
        }
    }
    // 处理设置重设/移除请求
    if (setting.overwriteIndependentSettings && "id" in response.data
            && 'custom-list-child-docs' in response.data
            && setting.overwriteOrRemoveWhiteDocList.indexOf(thisDocId) == -1){
        console.info("重载挂件独立配置", thisWidgetId);
        if (setting.deleteChildListBlockWhileReset) {
            __refreshPrinter();
            // 仍为文档中，保留目录列表块id
            if (myPrinter.write2file == 1) {
                custom_attr.childListId = attrObject.childListId;
            }else{
                deleteBlockFlag = true;
            }
        }else{
            custom_attr.childListId = attrObject.childListId;
        }
        await setCustomAttr();
        attrResetFlag = true;
    }else if (setting.removeIndependentSettings && "id" in response.data
            && 'custom-list-child-docs' in response.data
            && setting.overwriteOrRemoveWhiteDocList.indexOf(thisDocId) == -1){
        if (setting.deleteChildListBlockWhileReset) deleteBlockFlag = true;
        console.info("移除挂件独立配置", thisWidgetId);
        await addblockAttrAPI({ "custom-list-child-docs": "" }, thisWidgetId);
        attrResetFlag = true;
    }
    // 清理原内容块
    if (deleteBlockFlag && isValidStr(attrObject.childListId)) {
        console.info("移除原内容块", attrObject.childListId);
        await removeBlockAPI(attrObject.childListId);
    }
    // 载入配置
    if ('custom-list-child-docs' in response.data && !attrResetFlag) {
        if (parseErrorFlag) {
            console.info("载入独立配置失败，将按默认值新建配置记录");
            return;
        }else{
            console.info("载入独立配置", attrObject);
        }
        Object.assign(custom_attr, attrObject);
    }
    if ('custom-lcd-cache' in response.data && !attrResetFlag) {
        g_contentCache = response.data["custom-lcd-cache"];
    }
    // Resize设定默认宽高
    if (!("custom-resize-flag" in response.data) && isValidStr(setting.saveDefaultWidgetStyle) && ("id" in response.data)) {
        // 写属性
        let data = {};
        data["custom-resize-flag"] = "listChildDocs: do not delete.请不要删去此属性，否则挂件将在下次加载时重新将挂件默认宽高写入文档中";
        let response = await addblockAttrAPI(data, thisWidgetId);
        // 获取kramdown
        let widgetKramdown = await getKramdown(thisWidgetId);
        // 重写Kramdown
        let newWidgetKramdown = "";
        console.debug("getKramdown", widgetKramdown);
        if (widgetKramdown.includes("/widgets/listChildDocs")) {
            if (widgetKramdown.includes("style=")) {
                newWidgetKramdown = widgetKramdown.replace(new RegExp(`style=".*"`, ""), `style="${setting.saveDefaultWidgetStyle}"`);
            }else{
                newWidgetKramdown = widgetKramdown.replace(new RegExp("><\/iframe>", ""), ` style="${setting.saveDefaultWidgetStyle}"><\/iframe>`);
            }
            console.log("【挂件更新自身样式信息】!", newWidgetKramdown);
            await updateBlockAPI(newWidgetKramdown, thisWidgetId);
        }else{
            console.log(widgetKramdown);
            console.warn("当前id不对应listChildDocs挂件，不设定挂件样式", thisWidgetId);
        }
        throw new Error(language["saveDefaultStyleFailed"]);
    }

    if (!("id" in response.data)) {
        throw Error(language["getAttrFailed"]);
    }
    // console.log("请求到的属性", JSON.stringify(response.data));
}

//统一写入attr到挂件属性
async function setCustomAttr() {
    // 载入模式最新设定
    let modeCustom = myPrinter?.save();
    if (!isInvalidValue(modeCustom)) {
        custom_attr["customModeSettings"] = modeCustom;
    }
    let attrString = JSON.stringify(custom_attr);
    let response = await addblockAttrAPI({ "custom-list-child-docs": attrString }, thisWidgetId);
    if (response != 0) {
        throw Error(language["writeAttrFailed"]);
    }
}

//获取子文档层级目录输出文本
async function getText(notebook, nowDocPath) {
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
            rawData = await getDocOutlineText(thisDocId, false, rowCountStack);
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

function debugPush(text, delay = 7000) {
    pushMsgAPI(text, 7000);
}

/**
 * 显示/隐藏设置
 * @param {boolean} showBtn 显示设置？true显示false隐藏
 */
function showSettingChanger(showBtn) {
    g_showSetting = showBtn;
    let display = showBtn ? "inline" : "none";
    $("#innerSetting *, #modeSetting *").css("display", display);
    if ((custom_attr.listDepth != 0 && !custom_attr.endDocOutline) && showBtn) {//层级不为0时不显示大纲层级
        $("#outlinedepth, #outlinedepthhint").css("display", "none");
    }
    if (myPrinter.write2file == 1) {//写入文档时重设挂件大小
        window.frameElement.style.height = showBtn ? setting.height_2file_setting : setting.height_2file;
    }
}

/**
 * 控制挂件内css分列（分栏），在页面宽度不足时强制重设分列数
 */
function setColumn() {
    let nColumns = custom_attr.listColumn;
    if (window.screen.availWidth <= 768) nColumns = "";
    $("#linksContainer").css("column-count", nColumns);
}

/**
 * 输出错误信息至挂件
 * @param {msgText} 错误信息
 * @param {boolean} clear 输出前是否清空 
 */
function printError(msgText, clear = true) {
    if (clear) $(".linksContainer *").remove();
    $("#linksContainer").css("column-count", "");//显示错误时不分栏
    $(`<ul><li class="linksListItem errorinfo">${language["error"]}` + msgText + `</li></ul>`).appendTo("#linksContainer");
    window.frameElement.style.height = "10em";
}


function saveContentCache(textString = g_contentCache) {
    console.info("[SAVE]保存缓存中");
    if (isSafelyUpdate(thisDocId, {widgetMode: true}, thisWidgetId) == false) {
        console.warn("在历史界面或其他只读状态，此次保存设置操作可能更改文档状态");
    }
    let response = addblockAttrAPI({ "custom-lcd-cache": textString }, thisWidgetId);
}

/**
 * 挂件内载入缓存
 * 也用于直接刷新
 * 内部使用modeDoUpdateFlag undefined与否判断是否载入的缓存，请注意
 */
async function loadContentCache(textString = g_contentCache, modeDoUpdateFlag = undefined, notebook = undefined, targetDocPath = undefined) {
    if (myPrinter.write2file) return false;
    if (!isValidStr(textString)) return false;
    if (notebook == undefined || targetDocPath == undefined) {
        [notebook, targetDocPath] = await getTargetBlockBoxPath();
    }
    let updateAttr = {
        "widgetId": thisWidgetId,
        "docId": thisDocId,
        "targetDocName": targetDocName,
        "targetNotebook": notebook,
        "targetDocPath": targetDocPath,
        "widgetSetting": custom_attr
    };
    let loadCacheFlag = false;
    if (modeDoUpdateFlag == undefined) loadCacheFlag = true;
    if (!modeDoUpdateFlag) {
        modeDoUpdateFlag = await myPrinter.doUpdate(textString, updateAttr)
    };
    if (modeDoUpdateFlag == 0){
        $(textString).appendTo("#linksContainer");
        // 处理响应范围，挂引用块点击事件
        if (setting.extendClickArea) {
            $(".linksListItem").addClass("itemHoverHighLight handle-ref-click");
        }else{
            $("#refContainer .refLinks, .childDocLinks").addClass("linkTextHoverHightLight handle-ref-click");
        }
        //挂一下事件，处理引用块浮窗
        if (setting["floatWindowEnable"]) $("#refContainer .floatWindow").mouseover(showFloatWnd);
        //设定分列值
        setColumn();
    }
    $(".handle-ref-click").on("click", openRefLink);
    if (setting.deleteOrRenameEnable) {
        $(".handle-ref-click").on("mousedown", rightClickHandler);
        // 屏蔽右键菜单
        document.oncontextmenu = function() {
            return false;
        }
        // $(".handle-ref-click").on("contextmenu", );
        // TODO 不知为何无法挂上eventListener
        $(".handle_rename_menu").each(function (){
            $(this).get(0).addEventListener("mousedown", rightClickHandler);
        });
        $(".handle-ref-click").on({
            "touchstart": touchstartHandler,
            "touchend": touchendHandler,
            "touchmove": touchmoveHandler
        });
    }
    //链接颜色需要另外写入，由于不是已存在的元素、且貌似无法继承
    if (window.top.siyuan.config.appearance.mode == 1) {
        $("#linksList").addClass("childDocLinks_dark");
        $(".app").attr("data-darkmode", "true");
    }
    if (loadCacheFlag) {
        adjustHeight(modeDoUpdateFlag);
    }
    return true;
}

/**
 * 调整挂件高度
 * @param {*} modeDoUpdateFlag 
 */
function adjustHeight(modeDoUpdateFlag) {
    if (setting.autoHeight && modeDoUpdateFlag != 1 && myPrinter.write2file != 1) {
        // console.log("挂件高度应当设为", $("body").outerHeight());
        let tempHeight = $("body").outerHeight() + 50;
        if (setting.height_2widget_min && tempHeight < setting.height_2widget_min) tempHeight = setting.height_2widget_min;
        if (setting.height_2widget_max && tempHeight > setting.height_2widget_max) tempHeight = setting.height_2widget_max;
        window.frameElement.style.height = tempHeight + "px";
    }
}


/**
 * 功能主函数
 * @param {boolean} manual 手动模式：只在手动模式下重载用户设置、保存缓存
 * @param {boolean} justCreate 挂件刚创建标志：刚加入挂件时不进行块创建
 * 
 */
async function __main(manual = false, justCreate = false) {
    if (mutex == 0) {//并没有什么用的试图防止同时执行的信号量hhhh
        mutex = 1;
    } else {
        return;
    }
    console.time(`listChildDocs-${thisWidgetId.substring(15)}刷新计时`);
    $("#updateTime").text(language["working"]);
    let modeDoUpdateFlag;
    // pushMsgAPI(language["startRefresh"], 4500);
    try {
        //获取挂件参数
        if (manual) {
            await __refresh();
        }
        // 获取targetId文档所在的box笔记本、笔记本下路径
        let [notebook, targetDocPath] = await getTargetBlockBoxPath();
        // 交由模式的参数
        let updateAttr = {
            "widgetId": thisWidgetId,
            "docId": thisDocId,
            "targetDocName": targetDocName,
            "targetNotebook": notebook,
            "targetDocPath": targetDocPath,
            "widgetSetting": custom_attr
        };
        //获取子文档层级文本
        let textString;
        let modeGenerateString = await myPrinter.doGenerate(updateAttr);
        if (isValidStr(modeGenerateString)) {
            textString = modeGenerateString;
        }else{
            textString = await getText(notebook, targetDocPath);
        }
        //清理原有内容
        $("#linksContainer").html("");
        // 由模式自行完成目录更新
        modeDoUpdateFlag = await myPrinter.doUpdate(textString, updateAttr);
        //写入子文档链接
        if (modeDoUpdateFlag == 0 && myPrinter.write2file) {
            // 在初次启动且安全模式开时，禁止操作（第二次安全模式截停）；禁止初始化时创建块
            if (justCreate && (setting.safeMode || custom_attr.childListId == "")) {
                console.info("初次创建，不写入/更新块");
            } else if (custom_attr.childListId == "") {
                await addText2File(textString, custom_attr.childListId);
                //如果需要创建块，自动保存一下设置
                await __save();
            } else {
                await addText2File(textString, custom_attr.childListId);
            }
        }
        await loadContentCache(textString, modeDoUpdateFlag, notebook, targetDocPath);
        if (myPrinter.write2file == 0) g_contentCache = textString;
        if ((manual || setting.saveCacheWhileAutoEnable) && myPrinter.write2file == 0 && isSafelyUpdate(thisDocId, {widgetMode: true}, thisWidgetId)) {
            saveContentCache(textString);
        }else if (myPrinter.write2file == 0){
            console.log("只读模式，或未启用只读安全模式，不进行缓存。");
        }
    } catch (err) {
        console.error(err);
        printError(err.message);
    }finally{
        console.timeEnd(`listChildDocs-${thisWidgetId.substring(15)}刷新计时`);
    }
    //写入更新时间
    let updateTime = new Date();
    $("#updateTime").text(language["updateTime"] + updateTime.toLocaleTimeString());
    //issue #13 挂件自动高度
    // 挂件内自动高度
    adjustHeight(modeDoUpdateFlag);
    mutex = 0;
}

/**
 * 判定用户输入的子文档目录的目标id，将从该目标开始列出
 * @return box 块所在笔记本id, path 块在笔记本下路径
 */
async function getTargetBlockBoxPath() {
    let userInputTargetId = custom_attr["targetId"];
    $("#targetDocName").text("");
    targetDocName = "";
    // 若id未指定，以挂件所在位置为准
    if (!isValidStr(userInputTargetId)) {
        //以当前页面id查询当前页面所属笔记本和路径（优先使用widegtId，因为docId可能获取的不准）
        let queryResult = await queryAPI(`SELECT * FROM blocks WHERE id = '${thisWidgetId}'`);
        if (queryResult == null || queryResult.length < 1) {
            queryResult = await queryAPI(`SELECT * FROM blocks WHERE id = '${thisDocId}'`);
            if (queryResult == null || queryResult.length < 1) {
                throw Error(language["getPathFailed"]); 
            }
        }
        let notebook = queryResult[0].box;//笔记本名
        g_targetDocPath = queryResult[0].path;// 块在笔记本下的路径
        return [notebook, g_targetDocPath];
    }

    // 更新笔记本信息
    try {
        g_notebooks = window.top.siyuan.notebooks;
    }catch (err) {
        console.error("获取笔记本方法过时，请@开发者修复此问题！");
    }
    // 若id已指定：
    // 若指定的是从笔记本上级列出
    if (userInputTargetId === "/" || userInputTargetId === "\\") {
        $("#targetDocName").text("/");
        targetDocName = "/";
        return ["/", "/"];
    }

    // 这里判断用户输入的targetId具体是文档块还是笔记本
    let targetQueryResult = await queryAPI(`SELECT box, path, type, content FROM blocks WHERE id = '${userInputTargetId}'`);
    if (targetQueryResult == null || targetQueryResult == undefined) {
        throw Error(language["getPathFailed"]); 
    }
    // 若id对应的是文档块
    if (targetQueryResult.length > 0 && targetQueryResult[0].type === "d") {
        $("#targetDocName").text(targetQueryResult[0].content);
        targetDocName = targetQueryResult[0].content;
        return [targetQueryResult[0].box, targetQueryResult[0].path];
    }else if (targetQueryResult.length > 0) {
        throw Error(language["wrongTargetId"]); 
    }
    // 生成笔记本id数组
    g_notebooksIDList = new Array();
    let notebookNameList = new Array();
    if (g_notebooks == null) {
        g_notebooks = await getNodebookList();
    }
    g_notebooks.map((currentValue) => {
        if (currentValue.closed == false) {
            g_notebooksIDList.push(currentValue.id);
            notebookNameList.push(currentValue.name);
        }
    });
    // 若id对应的是笔记本
    if (g_notebooksIDList.indexOf(userInputTargetId) != -1) {
        targetDocName = notebookNameList[g_notebooksIDList.indexOf(userInputTargetId)];
        $("#targetDocName").text(targetDocName);
        return [userInputTargetId, "/"];
    }
    throw new Error(language["wrongTargetId"]);
}

//保存设置项
async function __save() {
    if (isSafelyUpdate(thisDocId, {widgetMode: true}, thisWidgetId) == false) {
        console.warn("在历史界面或其他只读状态，此次保存设置操作可能更改文档状态");
    }
    //获取最新设置
    await __refresh();
    showSettingChanger(false);
    //写入挂件属性
    try {
        await setCustomAttr();
        console.info("[SAVE]保存设置项");
        $("#updateTime").text(language["saved"]);
    } catch (err) {
        console.error(err);
        printError(err.message);
    }
    __refreshAppearance();
}
/**
 * 写入悬停提示
 */
function setDefaultTitle() {
    $("#refresh").prop("title", language["refreshBtn"]);
    $("#listDepth").prop("title", language["depthList"]);
    $("#printMode").prop("title", language["modeList"]);
    $("#autoMode").prop("title", language["autoBtn"]);
    $("#listColumn").prop("title", language["columnBtn"]);
    $("#setting").prop("title", language["settingBtn"]);
    $("#targetId").prop("title", language["targetIdTitle"]);
    $("#endDocOutline").prop("title", language["endDocOutlineTitle"]);
    $("#hideRefreshBtn").prop("title", language["hideRefreshBtnTitle"]);
    $("#outlinedepth").prop("title", language["outlineDepthTitle"]);
    $("#search").prop("title", language["searchBtnTitle"]);

    $("#depthhint").text(language["depthHint"]);
    $("#columnhint").text(language["columnHint"]);
    $("#outlinedepthhint").text(language["outlineDepthHint"]);
    $("#outlinedepthhint, #targetIdhint, #targetDocName, #endDocOutlineHint").css("white-space", "nowrap");//提示文字禁止折行
    $("#endDocOutlineHint").text(language["endDocOutlineHint"]);
    $("#targetIdhint").text(language["targetIdhint"]);
    $("#hideRefreshBtnHint").text(language["hideRefreshBtnHint"]);
    
    $("#autoMode").prop("disabled", false);
}
/**
 * 重新获取Printer
 * 调用前确定已经获得了printMode
 */
function __refreshPrinter(init = false) {
    console.log("响应模式变化");
    custom_attr.printMode = $("#printMode").val();
    let getPrinterFlag = false;
    if (!init) {
        let resettedCustomAttr = myPrinter?.destory(custom_attr);
        // 部分修改默认设定的模式，应当在退出时修改到合理的值
        if (!isInvalidValue(resettedCustomAttr)) {
            Object.assign(custom_attr, resettedCustomAttr);
        }
        // 模式切换后移除旧设定
        if (custom_attr["customModeSettings"] != undefined) {
            delete custom_attr["customModeSettings"];
        }
        saveContentCache("");
    }
    $("#modeSetting").html("");
    //重新获取Printer
    for (let printer of printerList) {
        if (printer.id == custom_attr.printMode) {
            myPrinter = new printer();
            getPrinterFlag = true;
            break;
        }
    }
    // 没有匹配项则重置为默认
    if (!getPrinterFlag) {
        custom_attr.printMode = "0";
        myPrinter = new DefaultPrinter();
        printError(language["wrongPrintMode"]);
    }
    // 执行模式初始化
    let newSetCustomAttr = myPrinter.init(custom_attr);
    if (!isInvalidValue(newSetCustomAttr)) {
        Object.assign(custom_attr, newSetCustomAttr);
    }
    myPrinter.load(custom_attr["customModeSettings"]);
    // 重置默认title
    setDefaultTitle();
    $(".upperbardiv [disabled]").each(function (index) {
        let title = $(this).attr("title")??"";
        $(this).attr("title", title + language["disabledBtnHint"]);
    })
    if (myPrinter.write2file && setting.safeMode) {
        let title = $("#autoMode").attr("title")??"";
        $("#autoMode").attr("title", title + language["autoNotWork"]);
        $("#autoMode").prop("disabled", true);
        $("#search").css("display", "none");
        custom_attr.auto = false;
    }else{
        $("#search").css("display", "");
    }
    __loadSettingToUI();
}
//重新从html读取设定，读取id，更改自动模式//解耦，不再更改外观
async function __refresh() {
    //获取id
    thisWidgetId = getCurrentWidgetId();
    thisDocId = await getCurrentDocIdF();
    //获取模式设定 刷新时，从html读取设定
    custom_attr["printMode"] = document.getElementById("printMode").value;
    //获取下拉选择的展示深度
    custom_attr["listDepth"] = parseInt(document.getElementById("listDepth").value);
    //重设分列
    custom_attr["listColumn"] = parseInt(document.getElementById("listColumn").value);
    //重设大纲层级
    custom_attr["outlineDepth"] = parseInt(document.getElementById("outlinedepth").value)
    //获取targetId
    custom_attr["targetId"] = $("#targetId").val();
    //获取终端大纲设置
    custom_attr["endDocOutline"] = document.getElementById("endDocOutline").checked;
    custom_attr["hideRefreshBtn"] = document.getElementById("hideRefreshBtn").checked;
    if (custom_attr.hideRefreshBtn == false) {
        delete custom_attr.hideRefreshBtn;
    }
    //更换触发模式
    let nowAutoMode = document.getElementById("autoMode").checked;
    if (nowAutoMode != custom_attr["auto"]) {
        if (nowAutoMode) {
            __setObserver();
        } else {
            mutationObserver.disconnect();
        }
        custom_attr["auto"] = nowAutoMode;
    }

    // __refreshPrinter();
}

function __refreshAppearance() {
    //重设窗口大小
    if (myPrinter.write2file == 1) {
        window.frameElement.style.width = setting.width_2file;
        window.frameElement.style.height = setting.height_2file;
        showSettingChanger(false);
    }
    //设定深色颜色（外观）
    if (window.top.siyuan.config.appearance.mode == 1) {
        $(".upperbardiv input[type!='checkbox'], .upperbardiv select").addClass("button_dark");
        $(".upperbardiv span").addClass("ordinaryText_dark");
        $(".childDocLinks").addClass("childDocLinks_dark");
    } else {
        $(".upperbardiv input[type!='checkbox'], .upperbardiv select").removeClass("button_dark");
        $(".upperbardiv span").removeClass("ordinaryText_dark");
        $(".childDocLinks").removeClass("childDocLinks_dark");
    }
}

/**
 * 将挂件属性更新到UI
 */
function __loadSettingToUI() {
    document.getElementById("listDepth").value = custom_attr["listDepth"];
    document.getElementById("printMode").value = parseInt(custom_attr["printMode"]);
    document.getElementById("autoMode").checked = custom_attr["auto"];
    document.getElementById("listColumn").value = custom_attr["listColumn"];
    document.getElementById("outlinedepth").value = custom_attr["outlineDepth"];
    document.getElementById("targetId").value = custom_attr["targetId"];
    document.getElementById("endDocOutline").checked = custom_attr["endDocOutline"];
    document.getElementById("hideRefreshBtn").checked = custom_attr["hideRefreshBtn"];
}

/**
 * 移动端长按适配
 */
async function touchstartHandler(touchEvent) {
    clearTimeout(g_longTouchTimeout);
    let target = touchEvent?.currentTarget ?? touchEvent.target;
    // 多指触摸不触发
    if (touchEvent.touches.length == 1) {
        g_longTouchFlag = false;
        g_longTouchTimeout = setTimeout(()=>{deleteOrRename(target, false);g_longTouchFlag = true;}, 1000);
    }
}

async function touchmoveHandler(touchEvent) {
    clearTimeout(g_longTouchTimeout);
}

async function touchendHandler(touchEvent) {
    clearTimeout(g_longTouchTimeout);
    let target = touchEvent?.currentTarget ?? touchEvent.target;
    touchEvent.stopPropagation();
    // touchEvent.preventDefault();
    // if (!g_longTouchFlag) {
    //     openRefLink(touchEvent);
    // }
}

async function rightClickHandler(mouseEvent) {
    if (mouseEvent.buttons != 2) return;
    if (setting.backToParent != "false" && $(mouseEvent.currentTarget).text().includes("../")) return;
    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();
    await deleteOrRename(mouseEvent.currentTarget, mouseEvent.ctrlKey);
}

// 删除或重命名处理
async function deleteOrRename(target, ctrlKey) {
try{
    let docId = $(target).attr("data-id");
    if (!isValidStr(docId)) {
        return;
    }
    let queryResponse = await queryAPI(`SELECT * FROM blocks WHERE id = "${docId}" AND type = "d"`);
    if (isInvalidValue(queryResponse) || queryResponse.length != 1) {
        return;
    }
    let docName = queryResponse[0].content;
    let deleteDialog = dialog({
        title: language["dialog_delete"],
        content: language["dialog_delete_hint"].replace(new RegExp("%%", "g"), docName),
        quickClose: true,
        ok: async function() {
            await removeDocAPI(queryResponse[0].box, queryResponse[0].path);
            __main(true);
        },
        cancel: function() {return true;},
        autofocus: false,
        okValue: language["dialog_confirm"],
        cancelValue: language["dialog_cancel"],
        skin: isDarkMode()?"dark_dialog delete_dialog":"delete_dialog"
    });
    let renameDialog = dialog({
        title: `${language["dialog_option"]}: ${docName}`,
        content: `<input id="dialog_rename_input" type="text" value="${docName}" autofocus onfocus="this.select();" />`,
        quickClose: true,
        button: [
            {
                value: language["dialog_create_doc"],
                callback: async function() {
                    let newName = $("#dialog_rename_input").val();
                    if (newName == docName || !isValidStr(newName)) {
                        newName = "Untitled";
                    }
                    // 这个createDocWithMdAPI不太稳定 @_@
                    // let id = await createDocWithMdAPI(queryResponse[0].box, queryResponse[0].hpath + `/${newName}`, "");
                    let id = generateBlockId();
                    await createDocWithPath(queryResponse[0].box,
                         queryResponse[0].path.substring(0, queryResponse[0].path.length - 3) + `/${id}.sy`, newName);
                    openRefLink(undefined, id);
                }
            },
            {
                value: language["dialog_delete"],
                callback: function() {
                    deleteDialog.show(target);
                    return true;
                }
            }
        ],
        ok: async function() {
            let newName = $("#dialog_rename_input").val();
            if (newName == docName) return true;
            await renameDocAPI(queryResponse[0].box, queryResponse[0].path, newName);
            setTimeout(function(){__main(true)}, 300);
            return true;
        },
        cancel: function() {return true;},
        cancelDisplay: false,
        okValue: language["dialog_rename"],
        cancelValue: language["dialog_cancel"],
        // onshow: function() {
        //     $("#dialog_rename_input")
        //     $("#dialog_rename_input").on("focus", () =>{this.select();});
        // }
        skin: isDarkMode()?"dark_dialog rename_dialog":"rename_dialog",
        onshow: function() {
            $("#dialog_rename_input").on("keyup", (event)=>{
                if (event.keyCode == 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    let okBtn = $(".rename_dialog button[i-id='ok']");
                    if (okBtn.length == 1) {
                        okBtn.click();
                    }else{
                        console.warn("回车匹配到多个按钮，已停止操作");
                    }
                }
            })
        }
    });
    if (ctrlKey){
        deleteDialog.show(target);
    }else{
        renameDialog.show(target);
        // electron中，不支持prompt
        // let newName = await prompt(`重命名文档(${docName})：`, docName);
        // if (isValidStr(newName) && newName.indexOf("/") == -1) {
        //     await renameDocAPI(queryResponse[0].box, queryResponse[0].path, newName);
        // }
    }
}catch(err) {
    pushDebug(err);
    console.error(err);
}
}

async function __init() {
    pushDebug("init内");
    //获取id，用于在载入页面时获取挂件属性
    thisWidgetId = getCurrentWidgetId();
    thisDocId = await getCurrentDocIdF();
    // 记录是否是刚刚创建的挂件
    let justCreate = false;
    //载入挂件属性
    try {
        await getCustomAttr();
    } catch (err) {
        console.warn(err);
        printError(language["getAttrFailedAtInit"]);
        justCreate = true;
        // custom_attr.auto = false;//读取错误时关闭auto
    }
    //写入模式设定选择框的选项
    for (let key of Object.keys(printerList)) {
        $(`<option value="${printerList[key].id}">${language["modeName"+printerList[key].id.toString()]}</option>`).appendTo("#printMode");
    }
    // UI更改
    if ("hideRefreshBtn" in custom_attr && custom_attr.hideRefreshBtn == true) {
        $("#refresh").remove();
        $(`<button id="refresh" title="refresh"></button>`).prependTo("#innerSetting");
        $("#refresh").css("margin-left", "0.5em");
    }else if ("hideRefreshBtn" in custom_attr && custom_attr.hideRefreshBtn == false) {
        delete custom_attr.hideRefreshBtn;
    }
    document.getElementById("refresh").onclick = async function () { clearTimeout(refreshBtnTimeout); refreshBtnTimeout = setTimeout(async function () { await __main(true) }, 300); };
    document.getElementById("refresh").ondblclick = async function () { clearTimeout(refreshBtnTimeout); await __save(); };
    // 将属性设置载入到显示中
    __loadSettingToUI();
    //通用刷新Printer操作，必须在获取属性、写入挂件之后
    __refreshPrinter(true);
    __refreshAppearance();
    //绑定按钮事件
    // 刷新按钮绑定事件移动到Init
    document.getElementById("setting").onclick = function () {
        showSettingChanger(!g_showSetting);
    };
    // 监视Input变化，设置为显示大纲时，显示大纲层级选项
    document.getElementById("endDocOutline").addEventListener("change", function(e){
        if (document.getElementById("endDocOutline").checked == true) {
            $("#outlinedepthhint, #outlinedepth").css("display", "inline");
        }
    });
    document.getElementById("listDepth").addEventListener("change", function(){
        if ($("#listDepth").val() == 0) {
            $("#outlinedepthhint, #outlinedepth").css("display", "inline");
        }
    });
    // 挂件内及时响应分列变化
    document.getElementById("listColumn").addEventListener("change", function(){
        if (myPrinter.write2file == 0) {
            custom_attr.listColumn = $("#listColumn").val();
            setColumn();
        }
    });
    // 及时响应模式变化
    document.getElementById("printMode").onchange = ()=>{__refreshPrinter(false)};
    //跟随软件字号设定
    $("#linksContainer").css("font-size", window.top.siyuan.config.editor.fontSize + "px");
    //控制自动刷新选项是否显示
    if (!setting.showAutoBtn) {
        $("#autoMode").attr("type", "hidden");
    }
    g_showSetting = setting.showSettingOnStartUp;
    showSettingChanger(g_showSetting);
    console.log("屏幕宽度" + window.screen.availWidth);
    //初始化时设定列数
    if (custom_attr.listColumn > 1) {
        setColumn();
    }
    if (myPrinter.write2file == 0 && (!custom_attr.auto || setting.loadCacheWhileAutoEnable) ) {
        $("#updateTime").text(language["loading"]);
        let loadResult = false;
        try{
            loadResult = await loadContentCache(g_contentCache);
        }catch(err) {
            console.error(err);
        }
        if (loadResult) {
            $("#updateTime").text(language["cacheLoaded"]);
        }else{
            $("#updateTime").text(language["loadCacheFailed"]);
        }
    }
    //自动更新
    if (custom_attr.auto) {
        //在更新/写入文档时截停操作（安全模式）
        if (setting.safeMode && myPrinter.write2file == 1) return;
        // 挂件刚创建，且写入文档，禁止操作，因为widgetId未入库，无法创建；
        if (justCreate && myPrinter.write2file == 1) return;
        //设定事件监听
        __setObserver();
        //尝试规避 找不到块创建位置的运行时错误
        // setTimeout(()=>{ __main(true)}, 1000);
        __main(false, justCreate);//初始化模式
    }
    // 插入“addChildDocLinkHelper.js判断挂件是否存在”所需要的custom-addcdlhelper属性
    if (!justCreate && setting.addChildDocLinkHelperEnable && isSafelyUpdate(thisDocId, {widgetMode: true}, thisWidgetId)) {
        let thisDocAttr = await getblockAttrAPI(thisDocId);
        if (thisDocAttr && thisDocAttr.data && "id" in thisDocAttr.data) {
            if (!(setting.helperSettings.attrName in thisDocAttr.data)) {
                let attr = {};
                attr[setting.helperSettings.attrName] = "{}";
                await addblockAttrAPI(attr, thisDocId);
            }
        }
    }
    /* search */
    let findDialog = dialog({
        title: language["dialog_search_panel"],
        content: `<input id="dialog_find_input" type="text"" autofocus onfocus="this.select();" />`,
        quickClose: true,
        ok: function() {
            let searchText = $("#dialog_find_input").val().toLowerCase().split(" ");
            let matchAnyFlag = false;
            $(".search_highlight").removeClass("search_highlight");
            $("#linksList li, .needSearch").each(function() {
                let liHtml = $(this).html();
                let liText = $(this).text().toLowerCase();
                let matchFlag = false;
                for (let i = 0; i < searchText.length; i++) {
                    if (liText.indexOf(searchText[i]) == -1) {
                        break;
                    }
                    if (i == searchText.length - 1) {
                        matchFlag = true;
                    }
                }
                if (matchFlag) {
                    $(this).addClass("search_highlight");
                    matchAnyFlag = true;
                }
            });
            if (matchAnyFlag) {
                this.close();
                return false;
            }else{
                $(".search_dialog button[i-id='ok']").text(language["dialog_search_nomatch"]);
                setTimeout(()=>{$(".search_dialog button[i-id='ok']").text(language["dialog_search"]);}, 2000);
                return false;
            }
            
        },
        button: [{
            value: language["dialog_search_cancel"],
            callback:  function() {
                // $(".search_target").removeClass("search_target");
                $(".search_highlight").removeClass("search_highlight");
                this.close();
                return false;
            }
        }],
        cancel: function(){
            this.close();
            return false;
        },
        okValue: language["dialog_search"],
        cancelDisplay: false,
        skin: isDarkMode()?"dark_dialog search_dialog":"search_dialog",
        onshow: function() {
            $("#dialog_find_input").on("keyup", (event)=>{
                if (event.keyCode == 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    let okBtn = $(".search_dialog button[i-id='ok']");
                    if (okBtn.length == 1) {
                        okBtn.click();
                    }else{
                        console.warn("回车匹配到多个按钮，已停止操作");
                    }
                }
            })
        }
    });
    if (setting.searchHotkeyEnable) {
        document.addEventListener("keydown", function(event) {
            if (event.code == "KeyF" && event.ctrlKey == true) {
                event.stopPropagation();
                event.preventDefault();
                findDialog.show();
            }
        });
    }
    document.getElementById("search")?.addEventListener("click", function () {
        findDialog.show(this);
    });
}
// UNSTABLE: 此方法通过现实页面定位页签
function __setObserver() {
    try {
        //排除操作系统：
        if (!checkOs()) {
            return;
        }
        //(思源主窗口)可见性变化时更新列表（导致在删除插件时仍然触发的错误）
        // document.addEventListener('visibilitychange', __main);
        //页签切换时更新列表
        // 获取当前文档用于前端展示的data-id
        let dataId = $(window.parent.document).find(`div.protyle:has(div[data-node-id="${thisWidgetId}")`).attr("data-id");
        //由dataId找所在文档的页签
        let target = $(window.parent.document).find(`.layout-tab-bar .item[data-id=${dataId}]`);
        console.assert(target.length == 1, "无法监听页签切换", target, dataId);
        //不能观察class变化，class会在每次编辑、操作时变更
        if (target.length == 1){
            mutationObserver.observe(target[0], { "attributes": true, "attributeFilter": ["data-activetime"] });
        }
    } catch (err) {
        // printError("监听点击页签事件失败", false);//监听页签将作为附加功能，不再向用户展示错误提示
        console.error("监视点击页签事件失败" + err);
    }
}
pushDebug("开始载入");
let mutationObserver = new MutationObserver(() => { __main(false) });//避免频繁刷新id
let mutationObserver2 = new MutationObserver(() => { setTimeout(__refreshAppearance, 1500); });
let refreshBtnTimeout;

let thisDocId = "";
let thisWidgetId = "";
let targetDocName = "";
let mutex = 0;
let myPrinter;
let g_showSetting;
let g_targetDocPath;
let g_targetDocId;
let g_targetMode;
let g_notebooks = null;
let g_notebooksIDList = null;
let g_contentCache;
let g_longTouchTimeout;
let g_longTouchFlag;
try {
    g_notebooks = window.top.siyuan.notebooks;
}catch (err) {
    console.error("获取笔记本方法过时，请@开发者修复此问题！");
}

//延时初始化 过快的进行insertblock将会导致思源(v2.1.5)运行时错误
// setTimeout(__init, 300);
pushDebug("A基本功能载入成功，开始init");
try{
    __init();
}catch(err) {
    console.error(err);
    pushDebug(err);
}

try {
    // UNSTABLE: 监视深色模式变化，依赖界面现实的外观模式按钮变化
    if (checkOs()) {
        let targetNode = null;
        // v2.3.x -
        if ($(window.parent.document).find("#barThemeMode").length >= 1) {
            targetNode = $(window.parent.document).find("#barThemeMode").get(0);
        } else {
            // v2.4.1 + 
            targetNode = $(window.parent.document).find("#barMode").get(0);
        }
        mutationObserver2.observe(targetNode, { "attributes": true, "attributeFilter": ["aria-label"] });
    }
    // window.top.addEventListener("change", ()=>{console.log("changed")});

} catch (err) {
    console.error(err);
    console.warn("监视外观切换事件失败");
    pushDebug("监视外观切换事件失败");
}
