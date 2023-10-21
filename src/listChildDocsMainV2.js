/**
 * listChildDocs main V2
 */
import { logPush, errorPush, warnPush, checkWorkEnvironment, commonPushCheck, WORK_ENVIRONMENT, isValidStr, debugPush, pushDebug, isInvalidValue, isSafelyUpdate, transfromAttrToIAL, generateBlockId } from "./common.js";
import { ConfigSaveManager, CONSTANTS_CONFIG_SAVE_MODE, ConfigViewManager } from "./ConfigManager.js";
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
    getDocOutlineAPI,
    getNodebookList,
    getKramdown,
    removeBlockAPI,
    removeDocAPI,
    renameDocAPI,
    isDarkMode,
    createDocWithMdAPI,
    createDocWithPath,
    DOC_SORT_TYPES,
    listFileAPI,
    removeFileAPI,
    isMobile,
    getJSONFile,
    getFileAPI
} from "./API.js";
import { language } from "./config.js";
import { DefaultPrinter, printerList } from './listChildDocsClass.js';
import { openRefLink, showFloatWnd } from './ref-util.js';


//将Markdown文本写入文件(当前挂件之后的块)
async function addText2File(markdownText, blockid = "") {
    if (isSafelyUpdate(g_currentDocId, {widgetMode: true}, g_workEnvId) == false) {
        throw new Error(language["readonly"]);
    }
    let attrData = {};
    //读取属性.blockid为null时不能去读
    if (isValidStr(blockid) && g_globalConfig.inheritAttrs) {
        //判断是否是分列的目录块（是否是超级块）
        // let subLists = await queryAPI(`SELECT id FROM blocks WHERE type = 'l' AND parent_id IN (SELECT id from blocks where parent_id = '${blockid}' and type = 's')`);
        let subDirectLists = await queryAPI(`SELECT id FROM blocks WHERE type = 'l' AND parent_id = '${blockid}'`);
        // debugPush("超级块内超级块下的列表数？", subLists.length);
        // debugPush("超级块下直接的列表数", subDirectLists.length);
        //如果是分列的目录块，那么以超级块中一个随机的无序列表的属性为基准，应用于更新后的块
        attrData = await getblockAttrAPI(subDirectLists.length >= 1 ? subDirectLists[0].id : blockid);
        // debugPush("更新前，", subDirectLists, "attrGet", attrData);
        attrData = attrData.data;
        //避免重新写入id和updated信息
        delete attrData.id;
        delete attrData.updated;
        // 避免切换模式继承无序列表下的有序列表属性
        delete attrData["custom-list-format"];
    }else if (isValidStr(g_globalConfig.blockInitAttrs)){ // 为新创建的列表获取默认属性
        try {
            attrData = Object.assign({}, JSON.parse(g_globalConfig.blockInitAttrs));
        } catch (err) {
            errorPush("为新创建的列表获取默认属性时出错", err);
        }
    }
    // 导入模式属性
    let modeCustomAttr = g_myPrinter.getAttributes();
    if (!isInvalidValue(modeCustomAttr)) {
        attrData = Object.assign(attrData, modeCustomAttr);
    }
    // 分列操作（分列并使得列继承属性）
    if (g_allData["config"].listColumn >= 0 && g_globalConfig.inheritAttrs && g_globalConfig.superBlockBeta) {
        let nColumn = g_allData["config"].listColumn;
        // 自动分列：
        // 获取的protyle可视区域高是全部高，不太能用
        if (g_allData["config"].listColumn == 0 && !isMobile()) {
            let deviceHeight = window.screen.availHeight;
            const rowE = window.top.document.querySelector(".fn__flex-1.protyle:not(.fn__none) .protyle-wysiwyg .p");
            let rowHeight = 34;
            if (rowE && rowE.clientHeight > 0) {
                rowHeight = rowE.clientHeight;
            }
            // 魔法数376，预估的冗余部分高度hh
            if (deviceHeight > 376 && rowHeight > 0 && g_rowCount > 0) {
                let rowPerColumn = (deviceHeight - 376) / rowHeight;
                nColumn = Math.ceil(g_rowCount / rowPerColumn);
            }
            debugPush("autoColumn：设备高度、行高度、行计数、计算出的列数", deviceHeight, rowHeight, g_rowCount, nColumn);
            if (nColumn >= CONSTANTS.MAX_AUTO_COLUMNS) nColumn = CONSTANTS.MAX_AUTO_COLUMNS;
        }
        markdownText = g_myPrinter.splitColumns(markdownText, nColumn, g_allData["config"]["listDepth"], attrData);
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
        if (g_workEnvTypeCode == WORK_ENVIRONMENT.PLUGIN) {
            response = await insertBlockAPI(markdownText, g_workEnvId, g_pluginWorkConfig.insertBlockAPI);
        } else {
            response = await insertBlockAPI(markdownText, g_workEnvId);
        }
    }
    if (response != null && isValidStr(response.id)) {
        debugPush("成功保存", blockid, response.id);
        if (!isValidStr(blockid)) {
            debugPush("写入列表id");
            //将子文档无序列表块id写入属性
            g_allData["config"]['childListId'] = response.id;
            await g_configManager.saveDistinctConfig(g_allData["config"]);
        }
    } else if (response == null || response.id == "") {
        //找不到块，移除原有属性
        g_allData["config"]['childListId'] = "";
        warnPush("更新失败，下次将创建新块", blockid);
        // await setCustomAttr();//移除id属性后需要保存
        throw Error(language["refreshNeeded"]);
    } else {
        console.error("插入/更新块失败", response.id);
        throw Error(language["insertBlockFailed"]);
    }
}

//获取子文档层级目录输出文本
async function getText(notebook, nowDocPath) {
    if (g_myPrinter == undefined) {
        console.error("输出类Printer错误", g_myPrinter);
        throw Error(language["wrongPrintMode"]);
    }
    let insertData = g_myPrinter.beforeAll();
    let rawData = "";
    let rowCountStack = new Array();
    rowCountStack.push(1);
    g_rowCount = 0;
    
    // 单独处理起始为笔记本上级的情况
    if (notebook === "/") {
        rawData = await getTextFromNotebooks(rowCountStack);
    }else{
        // 单独处理 返回父文档../
        // 用户自行指定目标时，不附加../
        if (!isValidStr(g_allData["config"]["targetId"]) &&
          (g_globalConfig.backToParent == "true" || (g_globalConfig.backToParent == "auto" && window.screen.availWidth <= 768)) &&
          g_myPrinter.write2file == 0) {
            let tempPathData = nowDocPath.split("/");
            // 排除为笔记本、笔记本直接子文档的情况，split后首个为''
            if (tempPathData.length > 2) {
                let tempVirtualDocObj = {
                    id: tempPathData[tempPathData.length - 2],
                    name: "../",
                    icon: "1f519"//图标🔙
                };
                rawData += g_myPrinter.align(rowCountStack.length);
                rawData += g_myPrinter.oneDocLink(tempVirtualDocObj, rowCountStack);
                rowCountStack[rowCountStack.length - 1]++;
                g_rowCount++;
            }
        }
        // 处理大纲和子文档两种情况，子文档情况兼容从笔记本级别列出
        if (g_allData["config"].listDepth == 0) {
            // 判断起始文档id
            let targetDocId = g_currentDocId;
            if (isValidStr(g_allData["config"]["targetId"])) {
                targetDocId = g_allData["config"]["targetId"];
            }
            rawData = await getDocOutlineText(targetDocId, false, rowCountStack);
        } else {
            rawData = await getOneLevelText(notebook, nowDocPath, rawData, rowCountStack);//层级从1开始
        }
    }
    

    if (rawData == "") {
        if (g_allData["config"].listDepth > 0) {
            rawData = g_myPrinter.noneString(language["noChildDoc"]);
        } else {
            rawData = g_myPrinter.noneString(language["noOutline"]);
        }
    }
    insertData += rawData + g_myPrinter.afterAll();
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
        result += g_myPrinter.align(rowCountStack.length);
        result += g_myPrinter.oneDocLink(tempVirtualDocObj, rowCountStack);
        // 处理笔记本下级文档
        if ((rowCountStack.length + 1) <= g_allData["config"].listDepth) {
            result += g_myPrinter.beforeChildDocs(rowCountStack.length);
            rowCountStack.push(1);
            result = await getOneLevelText(g_notebooks[i].id, "/", result, rowCountStack);
            rowCountStack.pop();
            result += g_myPrinter.afterChildDocs(rowCountStack.length);
        }
        rowCountStack[rowCountStack.length - 1]++;
        g_rowCount++;
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
    if (rowCountStack.length > g_allData["config"].listDepth) {
        return insertData;
    }
    let docs = await getSubDocsAPI(notebook, nowDocPath, g_allData["config"]["maxListCount"], parseInt(g_allData["config"]["sortBy"]));
    //生成写入文本
    for (let doc of docs) {
        insertData += g_myPrinter.align(rowCountStack.length);
        insertData += g_myPrinter.oneDocLink(doc, rowCountStack);
        if (doc.subFileCount > 0 && (rowCountStack.length + 1) <= g_allData["config"].listDepth) {//获取下一层级子文档
            insertData += g_myPrinter.beforeChildDocs(rowCountStack.length);
            rowCountStack.push(1);
            insertData = await getOneLevelText(notebook, doc.path, insertData, rowCountStack);
            rowCountStack.pop();
            insertData += g_myPrinter.afterChildDocs(rowCountStack.length);
        } else if (g_allData["config"].endDocOutline && g_allData["config"].outlineDepth > 0) {//终端文档列出大纲
            let outlines = await getDocOutlineAPI(doc.id);
            if (outlines != null) {
                insertData += g_myPrinter.beforeChildDocs(rowCountStack.length);
                rowCountStack.push(1);
                insertData += getOneLevelOutline(outlines, true, rowCountStack);
                rowCountStack.pop();
                insertData += g_myPrinter.afterChildDocs(rowCountStack.length);
            }
        }
        rowCountStack[rowCountStack.length - 1]++;
        g_rowCount++;
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
    if (outlines == null) { warnPush("获取大纲失败"); return ""; }
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
    if (outlines == null || outlines == undefined || outlines.length <= 0) return "";
    let result = "";
    for (let outline of outlines) {
        // 直接比较subType，如果超出结束层级，则由于其下层级都会超出，不必处理，直接跳过
        if (outline.subType > g_allData["config"]["outlineEndAt"]) {
            continue;
        }
        // 如果当前层级未达到开始层级，不记录标记rowCountStack，直接递归处理深层级
        if (outline.subType < g_allData["config"]["outlineStartAt"]) {
            if (outline.type === "outline" && outline.blocks != null) {
                result += getOneLevelOutline(outline.blocks, distinguish, rowCountStack);
            } else if (outline.type == "NodeHeading" && outline.children != null) {
                result += getOneLevelOutline(outline.children, distinguish, rowCountStack);
            } else if (outline.type != "outline" && outline.type != "NodeHeading") {
                warnPush("未被处理的大纲情况");
            }
        } else { // 已到达开始层级~结束层级，正常处理
            if (!isValidStr(outline.name)) {//处理内部大纲类型NodeHeading的情况，也是由于Printer只读取name属性
                outline.name = outline.content;
            }
            if (distinguish) {
                outline.name = g_globalConfig.outlineDistinguishingWords + outline.name;
            }
            result += g_myPrinter.align(rowCountStack.length);
            result += g_myPrinter.oneDocLink(outline, rowCountStack);
            if (outline.type === "outline" && outline.blocks != null) {
                result += g_myPrinter.beforeChildDocs();
                rowCountStack.push(1);
                result += getOneLevelOutline(outline.blocks, distinguish, rowCountStack);
                rowCountStack.pop();
                result += g_myPrinter.afterChildDocs();
            } else if (outline.type == "NodeHeading" && outline.children != null) {
                result += g_myPrinter.beforeChildDocs();
                rowCountStack.push(1);
                result += getOneLevelOutline(outline.children, distinguish, rowCountStack);
                rowCountStack.pop();
                result += g_myPrinter.afterChildDocs();
            } else if (outline.type != "outline" && outline.type != "NodeHeading") {
                warnPush("未被处理的大纲情况");
            }
            rowCountStack[rowCountStack.length - 1]++;
            g_rowCount++;
        }
        
        
    }
    return result;
}

function debugPushAPI(text, delay = 7000) {
    pushMsgAPI(text, 7000);
}

/**
 * 控制挂件内css分列（分栏），在页面宽度不足时强制重设分列数
 */
function setColumn(rowOfText = g_rowCount) {
    let nColumns = g_allData["config"].listColumn;
    if (nColumns == 0 && rowOfText > 0) {
        let fontSize = $("#linksContainer").css("font-size");
        if (fontSize == undefined) fontSize = "16px";
        debugPush("widgetStyleHeight, widgetClientHeight, linksContainer.outerHeight", window.frameElement.style.height, window.frameElement.clientHeight, $("#linksContainer").outerHeight());
        // 单列可容纳行数
        debugPush("linksContainer.outerHeight / fontSize", $("#linksContainer").innerHeight() / $("#linksContainer li").outerHeight());
        let rowPerColumn = parseFloat(window.frameElement.clientHeight) / $("#linksContainer li").outerHeight();
        debugPush("rowOfText", rowOfText);
        // 分列数
        debugPush("rowOfText / (height / fontSize)", rowOfText / rowPerColumn);
        nColumns = Math.ceil(rowOfText / rowPerColumn);
        if (nColumns >= CONSTANTS.MAX_AUTO_COLUMNS) nColumns = CONSTANTS.MAX_AUTO_COLUMNS;
    }
    if (window.screen.availWidth <= 768 || isMobile()) nColumns = "";
    $("#linksContainer").css("column-count", nColumns);
}

/**
 * 输出错误信息至挂件
 * @param {msgText} 错误信息
 * @param {boolean} clear 输出前是否清空 
 */
function errorShow(msgText, clear = true) {
    if (clear) $(".linksContainer *").remove();
    $("#linksContainer").css("column-count", "");//显示错误时不分栏
    $(`<ul><li class="linksListItem errorinfo">${language["error"]}` + msgText + `</li></ul>`).appendTo("#linksContainer");
    // 判定：如果设置界面在显示，那么msg提示
    if ($("#innerSetting").css("display") != "none") {
        layui.layer.msg(language["error"] + msgText, {time: 3000, icon: 0});
    }
    // https://github.com/OpaqueGlass/listChildDocs/issues/39
    if (g_myPrinter && g_myPrinter.write2file == 1 && $("#innerSetting").css("display") == "none") {
        window.frameElement.style.height = "10em";
    }
}


function saveContentCache(textString = g_allData["cacheHTML"]) {
    logPush("保存缓存cacheHTML");
    if (isSafelyUpdate(g_currentDocId, {widgetMode: true}, g_workEnvId) == false) {
        warnPush("在历史界面或其他只读状态，此次保存设置操作可能更改文档状态");
    }
    g_allData["cacheHTML"] = textString;
    g_configManager.saveCache(textString);
    // let response = addblockAttrAPI({ "custom-lcd-cache": textString }, g_workEnvId);
}

/**
 * 挂件内载入缓存
 * 也用于直接刷新
 * 内部使用modeDoUpdateFlag undefined与否判断是否载入的缓存，请注意
 */
async function loadContentCache({
    textString = g_allData["cacheHTML"],
    modeDoUpdateFlag = undefined, notebook = undefined, targetDocPath = undefined, manual = false, modeRefreshed = false}) {
    if (g_myPrinter.write2file) return false;
    if (!isValidStr(textString)) return false;
    if (notebook == undefined || targetDocPath == undefined) {
        [notebook, targetDocPath] = await getTargetBlockBoxPath();
    }
    let updateAttr = {
        "widgetId": g_workEnvId,
        "docId": g_currentDocId,
        "targetDocName": targetDocName,
        "targetNotebook": notebook,
        "targetDocPath": targetDocPath,
        "widgetSetting": g_allData["config"],
        "isAutoUpdate": !manual,
    };
    logPush("刷新时实际读取到的信息updateAttr", updateAttr);
    let loadCacheFlag = false;
    if (modeDoUpdateFlag == undefined) loadCacheFlag = true;
    // 如果是模式需要刷新，且模式未进行刷新
    if (!modeDoUpdateFlag && !modeRefreshed) {
        modeDoUpdateFlag = await g_myPrinter.doUpdate(textString, updateAttr)
    };
    if (modeDoUpdateFlag == 0){
        $("<div>" + textString + "</div>").appendTo("#linksContainer");
        // 处理响应范围，挂引用块点击事件
        if (g_globalConfig.extendClickArea) {
            $(".linksListItem").addClass("itemHoverHighLight handle-ref-click");
        }else{
            $("#refContainer .refLinks, .childDocLinks").addClass("linkTextHoverHightLight handle-ref-click");
        }
        //设定分列值
        setColumn();
    }
    $(".handle-ref-click").on("click", openRefLink);
    if (g_allData["config"].floatWndEnable) {
        $("#refContainer .handle-ref-click").mouseover(showFloatWnd);
    }
    if (g_globalConfig.deleteOrRenameEnable) {
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
    if (isDarkMode()) {
        $("#linksList").addClass("childDocLinks_dark");
    }
    if (loadCacheFlag) {
        adjustHeight(modeDoUpdateFlag);
    }
    return modeDoUpdateFlag;
}

/**
 * 调整挂件高度
 * @param {*} modeDoUpdateFlag 
 */
function adjustHeight(modeDoUpdateFlag) {
    if (g_globalConfig.autoHeight && modeDoUpdateFlag == 0 && g_myPrinter.write2file != 1) {
        // debugPush("挂件高度应当设为", $("body").outerHeight());
        let tempHeight = $("body").outerHeight() + 50;
        debugPush("挂件内调整高度 当前body+10", tempHeight);
        if (isValidStr(g_globalConfig.height_2widget_min) && tempHeight < g_globalConfig.height_2widget_min) tempHeight = parseInt(g_globalConfig.height_2widget_min);
        if (isValidStr(g_globalConfig.height_2widget_max) && tempHeight > g_globalConfig.height_2widget_max) tempHeight = parseInt(g_globalConfig.height_2widget_max);
        window.frameElement.style.height = tempHeight + "px";
        debugPush("挂件内调整高度");
    }
}


/**
 * 功能主函数
 * @param {boolean} manual 手动模式：只在手动模式下重载用户设置、保存缓存
 * 
 */
async function __main(manual = false, justCreate = false) {
    if (mutex == 0) {//并没有什么用的试图防止同时执行的信号量hhhh
        mutex = 1;
    } else {
        return;
    }
    let msgLayer;
    let startTime = new Date();
    $("#updateTime").text(language["working"]);
    if (g_globalConfig["showBtnArea"] != "true") {
        msgLayer = layui.layer.msg(language["working"], {icon: 0, time: 0, offset: "t"});
    }
    /* 
    modeDoUpdateFlag: 1 模式进行更新； 0使用默认更新；-1 模式拒绝更新；-2更新或获取时出错
     */
    let modeDoUpdateFlag = 1;
    // pushMsgAPI(language["startRefresh"], 4500);
    try {
        g_allData["config"] = await g_configManager.getDistinctConfig();
        //获取挂件参数
        if (manual) {
            await __reloadSettings();
        }
        // 获取targetId文档所在的box笔记本、笔记本下路径
        let [notebook, targetDocPath] = await getTargetBlockBoxPath();
        // 交由模式的参数
        let updateAttr = {
            "widgetId": g_workEnvId,
            "docId": g_currentDocId,
            "targetDocName": targetDocName,
            "targetNotebook": notebook,
            "targetDocPath": targetDocPath,
            "widgetSetting": g_allData["config"],
            "isAutoUpdate": !manual
        };
        //获取子文档层级文本
        let textString;
        let [modeGenerateString, tempRowCount] = await g_myPrinter.doGenerate(updateAttr);
        if (tempRowCount != undefined) {
            g_rowCount = tempRowCount;
        }
        if (isValidStr(modeGenerateString)) {
            textString = modeGenerateString;
        }else{
            textString = await getText(notebook, targetDocPath);
        }
        //清理原有内容
        $("#linksContainer").html("");
        // 由模式自行完成目录更新
        modeDoUpdateFlag = await g_myPrinter.doUpdate(textString, updateAttr);
        logPush("Mode进行刷新In Main");
        //写入子文档链接
        if (modeDoUpdateFlag == 0 && g_myPrinter.write2file) {
            // 在初次启动且安全模式开时，禁止操作（第二次安全模式截停）；禁止初始化时创建块
            if (justCreate && (g_globalConfig.safeMode || g_allData["config"].childListId == "")) {
                logPush("初次创建，不写入/更新块");
            } else if (!isValidStr(g_allData["config"].childListId)) {
                debugPush("需要创建块", g_allData["config"]["childListId"]);
                await addText2File(textString, g_allData["config"].childListId);
                //如果需要创建块，创建或更新块后需要更新id，将id保存
                // await g_configManager.saveDistinctConfig(g_allData["config"]);
            } else {
                debugPush("无需创建块", g_allData["config"]["childListId"]);
                await addText2File(textString, g_allData["config"].childListId);
            }
        }
        await loadContentCache({"textString": textString,
            "modeDoUpdateFlag": modeDoUpdateFlag, "notebook": notebook, "targetDocPath": targetDocPath, "manual": manual, "modeRefreshed": true});
        if (g_myPrinter.write2file == 0) g_allData["cacheHTML"] = textString;
        if ((manual || g_globalConfig.saveCacheWhileAutoEnable) && g_myPrinter.write2file == 0 && isSafelyUpdate(g_currentDocId, {widgetMode: true}, g_workEnvId)) {
            saveContentCache(textString);
        }else if (g_myPrinter.write2file == 0){
            debugPush("只读模式，或未启用只读安全模式，不进行缓存。");
        }
    } catch (err) {
        console.error(err);
        errorShow(err.message);
        modeDoUpdateFlag = -2;
    }finally{
        logPush("刷新计时", new Date() - startTime + "ms");
    }
    //写入更新时间
    let updateTime = new Date();
    switch (modeDoUpdateFlag) {
        case 0:
        case 1: {
            $("#updateTime").text(language["updateTime"] + updateTime.toLocaleTimeString());
            break;
        }
        case -1: {
            $("#updateTime").text(language["refreshReject"] + updateTime.toLocaleTimeString());
            break;
        }
        case -2: {
            $("#updateTime").text(language["refreshFailed"] + updateTime.toLocaleTimeString());
            break;
        }
    }
    if (g_globalConfig["showBtnArea"] != "true") {
        layui.layer.close(msgLayer);
    }
    // 文档内模式，更新成功，则恢复挂件高度（之前如果有错误提示更改高度的售后）
    if (modeDoUpdateFlag != -2 && g_myPrinter.write2file == 1 && $("#innerSetting").css("display") == "none" ) {
        window.frameElement.style.width = g_globalConfig.width_2file;
        window.frameElement.style.height = g_globalConfig.height_2file;
    }
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
    let userInputTargetId = g_allData["config"]["targetId"];
    $("#targetDocName").text("");
    targetDocName = "";
    // 若id未指定，以挂件所在位置为准
    if (!isValidStr(userInputTargetId)) {
        //以当前页面id查询当前页面所属笔记本和路径（优先使用widegtId，因为docId可能获取的不准）
        let queryResult = await queryAPI(`SELECT * FROM blocks WHERE id = '${g_workEnvId}'`);
        if (queryResult == null || queryResult.length < 1) {
            queryResult = await queryAPI(`SELECT * FROM blocks WHERE id = '${g_currentDocId}'`);
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

/**
 * 重新获取Printer
 * 调用前确定已经获得了printMode
 */
function __refreshPrinter(init = false) {
    let getPrinterFlag = false;
    // 非初始状态，需要清空上一个Printer的数据，（实际上没有切换Printer将不予处理）
    if ((g_myPrinter != null && g_myPrinter.id == g_allData["config"].printMode)) {
        debugPush("模式未发生变动，不刷新");
        return;
    }
    if (!init && (g_myPrinter != null && g_myPrinter.id != g_allData["config"].printMode)) {
        debugPush("删除旧设定判定依据", g_myPrinter.id, g_allData["config"].printMode);
        let resettedCustomAttr = g_myPrinter ? g_myPrinter.destory(g_allData["config"]):undefined;
        // 部分修改默认设定的模式，应当在退出时修改到合理的值
        if (!isInvalidValue(resettedCustomAttr)) {
            Object.assign(g_allData["config"], resettedCustomAttr);
        }
        debugPush("删除了模式旧设定");
        // 模式切换后移除旧设定
        if (g_allData["config"]["customModeSettings"] != undefined) {
            delete g_allData["config"]["customModeSettings"];
        }
    }
   
    debugPush("放行了刷新Printer操作");
    $("#modeSetting").html("");
    //重新获取Printer
    for (let printer of printerList) {
        if (printer.id == g_allData["config"].printMode) {
            g_myPrinter = new printer();
            getPrinterFlag = true;
            break;
        }
    }
    // 没有匹配项则重置为默认
    if (!getPrinterFlag) {
        g_allData["config"].printMode = "0";
        g_myPrinter = new DefaultPrinter();
        errorShow(language["wrongPrintMode"]);
    }
    // 执行模式初始化
    let newSetCustomAttr = g_myPrinter.init(g_allData["config"]);
    if (!isInvalidValue(newSetCustomAttr)) {
        Object.assign(g_allData["config"], newSetCustomAttr);
        // 由模式在后台更新的参数，需要反映到UI界面中
        g_configViewManager.setSettingsToUI(g_allData["config"]);
    }
    debugPush("载入Printer独立设置", g_allData["config"]);
    // 由于全局设置不从文件读入，不方便export，这里需要将全局设置传递给printer
    g_myPrinter.setGlobalConfig(g_globalConfig);
    g_myPrinter.load(g_allData["config"]["customModeSettings"]);
    // TODO: 禁用或提示部分设置项无效
    // $("#outerSetting > [disabled], #innerSetting > [disabled]").each(function (index) {
    //     let title = $(this).attr("title") ? $(this).attr("title"):"";
    //     $(this).attr("title", title + language["disabledBtnHint"]);
    // })
    if (g_myPrinter.write2file && g_globalConfig.safeMode) {
        let title = $("#autoMode").attr("title") ? $("#autoMode").attr("title"):"";
        $("#autoMode").attr("title", title + language["autoNotWork"]);
        $("#autoMode").prop("disabled", true);
        $("#search").css("display", "none");
        g_allData["config"].auto = false;
    }else{
        $("#search").css("display", "");
    }
}

/**
 * 移动端长按适配
 */
async function touchstartHandler(touchEvent) {
    clearTimeout(g_longTouchTimeout);
    let target;
    if (touchEvent.currentTarget){
        target = touchEvent.currentTarget;
    }else{
        target = touchEvent.target;
    }
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
    let target;
    if (touchEvent.currentTarget){
        target = touchEvent.currentTarget;
    }else{
        target = touchEvent.target;
    }
    touchEvent.stopPropagation();
    // touchEvent.preventDefault();
    // if (!g_longTouchFlag) {
    //     openRefLink(touchEvent);
    // }
}

async function rightClickHandler(mouseEvent) {
    if (mouseEvent.buttons != 2) return;
    // 这里是临时支持../右键修改当前文档，依赖currentTarget只读取data-id
    let tempId;
    if (g_globalConfig.backToParent != "false" && $(mouseEvent.currentTarget).text().includes("../")) {
        tempId = mouseEvent.currentTarget.getAttribute("data-id");
        mouseEvent.currentTarget.setAttribute("data-id", g_currentDocId);
        // return;
    };
    mouseEvent.stopPropagation();
    mouseEvent.preventDefault();
    try {
        await deleteOrRename(mouseEvent.currentTarget, mouseEvent.ctrlKey);
    } catch (err) {
        errorPush("删除或重命名时出现错误", err);
    }
    // 这里是临时支持../右键修改当前页面，还原现场，防止跳转时再出错
    if (g_globalConfig.backToParent != "false" && $(mouseEvent.currentTarget).text().includes("../")) {
        mouseEvent.currentTarget.setAttribute("data-id", tempId);
        // return;
    };
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
        cancel: function() {
            this.remove();
            return true;},
        autofocus: false,
        okValue: language["dialog_confirm"],
        cancelValue: language["dialog_cancel"],
        skin: isDarkMode()?"dark_dialog delete_dialog":"delete_dialog"
    });
    // 依据选择对象更改标题
    let renameDialogTitle = `${language["dialog_option"]}: ${docName}`;
    if (docId == g_currentDocId) {
        renameDialogTitle = `${language["dialog_option"]}: 【${language["currentDoc"]}】${docName}`;
    }
    let renameDialog = dialog({
        title: renameDialogTitle,
        content: `<input id="dialog_rename_input" type="text" value="${docName}" autofocus onfocus="this.select();" />`,
        quickClose: true,
        button: [
            {
                value: language["dialog_create_doc"],
                callback: function() {
                    createChildDoc(docName, queryResponse, false);
                    return true;
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
        cancel: function() {
            this.remove();
            return true;},
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
                if (event.keyCode == 13 && !event.ctrlKey && !event.shiftKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    let okBtn = $(".rename_dialog button[i-id='ok']");
                    if (okBtn.length == 1) {
                        okBtn.click();
                    }else{
                        warnPush("回车匹配到多个按钮，已停止操作");
                    }
                }else if (event.keyCode == 13 && event.ctrlKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    createChildDoc(docName, queryResponse, true);
                    // let createBtn = $(`.rename_dialog button[i-id='${language["dialog_create_doc"]}']`);
                    // debugPush("createBtn", createBtn);
                    // if (createBtn.length == 1) {
                    //     createBtn.click();
                    // }else{
                    //     warnPush("回车匹配到多个按钮，已停止操作");
                    // }
                }
            })
        }
    });
    if (ctrlKey && docId != g_currentDocId){
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
    errorPush(err);
}
    // 非工具类，需要传入 原文档名，原文档数据库信息，是否连续输入
    function createChildDoc(docName, queryResponse, continueInput = false) {
        let newName = $("#dialog_rename_input").val();
        if (newName == docName || !isValidStr(newName)) {
            newName = "Untitled";
        }
        // 这个createDocWithMdAPI不太稳定 @_@
        // let id = await createDocWithMdAPI(queryResponse[0].box, queryResponse[0].hpath + `/${newName}`, "");
        let id = generateBlockId();
        createDocWithPath(queryResponse[0].box,
             queryResponse[0].path.substring(0, queryResponse[0].path.length - 3) + `/${id}.sy`, newName).then(()=>{
                layui.layer.msg(language["childDocsCreated"]);
             });
        $("#dialog_rename_input").select();
        if (!continueInput) {
            setTimeout(function(){__main(true)}, 300);
            openRefLink(undefined, id);
        }
    }
}

let refreshBtnTimeout;

let targetDocName = "";
let mutex = 0;
let g_targetDocPath;
let g_notebooks = null;
let g_notebooksIDList = null;
let g_longTouchTimeout;
const CONSTANTS = {
    MAX_AUTO_COLUMNS: 5
}
// FIXME: 笔记本获取方式
try {
    g_notebooks = window.top.siyuan.notebooks;
}catch (err) {
    warnPush("获取笔记本方法过时，请@开发者修复此问题！");
}


/* ******************************初始化，新绑定项目*********************************** */
/**
 * 初始化
 * 旧版迁移
 * 判断工作模式
 * 载入设置项
 * 判断明亮/黑夜模式
 */
async function __init__() {
    // 语言判定和跳转
    if (window.top.siyuan && window.top.siyuan.config.lang != "zh_CN") {
        if (window.location.href.indexOf("index.html") == -1 && window.location.href.indexOf("index_en.html") == -1) {
            window.location.replace(window.location.href + "index_en.html");
        } else if (window.location.href.indexOf("index_en.html") == -1) {
            window.location.replace(window.location.href.replace("index.html", "index_en.html"));
        }
        
    }
    // 先做基础外观调整
    // 更新明亮/黑夜模式
    __changeAppearance();
    // 判断工作模式
    const workEnviroment = checkWorkEnvironment();
    g_workEnvTypeCode = workEnviroment;
    switch (workEnviroment) {
        case WORK_ENVIRONMENT.WIDGET: {
            g_workEnvId = getCurrentWidgetId();
            g_currentDocId = await getCurrentDocIdF();
            g_configManager = new ConfigSaveManager(CONSTANTS_CONFIG_SAVE_MODE.WIDGET, g_workEnvId, );
            try {
                const tempWidgetAttr = await getblockAttrAPI(g_workEnvId);
                if (isValidStr(tempWidgetAttr.id)) {
                    g_justCreate = true;
                }
            }catch (err) {
                logPush("初始化时获取挂件属性err", err);
            }
            break;
        }
        case WORK_ENVIRONMENT.PLUGIN: {
            // 解析路径参数？
            g_workEnvId = await getCurrentDocIdF();
            g_currentDocId = g_workEnvId;
            if (!isValidStr(g_workEnvId)) {
                if (window.frameElement.getAttribute("id")) {
                    g_workEnvId = window.frameElement.getAttribute("id");
                }
            }
            let savePath = "/data/storage/petal/syplugin-hierarchyNavigate/listChildDocs/";
            if (window.frameElement.getAttribute("savePath")) {
                savePath = window.frameElement.getAttribute("savePath");
            }
            if (window.frameElement.dataset) {
                Object.assign(g_pluginWorkConfig, window.frameElement.dataset);
                debugPush("插件环境参数", g_pluginWorkConfig);
            }
            g_configManager = new ConfigSaveManager(CONSTANTS_CONFIG_SAVE_MODE.PLUGIN, g_workEnvId, savePath);
        }
    }
    _loadUserCSS();
    // 载入设置项
    [g_allData, g_globalConfig] = await g_configManager.loadAll();
    logPush("启动时载入的allData", g_allData);
    logPush("启动时载入的全局设置globalConfig", g_globalConfig);
    
    g_configViewManager = new ConfigViewManager(g_configManager, __reloadSettings);
    // 涉及悬停逻辑判断的还有：_hoverBtnAreaBinder、_showSetting
    if (g_globalConfig["showBtnArea"] === "true") {
        _showBtnArea(true);
    } else if (g_globalConfig["showBtnArea"] === "hover" || (isMobile() && g_globalConfig["showBtnArea"] === "false")) {
        _hoverBtnAreaBinder(true);
    } else {
        _showBtnArea(false);
    }
    // 绑定页签监听
    if (g_allData["config"]["auto"] && g_workEnvTypeCode == WORK_ENVIRONMENT.WIDGET) {
        __setObserver();
    }
    // 深色模式变化监听
    if (g_workEnvTypeCode == WORK_ENVIRONMENT.WIDGET || g_workEnvTypeCode == WORK_ENVIRONMENT.PLUGIN) {
        __darkModeObserverBinder();
    }
    // 绑定及时响应的相关事件
    __formInputChangeBinder();
    // 绑定快捷键
    __shortcutBinder();
    // 绑定基本按钮栏
    __buttonBinder();
    // 刷新printer，可能需要绑定监视器在切换后及时响应
    __refreshPrinter(true);
    // 对不同的Printer，刷新挂件高度
    if (g_myPrinter.write2file == 1) {
        window.frameElement.style.width = g_globalConfig.width_2file;
        window.frameElement.style.height = g_globalConfig.height_2file;
    }
    // 载入预设schema
    _showSchemaSelect();
    // 载入缓存处理
    if (g_myPrinter.write2file == 0 && (!g_allData["config"].auto || g_globalConfig.loadCacheWhileAutoEnable) ) {
        $("#updateTime").text(language["loading"]);
        let loadResult = false;
        try{
            loadResult = await loadContentCache({textString: g_allData["cacheHTML"]});
        }catch(err) {
            console.error(err);
        }
        if (loadResult == 0 || loadResult == 1) {
            $("#updateTime").text(language["cacheLoaded"]);
        }else{
            $("#updateTime").text(language["loadCacheFailed"]);
        }
    }
    // 自动刷新处理
    if (g_allData["config"]["auto"]) {
        //在更新/写入文档时截停操作（安全模式）
        if (g_globalConfig.safeMode && g_myPrinter.write2file == 1) return;
        // 挂件刚创建，且写入文档，禁止操作，因为widgetId未入库，无法创建；
        if (g_justCreate && g_myPrinter.write2file == 1) return;
        try {
            __main(false, g_justCreate);//初始化模式
        } catch (e) {
            errorPush("初始化时发生错误", e);
            errorShow(err.message);
        }
        
    }
}

function __changeAppearance() {
    if (isDarkMode()) {
        document.body.classList.add("dark-mode");
        document.getElementById('layui_theme_css').setAttribute('href','static/layui-v2.8.12/css/layui-dark-230803.css');
    } else {
        document.body.classList.remove("dark-mode");
        document.getElementById('layui_theme_css').removeAttribute('href');
    }
    if (g_workEnvTypeCode != WORK_ENVIRONMENT.PLUGIN && g_workEnvTypeCode != WORK_ENVIRONMENT.WIDGET) {
        $("#linksContainer").css("font-size", (window.top.siyuan.config.editor.fontSize) + "px");
    } else {
        $("#linksContainer").css("font-size", g_globalConfig.fontSize + "px");
    }
}

function _loadUserCSS() {
    getFileAPI(g_configManager.saveDirPath + "custom.css").then((result)=>{
        if (isValidStr(result)) {
            let style = document.createElement("style");
            style.setAttribute("id", "customCSS");
            style.innerHTML = result;
            document.head.appendChild(style);
        }
    });
}
/**
 * 在界面中显示schema选择栏
 */
function _showSchemaSelect() {
    logPush("Schema载入", window.location);
    const elem = document.createElement("select");
    elem.setAttribute("id", "schemaSelect");
    elem.setAttribute("lay-filter", "schemaSelect");
    elem.setAttribute("name", "schemaName");
    g_configManager.listSchema().then((listRes)=>{
        debugPush("Schema列表", listRes);
        for (let oneListRes of listRes) {
            const optionElem = document.createElement("option");
            optionElem.setAttribute("value", oneListRes.name);
            optionElem.innerText = oneListRes.name;
            elem.appendChild(optionElem);
        }
        const schemaSelectArea = document.getElementById("schema-select-area");
        if (schemaSelectArea) {
            schemaSelectArea.innerHTML = "";
            schemaSelectArea.appendChild(elem);
        }
        layui.use(function(){
            var form = layui.form;
            form.render("select", 'schema-config'); 
          
          });
    });
    // layui.form.on('select(schemaSelect)', async function(data){
    //     debugPush("Selct选择变动", data);
    //     await g_configManager.applySchema(data.value)
    //     window.location.reload();
    // });
}

/**
 * 绑定快捷键
 * @param {*} bindFlag 为false则解绑快捷键
 */
function __shortcutBinder(bindFlag = true) {
    if (bindFlag) {
        document.addEventListener("keydown", shortcutActor);
    } else {
        document.removeEventListener("keydown", shortcutActor);
    }

    function shortcutActor(event) {
        debugPush("event", event);
        if (event.code == "KeyF" && event.ctrlKey == true) {
            event.stopPropagation();
            event.preventDefault();
            logPush("检索快捷键已被按下");
            // TODO: 检索
            findDialogCreate();
            return;
        }
        if (event.code == "F5") {
            event.stopPropagation();
            event.preventDefault();
            logPush("刷新快捷键已被按下");
            // TODO: 刷新
            __main(true);
            return;
        }
        if (event.code == "KeyS" && event.ctrlKey == true) {
            event.stopPropagation();
            event.preventDefault();
            logPush("显示设置快捷键已被按下");
            _showSetting();
            return;
        }
    }
}

/**
 * 创建搜索对话框
 * @returns 
 */
function findDialogCreate() {
    if (g_myPrinter.write2file == 1) return;
    // 关闭最高的那个
    /* search对话框面板 */
    if (g_findDialog) {
        g_findDialog.remove();
        g_findDialog = null;
    } else {
        g_findDialog = dialog({
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
                    this.remove();
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
                    this.remove();
                    return false;
                }
            }],
            cancel: function(){
                this.close();
                this.remove();
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
                            warnPush("回车匹配到多个按钮，已停止操作");
                        }
                    }
                })
            }
        });
        
        g_findDialog.show(this);
    }
    
}

function __formInputChangeBinder() {
    layui.form.on('select(mode)', function(){
        logPush("changePrintMode");
        g_allData["config"].printMode = layui.form.val("general-config")["printMode"];
        __refreshPrinter();
    });
    document.getElementById("listColumn").addEventListener("change", function(){
        logPush("changeListColumn");
        if (g_myPrinter.write2file == 0) {
            g_allData["config"].listColumn = layui.form.val("general-config")["listColumn"];
            setColumn();
        }
    });
}

function __buttonBinder() {
    const topBtnElement = document.getElementById("outerSetting");
    document.getElementById("refresh").onclick = async function () { 
        // 由于按钮栏隐藏是通过透明度实现的，需要确保隐藏时不可点击
        if (topBtnElement.classList.contains("outerSetting-hide")) {
            return;
        }
        clearTimeout(refreshBtnTimeout); 
        refreshBtnTimeout = setTimeout(async function () { 
            await __main(true);
        }, 300); 
    };
    document.getElementById("refresh").ondblclick = async function () { 
        if (topBtnElement.classList.contains("outerSetting-hide")) {
            return;
        }
        clearTimeout(refreshBtnTimeout); 
        _saveDistinctConfig({"form": document.getElementById("general-config"), "field": layui.form.val("general-config")});
        _showSetting(false);
        // const distinctConfig = g_configViewManager.loadUISettings(document.getElementById("general-config"), layui.form.val("general-config"));
        // debugPush("双击刷新按钮，保存设置项", distinctConfig);
        // g_allData["config"] = distinctConfig;
        // // 保存设置项
        // g_configManager.saveDistinctConfig(distinctConfig).then(()=>{
        //     __refreshPrinter();
        // });
    };
    document.getElementById("search").onclick = function(){
        if (topBtnElement.classList.contains("outerSetting-hide")) {
            return;
        }
        findDialogCreate();
    };
    document.getElementById("setting").onclick = function(){
        if (topBtnElement.classList.contains("outerSetting-hide")) {
            return;
        }
        _showSetting();
    };
    let form = layui.form;
    form.on("submit(save)", _saveDistinctConfig);
    form.on("submit(savedefault)", _saveDefaultConfigData);
    form.on("submit(saveglobal)", _saveGlobalConfigData);
    form.on("submit(saveSchema)", _saveNewSchema);
    form.on("submit(loadIn)", _loadOneSchema);
    form.on("submit(removeSchema)", _removeOneSchema);
    layui.util.on('lay-on', {
        "global-remove-distinct": removeDistinct,
        "global-remove-other": removeOther,
        "global-remove-file": removeFile,
        "tabToModeSetting": function(event) {
            // 禁用时不跳转
            if (event[0].classList.contains("layui-btn-disabled")) return;
            layui.element.tabChange("setting-tab", "33");
        },
        "tabToGeneralSetting": function() {
            layui.element.tabChange("setting-tab", "11");
        },
        "resetWidgetHeight": resetWidgetStyle
    });
    const layer = layui.layer;
    function removeDistinct() {
        layui.layer.confirm(language["removeDistinctConfim"], {icon: 3, btn: [language["dialog_confirm"], language["dialog_cancel"]], title: language["confirmTitle"]}, async function(){
            layer.closeLast("dialog");
            let loadIndex = layer.load(1);
            await removeDistinctWorker();
            layui.layer.close(loadIndex);
        }, function(){
            layui.layer.msg(language["dialog_cancel"]);
        });
    }
    function removeOther() {
        layui.layer.confirm(language["removeOtherConfim"], {icon: 3, btn: [language["dialog_confirm"], language["dialog_cancel"]], title: language["confirmTitle"]}, async function(){
            layer.closeLast("dialog");
            let loadIndex = layer.load(1);
            await removeOtherWorker();
            layui.layer.close(loadIndex);
        }, function(){
            layui.layer.msg(language["dialog_cancel"]);
        });
    }
    function removeFile() {
        layui.layer.confirm(language["removeFileConfirm"], {icon: 3, btn: [language["dialog_confirm"], language["dialog_cancel"]], title: language["confirmTitle"]}, async function(){
            layui.layer.closeLast("dialog");
            let loadIndex = layer.load(1);
            await removeUnusedConfigFileWorker();
            layui.layer.close(loadIndex);
        }, function(){
            layui.layer.msg(language["dialog_cancel"]);
        });
    }
}

function _saveDistinctConfig(submitData) {
    const distinctConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    let modeCustom = g_myPrinter.save();
    if (!isInvalidValue(modeCustom)) {
        distinctConfig["customModeSettings"] = modeCustom;
        debugPush("getPrinterCustomConfig", distinctConfig["customModeSettings"]);
    }
    // 保存设置时清空缓存，替代切换Printer时清空缓存的操作
    g_allData["cacheHTML"] = "";
    // 保存设置项
    g_configManager.saveDistinctConfig(Object.assign(g_allData["config"], distinctConfig)).then(()=>{
    // 保存时获取printer的独立设置（现在为切换后直接刷新）
    // 也要在载入部分做处理
        // __reloadSettings();
        layui.layer.msg(language["saved"], {icon: 1, time: 700, offset: "t"});
        $("#updateTime").text(language["saved"]);
    })
    
    return false; // 阻止默认 form 跳转
}

function _saveDefaultConfigData(submitData) {
    const distinctConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    // 保存设置项
    g_configManager.saveUserConfigDefault(distinctConfig).then(()=>{
        // reload会使用本地设置Reload，可能和保存的默认设置不同,突然刷新感觉不太好
        // __reloadSettings();
        layui.layer.msg(language["saved"], {icon: 1, time: 700, offset: "t"});
        $("#updateTime").text(language["saved"]);
    });
    return false; // 阻止默认 form 跳转
}

function _saveNewSchema(submitData) {
    const distinctConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    layer.prompt({
        formType: 0,
        value: '',
        title: language["configNameSet"],
        area: ['800px', '350px'] // 自定义文本域宽高
      }, function(value, index, elem){
        // 保存设置项
        g_configManager.saveAsSchema(distinctConfig, value).then(()=>{
            // reload会使用本地设置Reload，可能和保存的默认设置不同,突然刷新感觉不太好
            // __reloadSettings();
            layui.layer.msg(language["saved"], {icon: 1, time: 700, offset: "t"});
            $("#updateTime").text(language["saved"]);
            setTimeout(_showSchemaSelect, 500);
        });
        layer.close(index); // 关闭层
      });
    
    return false; // 阻止默认 form 跳转
}

function _saveGlobalConfigData(submitData) {
    const globalConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);

    g_configManager.saveGlobalConfig(globalConfig).then(()=>{
        // __reloadSettings(); // 修改全局设置后，需要printer重载全局设置，这个是为了适应不插入emoji，但目前Printer相同时不做刷新，所以此项无效
        layui.layer.msg(language["saved"], {icon: 1, time: 700, offset: "t"});
        $("#updateTime").text(language["saved"]);
    });
    return false;
}

function _loadOneSchema(submitData) {
    const schemaConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    debugPush("选择的配置名称", schemaConfig.schemaName);
    g_configManager.applySchema(schemaConfig.schemaName).then(()=>{
        window.location.reload();
    });
    return false; // 阻止默认 form 跳转
}

function _removeOneSchema(submitData) {
    const schemaConfig = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    debugPush("选择的配置名称", schemaConfig.schemaName);
    if (schemaConfig.schemaName == "default") {
        layui.layer.msg("默认配置不可删除", {time: 3000, icon: 0});
        return false;
    }
    g_configManager.removeSchema(schemaConfig.schemaName).then(()=>{
        layui.layer.msg(language["deletedSchema"], {icon: 1, time: 700, offset: "t"});
        setTimeout(_showSchemaSelect, 500);
    });
    return false; // 阻止默认 form 跳转
}

// 读取ConfigManager中缓存的设定，重新设定自动模式、刷新printer
async function __reloadSettings() {
    // 重新读取设定 原先是：g_configManager.getAllData();读取的缓存设定
    // 直接读取界面中的设定
    const submitData = {"form": document.getElementById("general-config"), "field": layui.form.val("general-config")};
    const tempNewData = g_configViewManager.loadUISettings(submitData.form, submitData.field);
    let modeCustom = g_myPrinter.save();
    if (!isInvalidValue(modeCustom)) {
        tempNewData["customModeSettings"] = modeCustom;
        debugPush("getPrinterCustomConfig", tempNewData["customModeSettings"]);
    }
    debugPush("重载设定和Printer时获取的数据", tempNewData);
    let nowAutoMode = tempNewData["auto"];
    if (nowAutoMode != g_allData["config"]["auto"]) {
        if (nowAutoMode) {
            __setObserver();
        } else {
            mutationObserver.disconnect();
        }
    }
    // 正式载入新设定
    g_allData["config"] = Object.assign(g_allData["config"], tempNewData);
    // 刷新printer
    __refreshPrinter();
}

/**
 * 显示设置
 * @param {null} [flag=null] 为null则自动切换显示/隐藏，为true则显示，为false则隐藏
 */
function _showSetting(flag = null) {
    debugPush("innerSetting display", $("#innerSetting").css("display"));
    if (flag == true || ($("#innerSetting").css("display") == "none" && flag == null)) {
        $("#innerSetting").css("display", "");
        flag = true;
    } else {
        $("#innerSetting").css("display", "none");
        flag = false;
    }
    if (g_myPrinter.write2file == 1) {//写入文档时重设挂件大小
        window.frameElement.style.height = flag ? g_globalConfig.height_2file_setting : g_globalConfig.height_2file;
        window.frameElement.style.width = flag ? g_globalConfig.width_2file_setting : g_globalConfig.width_2file;
    }
    if (g_globalConfig.showBtnArea == "false") {
        _showBtnArea(flag);
    }
}

function _showBtnArea(flag = null) {
    let className = "outerSetting-hide";
    if (g_globalConfig["showBtnArea"] == "false" && !isMobile()) {
        $("#outerSetting").removeClass("outerSetting-hide");
        className = "outerSetting-none";
    } else {
        $("#outerSetting").removeClass("outerSetting-none");
    }
    if (flag == true || ($("#outerSetting").hasClass(className) && flag == null)) {
        debugPush("_showBtnArea remove", className);
        $("#outerSetting").removeClass(className);
    } else {
        debugPush("_showBtnArea addd", className);
        $("#outerSetting").addClass(className);
    }
}

function _hoverBtnAreaBinder(flag = null) {
    if (g_globalConfig["showBtnArea"] != "hover" ||
     (g_globalConfig["showBtnArea"] == "false" && isMobile())) return;
    const topBtnElement = document.getElementById("outerSetting");
    let mouseOverTimeout, mouseOutTimeout;
    if (flag == true || flag == null) {
        // 重置一下，使得绑定后按钮栏隐藏
        $("#outerSetting").removeClass("outerSetting-none");
        $("#outerSetting").addClass("outerSetting-hide");
        // 监听鼠标移入事件
        topBtnElement.addEventListener('mouseover', mouseoverCallBack);
        // 监听鼠标移出事件
        topBtnElement.addEventListener('mouseout', mouseoutCallBack);
    } else {
        topBtnElement.removeEventListener('mouseover', mouseoverCallBack);
        topBtnElement.removeEventListener('mouseout', mouseoutCallBack);
    }
    function mouseoverCallBack() {
        // if (topBtnElement.style.opacity != 1.0 && !mouseOverTimeout) {
            clearTimeout(mouseOutTimeout);
            mouseOverTimeout = setTimeout(function() {
                // 显示元素
                topBtnElement.classList.remove("outerSetting-hide");
                mouseOverTimeout = undefined;
                clearTimeout(mouseOutTimeout);
            }, 220);
        // }
    }
    function mouseoutCallBack() {
        clearTimeout(mouseOutTimeout);
        clearTimeout(mouseOverTimeout);
        mouseOverTimeout = undefined;
        // 3秒后隐藏元素
        mouseOutTimeout = setTimeout(function() {
            if ($("#innerSetting").css("display") != "none") return;
            topBtnElement.classList.add("outerSetting-hide");
        }, 1000);
    }
}

function __darkModeObserverBinder() {
    if (isMobile()) return;
    try {
        // UNSTABLE: 监视深色模式变化，依赖界面现实的外观模式按钮变化
        let targetNode = null;
        // v2.3.x -
        if ($(window.parent.document).find("#barThemeMode").length >= 1) {
            targetNode = $(window.parent.document).find("#barThemeMode").get(0);
        } else {
            // v2.4.1 + 
            targetNode = window.top.document.querySelector("html");
        }
        mutationObserver2.observe(targetNode, { "attributes": true, "attributeFilter": ["aria-label", "data-theme-mode"] });
        // window.top.addEventListener("change", ()=>{debugPush("changed")});
    
    } catch (err) {
        console.error(err);
        warnPush("监视外观切换事件失败");
        pushDebug("监视外观切换事件失败");
    }
}
// UNSTABLE: 此方法通过显示的页面定位页签
function __setObserver() {
    try {
        // 检查设置
        if (!g_globalConfig.switchBarAutoRefresh) {
            return;
        }
        //(思源主窗口)可见性变化时更新列表（导致在删除插件时仍然触发的错误）
        // document.addEventListener('visibilitychange', __main);
        //页签切换时更新列表
        // 获取当前文档用于前端展示的data-id
        let dataId = $(window.parent.document).find(`div.protyle:has(div[data-node-id="${g_workEnvId}")`).attr("data-id");
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
/* 退出：离开的批量操作 */

async function removeDistinctWorker() {
    let successCount = 0;
    let failIds = [];
    // 由于分页限制，可能需要多次执行
    const queryResult = await queryAPI(`SELECT * FROM blocks WHERE type='widget' AND markdown like '%listChildDocs%' AND ial like '%custom-list-child-docs%' AND id != '${getCurrentWidgetId()}'`);
    for (let result of queryResult) {
        // 尝试通过IAL解析属性
        let lcdAttrStr = "";
        let blockAttr = {};
        try {
            // 解析失败的通过getblockAttrAPI处理
            if (!isValidStr(lcdAttrStr)) {
                let tempWidgetId = result.id;
                let tempWidgetAttr = await getblockAttrAPI(tempWidgetId);
                debugPush("处理属性移除，查询属性", tempWidgetAttr, tempWidgetAttr["custom-list-child-docs"]);
                tempWidgetAttr = tempWidgetAttr["data"]["custom-list-child-docs"];
                if (isValidStr(tempWidgetAttr)) {
                    blockAttr = JSON.parse(tempWidgetAttr.replace(new RegExp("&quot;", "g"), "\""));
                }
            }
            debugPush("处理属性移除", blockAttr, blockAttr.childListId);
            // 删除列表
            if (isValidStr(blockAttr.childListId)) {
                await removeBlockAPI(blockAttr.childListId);       
            }
            // 移除属性
            await addblockAttrAPI({"custom-list-child-docs": "", "custom-lcd-cache": ""}, result.id);
            successCount++;
        } catch(err) {
            logPush("删除挂件属性失败", err);
            failIds.push(result.id);
        }
    }
    if (failIds.length > 0) {
        const text = language["removeDistinctFailed"].replace("%1%", successCount).replace("%2%", failIds.length)
                       .replace("%3%", failIds.join(","));
        layui.layer.alert(text, {
            icon: 0,
            shadeClose: false,
            title: language["workResult"],
            btn: [language["dialog_confirm"]]
        });
    } else {
        const text = language["removeDistinctSuccess"].replace("%1%", successCount).replace("%2%", failIds.length)
                       .replace("%3%", failIds.join(","));
        layui.layer.alert(text, {
            icon: 1,
            shadeClose: false,
            title: language["workResult"],
            btn: [language["dialog_confirm"]]
        });
    }
    
}

async function removeOtherWorker() {
    const queryResult =  await queryAPI(`SELECT * FROM blocks WHERE type='widget' AND markdown like '%listChildDocs%' AND id != '${getCurrentWidgetId()}'`);
    let successCount = 0;
    let failIds = [];
    for (let result of queryResult) {
        if (await removeBlockAPI(result.id)) {
            successCount++;
        } else {
            failIds.push(result.id);
        }
    }
    if (failIds.length > 0) {
        const text = language["removeOtherFailed"].replace("%1%", successCount).replace("%2%", failIds.length)
                       .replace("%3%", failIds.join(","));
        layui.layer.alert(text, {
            icon: 0,
            shadeClose: false,
            title: language["workResult"],
            btn: [language["dialog_confirm"]]
        });
    } else {
        const text = language["removeOtherSuccess"].replace("%1%", successCount).replace("%2%", failIds.length)
                       .replace("%3%", failIds.join(","));
        layui.layer.alert(text, {
            icon: 1,
            shadeClose: false,
            title: language["workResult"],
            btn: [language["dialog_confirm"]]
        });
    }
}

async function removeUnusedConfigFileWorker() {
    const fileListResult = await listFileAPI(g_configManager.saveDirPath + "data");
    let successCount = 0;
    let totalCount = 0;
    // let promiseList = [];
    for (let result of fileListResult) {
        if (result.isDir == false) {
            if (result.name.endsWith(".json")) {
                let tempId = result.name.replace(".json", "").substring(0, 22);
                const queryResult = await queryAPI(`SELECT * FROM blocks WHERE id='${tempId}'`);
                if (queryResult.length <= 0) {
                    if (await removeFileAPI(g_configManager.saveDirPath + "data/" + result.name)) {
                        successCount++;
                    }
                }
                totalCount++;
            }
        }
    }
    const text = language["removeFileSuccess"].replace("%1%", successCount).replace("%2%", totalCount - successCount);
    layui.layer.alert(text, {
        icon: 1,
        shadeClose: false,
        title: language["workResult"],
        btn: [language["dialog_confirm"]]
    });
}

async function resetWidgetStyle() {
    // 安全检查，工作环境必须为Widget
    if (g_workEnvTypeCode != WORK_ENVIRONMENT.WIDGET) {
        logPush("重设挂件高度：停止，非挂件")
        return;
    }
    if (!isValidStr(g_globalConfig.height_2file) || !isValidStr(g_globalConfig.width_2file)) {
        logPush("设置项为空，不能重设");
        return;
    }
    // 获取kramdown
    let widgetKramdown = await getKramdown(g_workEnvId);
    // 重写Kramdown
    let newWidgetKramdown = "";
    debugPush("getKramdown", widgetKramdown);
    if (widgetKramdown.includes("/widgets/listChildDocs")) {
        if (widgetKramdown.includes("style=")) {
            if (g_myPrinter.write2file == 1) {
                newWidgetKramdown = widgetKramdown.replace(new RegExp(`style="[^"]*"`, ""), `style="height: ${g_globalConfig.height_2file}; width: ${g_globalConfig.width_2file}"`);
            } else {
                newWidgetKramdown = widgetKramdown.replace(new RegExp(`style="[^"]*"`, ""), ``);
            }
            
        }else{
            if (g_myPrinter.write2file == 1) {
                newWidgetKramdown = widgetKramdown.replace(new RegExp("><\/iframe>", ""), ` style="height: ${g_globalConfig.height_2file}; width: ${g_globalConfig.width_2file}"><\/iframe>`);
            }
        }
        debugPush("【挂件更新自身样式信息】!", newWidgetKramdown);
        await updateBlockAPI(newWidgetKramdown, g_workEnvId);
    }else{
        debugPush(widgetKramdown);
        warnPush("当前id不对应listChildDocs挂件，不设定挂件样式", g_workEnvId);
    }
}

let mutationObserver = new MutationObserver(() => { __main(false) });//避免频繁刷新id
let mutationObserver2 = new MutationObserver(() => { __changeAppearance()});

let g_configManager = null;
let g_configViewManager = null;
let g_workEnvTypeCode = null;
let g_workEnvId = null;
let g_allData = null;
let g_globalConfig = null;
let g_myPrinter = null;
let g_currentDocId = null;
let g_justCreate = false;
let g_rowCount = 0;
let g_pluginWorkConfig = {
    "insertBlockAPI": "PARENT", // NEXT | PREVIOUS | PARENT
    "prohibitWrite2FileMode": false,
};
let g_findDialog = null;

// 旧全局变量


await __init__();