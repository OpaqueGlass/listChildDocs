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
    checkOs
} from './API.js'; 
import {custom_attr, language, setting, printerList, modeName} from './config.js';
import {openRefLink, showFloatWnd} from './ref-util.js'
let thisDocId = "";
let thisWidgetId = "";
let mutex = 0;
let myPrinter;
//将Markdown文本写入文件(当前挂件之后的块)
let addText2File = async function (markdownText, blockid = ""){
    let response;
    if (isValidStr(blockid)){
        response = await updateBlockAPI(markdownText, blockid);
    }else{
        response = await insertBlockAPI(markdownText, thisWidgetId);
    }
    if (isValidStr(response)){
        //将子文档无序列表块id写入属性
        custom_attr['childListId'] = response;
        //为创建的块写入警告信息
        setTimeout(function(){addblockAttrAPI({"memo": language["modifywarn"]}, custom_attr['childListId']);}, 2000);
    }else if (response == ""){
        //找不到块，移除原有属性
        custom_attr['childListId'] = "";
        console.log("更新失败，下次将创建新块", response);
        throw Error(language["refreshNeeded"]);
    }else{
        console.error("插入/更新块失败", response);
        throw Error(language["insertBlockFailed"]);
    }
}

//获取挂件属性custom-list-child-docs
let getCustomAttr = async function(){
    let response = await getblockAttrAPI(thisWidgetId);
    console.log("请求到的属性", response);
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
}

//统一写入attr到挂件属性
let setCustomAttr = async function(){
    let attrString = JSON.stringify(custom_attr);
    let response = await addblockAttrAPI({"custom-list-child-docs": attrString}, thisWidgetId);
    if (response != 0){
        throw Error(language["writeAttrFailed"]);
    }
}

//获取子文档层级目录输出文本
let getText = async function(notebook, nowDocPath){
    if (myPrinter == undefined){
        console.error("输出类Printer错误", myPrinter);
        throw Error(language["wrongPrintMode"]);
    }
    let insertData = myPrinter.beforeAll()
    let rawData = await getOneLevelText(notebook, nowDocPath, "", 1);
    if (rawData == ""){
        rawData = myPrinter.noneString(language["noChildDoc"]);
    }
    insertData += rawData + myPrinter.afterAll();
    return insertData;
}

//获取一层级子文档输出文本
let getOneLevelText = async function(notebook, nowDocPath, insertData, nowDepth){
    if (nowDepth > custom_attr.listDepth){
        return insertData;
    }
    let docs = await getSubDocsAPI(notebook, nowDocPath);
    //生成写入文本
    for (let doc of docs){
        insertData += myPrinter.align(nowDepth);
        insertData += myPrinter.oneDocLink(doc);
        if (doc.subFileCount > 0 && (nowDepth+1) <= custom_attr.listDepth){
            insertData += myPrinter.beforeChildDocs(nowDepth);
            insertData = await getOneLevelText(notebook, doc.path, insertData, nowDepth + 1);
            insertData += myPrinter.afterChildDocs(nowDepth);
        }
    }
    return insertData;
}


let debugPush = function (text,delay = 7000){
    pushMsgAPI(text, 7000);
}



/**
 * 输出错误信息至挂件
 * @param {msgText} 错误信息
 * @param {boolean} clear 输出前是否清空 
 */
let printError = function(msgText, clear = true){
    if (clear) $(".linksContainer *").remove();
    $(`<ul><li class="linksListItem errorinfo">${language["error"]}` + msgText + `</li></ul>`).appendTo("#linksContainer");
    window.frameElement.style.height = "10em";
}

/**
 * 功能主函数
 * @param {boolean} initmode 初始化模式：在初始化模式下，将不重新获取挂件属性，没有块参数的情况下也不创建新块
 * @param {boolean} manual 手动刷新：手动刷新为true，才会执行保存属性的操作
 * 
 */
let __main = async function (initmode = false, manualRefresh = false){
    if (mutex == 0) {//并没有什么用的试图防止同时执行的信号量hhhh
        mutex = 1;
    }else{
        return;
    }
    // pushMsgAPI(language["startRefresh"], 4500);
    try{
        //获取挂件参数
        if (!initmode){
            await getCustomAttr();
            await __refresh();
        }
        //以当前页面id查询当前页面所属笔记本和路径（优先使用docid，因为挂件刚创建时无法查询）
        let queryResult = await queryAPI(`SELECT box, path FROM blocks WHERE id = '${isValidStr(thisDocId) ? thisDocId : thisWidgetId}'`);
        if (queryResult == null || queryResult.length != 1){
            throw Error(language["getPathFailed"]);
        }
        let notebook = queryResult[0].box;//笔记本名
        let thisDocPath = queryResult[0].path;//当前文件路径(在笔记本下)
        //获取子文档层级文本
        let textString = await getText(notebook, thisDocPath);
        //清理原有内容
        $("#linksContainer *").remove();
        //写入子文档链接
        if (myPrinter.write2file){
            //在初次启动、并且需要创建子文档目录块时，禁止操作
            if (initmode && !isValidStr(custom_attr.childListId)){
                console.log("初次创建，不写入块");
            }else{
                await addText2File(textString, custom_attr.childListId);
            }
        }else{
            $(textString).appendTo(".linksContainer");
            //挂一下事件，处理引用块点击和浮窗
            $("#refContainer").click(openRefLink);
            $("#refContainer .refLinks").mouseover(showFloatWnd);
            //链接颜色需要另外写入，由于不是已存在的元素、且貌似无法继承
            if (window.top.siyuan.config.appearance.mode == 1){
                $(".childDocLinks").addClass("childDocLinks_dark");
            }
        }
        __refreshAppearance();
    }catch(err){
        console.error(err);
        printError(err.message);
    }
    //写入挂件属性
    try{
        if (manualRefresh){
            await setCustomAttr();
            console.log("写入挂件属性", custom_attr);
        }
    }catch(err){
        console.error(err);
        printError(err.message);
    }
    //写入更新时间
    let updateTime = new Date();
    $("#updateTime").text(language["updateTime"] + updateTime.toLocaleString());
    mutex = 0;
}

/**
 * 重新获取Printer
 * 调用前确定已经获得了printMode
 */
let __refreshPrinter = function(){
    //重新获取Printer
    if (printerList[custom_attr.printMode] != undefined){
        myPrinter = new printerList[custom_attr.printMode]();
    }else{
        custom_attr.printMode = "0";
        myPrinter = new printerList[custom_attr.printMode]();
        printError(language["wrongPrintMode"]);
    }
}

let __refresh = async function (){
    //获取id
    thisWidgetId = getCurrentWidgetId();
    thisDocId = await getCurrentDocIdF();
    //获取模式设定 刷新时，保存设定
    custom_attr["printMode"] = document.getElementById("printMode").selectedIndex.toString();
    //获取下拉选择的展示深度
    custom_attr["listDepth"] = parseInt(document.getElementById("listdepth").selectedIndex + 1);
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
    __refreshAppearance();
}

let __refreshAppearance = function(){
    //重设窗口大小
    if (myPrinter.write2file == 1){
        window.frameElement.style.width = setting.width_2file;
        window.frameElement.style.height = setting.height_2file;
    }
    //设定深色颜色（外观）
    if (window.top.siyuan.config.appearance.mode == 1){
        $("#refresh, #listdepth, #printMode").addClass("button_dark");
        $("#updateTime, #linksContainer").addClass("ordinaryText_dark");
        $(".childDocLinks").addClass("childDocLinks_dark");
    }else{
        $("#refresh, #listdepth, #printMode").removeClass("button_dark");
        $("#updateTime, #linksContainer").removeClass("ordinaryText_dark");
        $(".childDocLinks").removeClass("childDocLinks_dark");
    }
}

let __init = async function(){
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
    document.getElementById("listdepth").selectedIndex = custom_attr["listDepth"] - 1;
    document.getElementById("printMode").selectedIndex = parseInt(custom_attr["printMode"]);
    document.getElementById("autoMode").checked = custom_attr["auto"];
    //通用刷新Printer操作，必须在获取属性、写入挂件之后
    __refreshPrinter();
    __refreshAppearance();
    if (custom_attr.auto) {
        //设定事件监听
        __setObserver();
        //尝试规避 找不到块创建位置的运行时错误
        // setTimeout(()=>{ __main(true)}, 1000);
        __main(true);//初始化模式
    }
    //写入悬停提示 
    $("#refresh").attr("title", language["refreshBtn"]);
    $("#listdepth").attr("title", language["depthList"]);
    $("#printMode").attr("title", language["modeList"]);
    $("#autoMode").attr("title", language["autoBtn"]);
    //控制自动刷新选项是否显示
    if (setting.showAutoBtn){
        $("#autoMode").attr("type", "checkbox");
    }
}

let __setObserver = function (){
    try{
    //排除操作系统：
    if (!checkOs()){
        return ;
    }
    //(思源主窗口)可见性变化时更新列表（导致在删除插件时仍然触发的错误）
    // document.addEventListener('visibilitychange', __main);
    //页签切换时更新列表
    //获取当前文档用于前端展示的data-id
    let dataId = $(window.parent.document).find(`div[data-type="wnd"]:has(.protyle-background[data-node-id="${thisDocId}"])`)
        .find(`div.protyle:has(.protyle-background[data-node-id="${thisDocId}"])`).attr("data-id");
    //由dataId找所在文档的页签
    let target = $(window.parent.document).find(`div[data-type="wnd"]:has(.protyle-background[data-node-id="${thisDocId}"])`)
        .find(`.layout-tab-bar .item[data-id=${dataId}]`);
    console.assert(target.length == 1, "无法监听页签切换", target);
    //不能观察class变化，class会在每次编辑、操作时变更
    mutationObserver.observe(target[0], {"attributes": true, "attributeFilter": ["data-activetime"]});
    }catch(err){
        console.error(err);
        printError(err.message, false);
        console.warn("监视点击页签事件失败");
    }
}

let mutationObserver = new MutationObserver(()=>{__main(true)});//避免频繁刷新id
let mutationObserver2 = new MutationObserver(()=>{setTimeout(__refreshAppearance, 1500);});
//绑定按钮事件
document.getElementById("refresh").onclick=() => {__main(false, true)};
//延时初始化 过快的进行insertblock将会导致思源(v2.1.5)运行时错误
// setTimeout(__init, 300);
__init();

try {
    //用于监视深色模式变化
    if (checkOs()){
        mutationObserver2.observe($(window.parent.document).find("#barThemeMode").get(0), {"attributes": true, "attributeFilter": ["aria-label"]});
    }
    
}catch(err){
    console.error(err);
    printError(err.message,false);
    console.warn("监视外观切换事件失败");
}
