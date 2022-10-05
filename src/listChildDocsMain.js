import {Printer} from './listChildDocsClass.js';
import {
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    isValidStr,
    pushMsgAPI,
    getCurrentDocIdF,
    getCurrentWidgetId,
    updateBlockAPI,
    insertBlockAPI,
    checkOs,
    getDocOutlineAPI
} from './API.js'; 
import {custom_attr, language, setting} from './config.js';
import {printerList, modeName} from "./printerConfig.js";
import {openRefLink, showFloatWnd} from './ref-util.js'
let thisDocId = "";
let thisWidgetId = "";
let mutex = 0;
let myPrinter;
let showSetting;
//将Markdown文本写入文件(当前挂件之后的块)
async function addText2File(markdownText, blockid = ""){
    let attrData = {};
    //读取属性.blockid为null时不能去读
    if (isValidStr(blockid) && setting.inheritAttrs){
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
    }
    //创建/更新块
    let response;
    if (isValidStr(blockid)){
        response = await updateBlockAPI(markdownText, blockid);
    }else{
        response = await insertBlockAPI(markdownText, thisWidgetId);
    }
    if (response != null && isValidStr(response.id)){
        //将子文档无序列表块id写入属性
        custom_attr['childListId'] = response.id;
    }else if (response == null || response.id == ""){
        //找不到块，移除原有属性
        custom_attr['childListId'] = "";
        console.log("更新失败，下次将创建新块", response ? response.id:undefined);
        await setCustomAttr();//移除id属性后需要保存
        throw Error(language["refreshNeeded"]);
    }else{
        console.error("插入/更新块失败", response.id);
        throw Error(language["insertBlockFailed"]);
    }
    
    //重写属性
    //超级块重写属性特殊对待
    if (custom_attr.listColumn > 1 && setting.inheritAttrs){
        //没有启用新的模式就不写超级块了，v0.0.4的超级块逻辑没适配
        if (!setting.superBlockBeta){
            await addblockAttrAPI({"memo": language["modifywarn"]}, blockid);
            return;
        }
        //方案1，由更新返回值获取超级块下无序列表块id
        let domDataNodeId = [];
        //找超级块的直接子元素，且子元素是无序列表块（容器块）
        // console.log(response.data);
        // console.log("更新后，直接子元素", $(response.data));
        $(response.data).children().filter(".list[data-subtype='u']").each(function(){domDataNodeId.push($(this).attr("data-node-id"));});
        // $(`<div id="listChildDocs">${response.data}</div>`).find("div[data-type='NodeSuperBlock'] > .list[data-subtype='u']").each(function(){console.log($(this));domDataNodeId.push($(this).attr("data-node-id"));});
        console.assert(domDataNodeId.length >= 1, "无法在返回值中找到对应块，更新子块属性失败", domDataNodeId);
        let timeoutIncrease = 700;
        //为每个无序列表子块设定属性（其实memo设置的有点多了），延时是防止属性写入失败//上次的bug是循环内都延时5000==没延时
        domDataNodeId.forEach(async function(currentValue){
            setTimeout(async function(){await addblockAttrAPI(attrData, currentValue);console.log("设置子块属性", currentValue)}, timeoutIncrease+=700);
        });
        //延时将指定的属性写入dom
        setTimeout(
            ()=>{setAttrToDom(domDataNodeId, attrData);}
        , 700 * domDataNodeId.length);
    }else{
        attrData["memo"] = language["modifywarn"];//为创建的块写入警告信息
        //对于非超级块，已经有id了，直接写入属性
        await addblockAttrAPI(attrData, blockid);
        setAttrToDom([blockid], attrData);
    }
    
    
}

/**
 * 将属性写入对应dom元素属性中
 * 只有位于setting.includeAttrName中的属性名才会写入
 * @param {*} queryBlockIds 要将attr写入的块id，数组
 * @param {*} attrs 要设置的属性
 * 
 */
function setAttrToDom(queryBlockIds, attrs){
    for (let queryBlockId of queryBlockIds){
        for (let setAttrName of setting.includeAttrName){
            if (setAttrName in attrs){
                $(window.parent.document).find(`div[data-node-id="${queryBlockId}"]`).attr(setAttrName, attrs[setAttrName]);
            }
        }
    }
}


//获取挂件属性custom-list-child-docs
async function getCustomAttr(){
    let response = await getblockAttrAPI(thisWidgetId);
    let attrObject = {};
    if ('custom-list-child-docs' in response.data){
        try{
            attrObject = JSON.parse(response.data['custom-list-child-docs'].replaceAll("&quot;", "\""));
        }catch(err){
            console.warn("解析挂件属性json失败，将按默认值新建配置记录", err.message);
            return ;
        }
        Object.assign(custom_attr, attrObject);
    }
    if (!("id" in response.data)){
        throw Error(language["getAttrFailed"]);
    }
    console.log("请求到的属性", JSON.stringify(response.data));
}

//统一写入attr到挂件属性
async function setCustomAttr(){
    let attrString = JSON.stringify(custom_attr);
    let response = await addblockAttrAPI({"custom-list-child-docs": attrString}, thisWidgetId);
    if (response != 0){
        throw Error(language["writeAttrFailed"]);
    }
    console.log("写入挂件属性", attrString);
}

//获取子文档层级目录输出文本
async function getText(notebook, nowDocPath){
    if (myPrinter == undefined){
        console.error("输出类Printer错误", myPrinter);
        throw Error(language["wrongPrintMode"]);
    }
    let insertData = myPrinter.beforeAll();
    let rawData;
    if (custom_attr.listDepth == 0){
        rawData = await getDocOutlineText(thisDocId, 1, false);
    }else{
        rawData = await getOneLevelText(notebook, nowDocPath, "", 1);//层级从1开始
    }
    
    if (rawData == ""){
        if (custom_attr.listDepth > 0){
            rawData = myPrinter.noneString(language["noChildDoc"]);
        }else{
            rawData = myPrinter.noneString(language["noOutline"]);
        } 
    }
    insertData += rawData + myPrinter.afterAll();
    insertData = myPrinter.splitColumns(insertData, custom_attr["listColumn"], custom_attr["listDepth"]);
    return insertData;
}

/**
 * 获取一层级子文档输出文本
 * @param {*} notebook 
 * @param {*} nowDocPath 
 * @param {*} insertData 
 * @param {*} nowDepth 
 * @returns 
 */
async function getOneLevelText(notebook, nowDocPath, insertData, nowDepth){
    if (nowDepth > custom_attr.listDepth){
        return insertData;
    }
    let docs = await getSubDocsAPI(notebook, nowDocPath);
    //生成写入文本
    for (let doc of docs){
        insertData += myPrinter.align(nowDepth);
        insertData += myPrinter.oneDocLink(doc);
        if (doc.subFileCount > 0 && (nowDepth+1) <= custom_attr.listDepth){//获取下一层级子文档
            insertData += myPrinter.beforeChildDocs(nowDepth);
            insertData = await getOneLevelText(notebook, doc.path, insertData, nowDepth + 1);
            insertData += myPrinter.afterChildDocs(nowDepth);
        }else if (setting.showEndDocOutline && custom_attr.outlineDepth > 0){//终端文档列出大纲，由选项控制
            let outlines = await getDocOutlineAPI(doc.id);
            if (outlines != null){
                insertData += myPrinter.beforeChildDocs(nowDepth);
                insertData += getOneLevelOutline(outlines, nowDepth + 1, true);
                insertData += myPrinter.afterChildDocs(nowDepth);
            }
        }
    }
    return insertData;
}

/**
 * 生成文档大纲输出文本
 * @param {*} docId
 * @param {*} nowDepth 当前层级（输出文本层级）
 * @param {*} distinguish 区分大纲和页面，如果同时列出文档且需要区分，为true
 * @return {*} 仅大纲的输出文本，如果有其他，请+=保存
 */
async function getDocOutlineText(docId, nowDepth, distinguish){
    let outlines = await getDocOutlineAPI(docId);
    if (outlines == null) {console.warn("获取大纲失败");return "";}
    let result = "";
    result += getOneLevelOutline(outlines, nowDepth, distinguish);
    return result;
}

/**
 * 生成本层级大纲文本
 * @param {*} outlines 大纲对象
 * @param {*} nowDepth 当前层级（输出文本层级）
 * @param {*} distinguish 区分大纲和页面，如果同时列出文档且需要区分，为true
 * @returns 本层级及其子层级大纲生成文本，请+=保存；
 */
function getOneLevelOutline(outlines, nowDepth, distinguish){
    //大纲层级是由API返回值确定的，混合列出时不受“层级”listDepth控制
    if (outlines == null || outlines == undefined || outlines.length <= 0
        || outlines[0].depth >= custom_attr.outlineDepth) return "";
    let result = "";
    for (let outline of outlines){
        if (!isValidStr(outline.name)){//处理内部大纲类型NodeHeading的情况，也是由于Printer只读取name属性
            outline.name = outline.content;
        }
        if (distinguish){
            outline.name = `@${outline.name}`;
        }
        result += myPrinter.align(nowDepth);
        result += myPrinter.oneDocLink(outline);
        if (outline.type === "outline" && outline.blocks != null){
            result += myPrinter.beforeChildDocs();
            result += getOneLevelOutline(outline.blocks, nowDepth + 1, distinguish);
            result += myPrinter.afterChildDocs();
        }else if (outline.type == "NodeHeading" && outline.children != null){
            result += myPrinter.beforeChildDocs();
            result += getOneLevelOutline(outline.children, nowDepth + 1, distinguish);
            result += myPrinter.afterChildDocs();
        }else if (outline.type != "outline" && outline.type != "NodeHeading"){
            console.warn("未被处理的大纲情况");
        }
    }
    return result;
}

function debugPush(text,delay = 7000){
    pushMsgAPI(text, 7000);
}

/**
 * 显示/隐藏设置
 * @param {boolean} showBtn 显示设置？
 */
function showOrHideSetting(showBtn){
    let display = showBtn ? "":"none";
    $("#printMode, #listcolumn, #listdepth, #outlinedepth").css("display", display);
    $("#depthhint, #columnhint, #outlinedepthhint").css("display", display);
    if ((custom_attr.listDepth != 0 && !setting.showEndDocOutline) && showBtn){//层级不为0时不显示大纲层级
        $("#outlinedepth, #outlinedepthhint").css("display", "none");
    }
    if (myPrinter.write2file == 1){//写入文档时重设挂件大小
        window.frameElement.style.height = showBtn ? setting.height_2file_setting : setting.height_2file;
    }
}

/**
 * 控制挂件内css分列（分栏），在页面宽度不足时强制重设分列数
 */
function setColumn(){
    let nColumns = custom_attr.listColumn;
    if (window.screen.availWidth <= 768) nColumns = "";
    $("#linksContainer").css("column-count", nColumns);
}

/**
 * 输出错误信息至挂件
 * @param {msgText} 错误信息
 * @param {boolean} clear 输出前是否清空 
 */
function printError(msgText, clear = true){
    if (clear) $(".linksContainer *").remove();
    $("#linksContainer").css("column-count", "");//显示错误时不分栏
    $(`<ul><li class="linksListItem errorinfo">${language["error"]}` + msgText + `</li></ul>`).appendTo("#linksContainer");
    window.frameElement.style.height = "10em";
}

/**
 * 功能主函数
 * @param {boolean} initmode 初始化模式：在初始化模式下，将不重新获取挂件属性，没有块参数的情况下也不创建新块
 * @param {boolean} manual 手动刷新：手动刷新为true，才会执行保存属性的操作
 * 
 */
async function __main(initmode = false){
    if (mutex == 0) {//并没有什么用的试图防止同时执行的信号量hhhh
        mutex = 1;
    }else{
        return;
    }
    $("#updateTime").text(language["working"]);
    // pushMsgAPI(language["startRefresh"], 4500);
    try{
        //获取挂件参数
        if (!initmode){
            // await getCustomAttr();//决定不再支持
            await __refresh();
        }
        //以当前页面id查询当前页面所属笔记本和路径（优先使用docid，因为挂件刚创建时无法查询）
        let queryResult = await queryAPI(`SELECT box, path FROM blocks WHERE id = '${thisWidgetId ? thisWidgetId : thisDocId}'`);
        if (queryResult == null || queryResult.length < 1){
            throw Error(language["getPathFailed"]);
        }
        let notebook = queryResult[0].box;//笔记本名
        let thisDocPath = queryResult[0].path;//当前文件路径(在笔记本下)
        g_thisDocPath = notebook + thisDocPath;
        //获取子文档层级文本
        let textString = await getText(notebook, thisDocPath);
        //清理原有内容
        $("#linksContainer *").remove();
        //写入子文档链接
        if (myPrinter.write2file){
            //在初次启动且安全模式开时，禁止操作（第二次安全模式截停）；禁止初始化时创建块
            if (initmode && (setting.safeMode || custom_attr.childListId == "")){
                console.log("初次创建，不写入/更新块");
            }else if (custom_attr.childListId == ""){
                await addText2File(textString, custom_attr.childListId);
                //如果需要创建块，自动保存一下设置
                await __save();
            }else{
                await addText2File(textString, custom_attr.childListId);
            }
        }else{
            $(textString).appendTo(".linksContainer");
            //挂一下事件，处理引用块点击和浮窗
            $("#refContainer .refLinks").click(openRefLink);
            if (setting["floatWindowEnable"]) $("#refContainer .refLinks").mouseover(showFloatWnd);
            //设定分列值
            setColumn();
            //链接颜色需要另外写入，由于不是已存在的元素、且貌似无法继承
            if (window.top.siyuan.config.appearance.mode == 1){
                $(".childDocLinks").addClass("childDocLinks_dark");
            }
        }
        //issue #13 挂件自动高度
        if (setting.autoHeight && myPrinter.write2file == 0){
            console.log("挂件高度应当设为",$("body").outerHeight());
            window.frameElement.style.height = $("body").outerHeight() + 35 + "px";
        }
        // __refreshAppearance();
    }catch(err){
        console.error(err);
        printError(err.message);
    }
    //写入更新时间
    let updateTime = new Date();
    $("#updateTime").text(language["updateTime"] + updateTime.toLocaleTimeString());
    console.log("已更新子文档目录列表");
    mutex = 0;
}
//保存设置项
async function __save(){
    //获取最新设置
    await __refresh();
    //写入挂件属性
    try{
        await setCustomAttr();
        $("#updateTime").text(language["saved"]);
    }catch(err){
        console.error(err);
        printError(err.message);
    }
    __refreshAppearance();
}
/**
 * 重新获取Printer
 * 调用前确定已经获得了printMode
 */
function __refreshPrinter(){
    //重新获取Printer
    if (printerList[custom_attr.printMode] != undefined){
        myPrinter = new printerList[custom_attr.printMode]();
    }else{
        custom_attr.printMode = "0";
        myPrinter = new printerList[custom_attr.printMode]();
        printError(language["wrongPrintMode"]);
    }
}
//重新从html读取设定，读取id，更改自动模式//解耦，不再更改外观
async function __refresh(){
    //获取id
    thisWidgetId = getCurrentWidgetId();
    thisDocId = await getCurrentDocIdF();
    //获取模式设定 刷新时，从html读取设定
    custom_attr["printMode"] = document.getElementById("printMode").selectedIndex.toString();
    //获取下拉选择的展示深度
    custom_attr["listDepth"] = parseInt(document.getElementById("listdepth").value);
    //重设分列
    custom_attr["listColumn"] = parseInt(document.getElementById("listcolumn").value);
    //重设大纲层级
    custom_attr["outlineDepth"] = parseInt(document.getElementById("outlinedepth").value)
    //更换触发模式
    let nowAutoMode = document.getElementById("autoMode").checked;
    if (nowAutoMode != custom_attr["auto"]){
        if (nowAutoMode){
            __setObserver();
        }else{
            mutationObserver.disconnect();
        }
        custom_attr["auto"] = nowAutoMode;
    }

    __refreshPrinter();
    console.log("已刷新");
}

function __refreshAppearance(){
    //重设窗口大小
    if (myPrinter.write2file == 1){
        window.frameElement.style.width = setting.width_2file;
        window.frameElement.style.height = setting.height_2file;
        showOrHideSetting(false);
        showSetting = false;
    }
    //设定深色颜色（外观）
    if (window.top.siyuan.config.appearance.mode == 1){
        $("#refresh, #listdepth, #printMode, #listcolumn, #outlinedepth").addClass("button_dark");
        $("#updateTime, #linksContainer, #columnhint, #depthhint, #outlinedepthhint").addClass("ordinaryText_dark");
        $(".childDocLinks").addClass("childDocLinks_dark");
    }else{
        $("#refresh, #listdepth, #printMode, #listcolumn, #outlinedepth").removeClass("button_dark");
        $("#updateTime, #linksContainer, #columnhint, #depthhint, #outlinedepthhint").removeClass("ordinaryText_dark");
        $(".childDocLinks").removeClass("childDocLinks_dark");
    }
}

async function __init(){
    //获取id，用于在载入页面时获取挂件属性
    thisWidgetId = getCurrentWidgetId();
    thisDocId = await getCurrentDocIdF();
    //载入挂件属性
    try{
        await getCustomAttr();
    }catch(err){
        console.warn(err);
        printError(language["getAttrFailedAtInit"]);
        custom_attr.auto = false;//读取错误时关闭auto
    }
    //写入模式设定选择框的选项
    for (let key of Object.keys(printerList)){
        $(`<option value=${key}>${modeName[key]}</option>`).appendTo("#printMode");
    }
    //用于载入页面，将挂件属性写到挂件中
    // document.getElementById("listdepth").selectedIndex = custom_attr["listDepth"] - 1;
    document.getElementById("listdepth").value = custom_attr["listDepth"];
    document.getElementById("printMode").selectedIndex = parseInt(custom_attr["printMode"]);
    document.getElementById("autoMode").checked = custom_attr["auto"];
    document.getElementById("listcolumn").value = custom_attr["listColumn"];
    document.getElementById("outlinedepth").value = custom_attr["outlineDepth"];
    //通用刷新Printer操作，必须在获取属性、写入挂件之后
    __refreshPrinter();
    __refreshAppearance();
    //写入悬停提示 
    $("#refresh").attr("title", language["refreshBtn"]);
    $("#listdepth").attr("title", language["depthList"]);
    $("#printMode").attr("title", language["modeList"]);
    $("#autoMode").attr("title", language["autoBtn"]);
    $("#listcolumn").attr("title", language["columnBtn"]);
    $("#setting").attr("title", language["settingBtn"]);
    $("#depthhint").text(language["depthHint"]);
    $("#columnhint").text(language["columnHint"]);
    $("#outlinedepthhint").text(language["outlineDepthHint"]);
    $("#outlinedepthhint").css("white-space", "nowrap");//提示文字禁止折行
    //跟随软件字号设定
    $("#linksContainer").css("font-size", window.top.siyuan.config.editor.fontSize + "px");
    //控制自动刷新选项是否显示
    if (!setting.showAutoBtn){
        $("#autoMode").attr("type", "hidden");
    }
    showSetting = setting.showSettingOnStartUp;
    showOrHideSetting(showSetting);
    console.log("屏幕宽度"+ window.screen.availWidth);
    //初始化时设定列数
    if (custom_attr.listColumn > 1){
        setColumn();
    }
    //自动更新
    if (custom_attr.auto) {
        //在更新/写入文档时截停操作（安全模式）
        if (setting.safeMode && myPrinter.write2file == 1) return;
        //设定事件监听
        __setObserver();
        //尝试规避 找不到块创建位置的运行时错误
        // setTimeout(()=>{ __main(true)}, 1000);
        __main(true);//初始化模式
    }
}

function __setObserver(){
    try{
    //排除操作系统：
    if (!checkOs()){
        return ;
    }
    //(思源主窗口)可见性变化时更新列表（导致在删除插件时仍然触发的错误）
    // document.addEventListener('visibilitychange', __main);
    //页签切换时更新列表
    //获取当前文档用于前端展示的data-id
    let dataId = $(window.parent.document).find(`div.protyle:has(div[data-node-id="${thisWidgetId}")`).attr("data-id");
    //由dataId找所在文档的页签
    let target = $(window.parent.document).find(`.layout-tab-bar .item[data-id=${dataId}]`);
    console.assert(target.length == 1, "无法监听页签切换", target, dataId);
    //不能观察class变化，class会在每次编辑、操作时变更
    mutationObserver.observe(target[0], {"attributes": true, "attributeFilter": ["data-activetime"]});
    }catch(err){
        console.error(err);
        // printError("监听点击页签事件失败", false);//监听页签将作为附加功能，不再向用户展示错误提示
        console.warn("监视点击页签事件失败" + err);
    }
}

let mutationObserver = new MutationObserver(()=>{__main(true)});//避免频繁刷新id
let mutationObserver2 = new MutationObserver(()=>{setTimeout(__refreshAppearance, 1500);});
let refreshBtnTimeout;
let g_thisDocPath;
//绑定按钮事件
document.getElementById("refresh").onclick=async function(){clearTimeout(refreshBtnTimeout);refreshBtnTimeout = setTimeout(async function(){await __main(false)}, 300);};
document.getElementById("refresh").ondblclick=async function(){clearTimeout(refreshBtnTimeout); await __save();};
document.getElementById("setting").onclick=function(){
    if (showSetting){//原来为显示，改为不再显示
        showSetting = false;
    }else{
        showSetting = true;
    }
    showOrHideSetting(showSetting);
};
//延时初始化 过快的进行insertblock将会导致思源(v2.1.5)运行时错误
// setTimeout(__init, 300);
__init();

try {
    // TODO: 监视深色模式变化
    if (checkOs()){
        mutationObserver2.observe($(window.parent.document).find("#barThemeMode").get(0), {"attributes": true, "attributeFilter": ["aria-label"]});
    }
    // window.top.addEventListener("change", ()=>{console.log("changed")});
    
}catch(err){
    console.error(err);
    console.warn("监视外观切换事件失败");
}
