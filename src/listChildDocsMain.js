import any from './listChildDocsClass.js';
import {
    postRequest,
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    isValidStr,
    pushMsgAPI
} from './API.js'; 
import {custom_attr, language, setting, printerList} from './config.js';
let thisDocId = "";
let thisWidgetId = "";
let mutex = 0;
let myPrinter;
//将Markdown文本写入文件(当前挂件之后的块)
let addText2File = async function (markdownText, blockid = ""){
    let url = isValidStr(blockid) ? "/api/block/updateBlock" : "/api/block/insertBlock";
    let postAttr = isValidStr(blockid) ? {dataType: "markdown", data: markdownText, id: blockid} : {dataType: "markdown", data: markdownText, previousID: thisWidgetId};
    let result = await postRequest(postAttr, url);
    //将子文档无序列表块id写入属性
    if (result.code == 0 && isValidStr(result.data[0].doOperations[0].id)){
        custom_attr['childListId'] = result.data[0].doOperations[0].id;
        //写入警告信息
        setTimeout(function(){addblockAttrAPI({"memo": language["modifywarn"]}, custom_attr['childListId']);}, 2000);
        
    }else if (result.code == -1){
        //找不到块，移除原有属性
        custom_attr['childListId'] = "";
        console.log("更新失败，下次将创建新块");
        throw Error(language["refreshNeeded"]);
    }else{
        throw Error(language["insertBlockFailed"]);
    }
}

//获取挂件属性custom-list-child-docs
let getCustomAttr = async function(){
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
    if (! "id" in response.data){
        throw Error(language["getAttrFailed"])
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
    insertData += await getOneLevelText(notebook, nowDocPath, "", 1);
    insertData += myPrinter.afterAll()
    return insertData;
}

//获取一层级子文档输出文本
let getOneLevelText = async function(notebook, nowDocPath, insertData, nowDepth){
    if (nowDepth > custom_attr.listDepth){
        return insertData;
    }
    let subDocsAPIResponse = await getSubDocsAPI(notebook, nowDocPath);
    if (subDocsAPIResponse.code != 0 || subDocsAPIResponse.data == null ||
        subDocsAPIResponse.data.files == undefined){
        console.warn("请求子文档失败", subDocsAPIResponse);
        return insertData;
    }
    let docs = subDocsAPIResponse.data.files;
    //生成写入文本
    for (let doc of docs){
        insertData += myPrinter.align(nowDepth);
        insertData += myPrinter.oneDocLink(doc);
        if (doc.subFileCount > 0 && (nowDepth+1) <= custom_attr.listDepth){
            insertData += myPrinter.beforeChildDocs(nowDepth);
            //path去除上一层级.sy
            let nextDocPath = nowDocPath.replace(".sy", "") + "/" + doc.id + ".sy";
            insertData = await getOneLevelText(notebook, nextDocPath, insertData, nowDepth + 1);
            insertData += myPrinter.afterChildDocs(nowDepth);
        }
    }
    return insertData;
}

let __refresh = async function (){
    if (printerList[custom_attr.printMode] != undefined){
        //重新获取Printer
        myPrinter = new printerList[custom_attr.printMode]();
    }else{
        custom_attr.printMode = "default";
        myPrinter = new printerList[custom_attr.printMode]();
        throw Error(language["wrongPrintMode"]);
    }
    
    //重设窗口大小
    if (myPrinter.write2file == 1){
        window.frameElement.style.width = setting.width_2file;
        window.frameElement.style.height = setting.height_2file;
    }
    //设定深色颜色（外观）
    
    if (window.top.siyuan.config.appearance.mode == 1){
        $("#refresh, #listdepth").attr("style", "background-color:darkslategray; color: white;");
        $("#updateTime").attr("style", "color: darkgray;");
        console.log("Hihi");
    }else{
        
    }
    
}

let __main = async function (initmode = false){
    if (mutex == 0) {
        mutex = 1;
    }else{
        return;
    }
    pushMsgAPI("开始更新--listChildDoc", 1500);
    try{
        //获取挂件参数
        if (!initmode){
            await getCustomAttr();
            await __refresh();
        }
        //获取下拉选择的展示深度
        custom_attr["listDepth"] = parseInt(document.getElementById("listdepth").selectedIndex + 1);
        
        //以当前页面id查询当前页面所属笔记本和路径
        let queryResult = await queryAPI("SELECT box, path FROM blocks WHERE id = '" + thisDocId + "'");
        console.assert(queryResult.code == 0 && queryResult.data.length, "SQL查询失败", queryResult);
        if (queryResult.code != 0 || queryResult.data.length != 1){
            throw Error(language["getPathFailed"]);
        }
        let notebook = queryResult.data[0].box;//笔记本名
        let thisDocPath = queryResult.data[0].path;//当前文件路径(在笔记本下)
        //获取子文档层级文本
        let textString = await getText(notebook, thisDocPath);
        //清理原有内容
        $("#linksContainer *").remove();
        if (textString == ""){
            textString = "* " + language["noChildDoc"];
        }
        console.log("otuput",textString);
        //写入子文档链接
        if (myPrinter.write2file){
            await addText2File(textString, custom_attr.childListId);
        }else{
            $(textString).appendTo(".linksContainer");
        }
    }catch(err){
        console.error(err);
        $(".linksContainer *").remove();
        $(`<ul><li class="linksListItem errorinfo">${language["error"]}` + err.message + `</li></ul>`).appendTo("#linksContainer");
        window.frameElement.style.height = "10em";
    }
    //写入挂件属性
    try{
        await setCustomAttr();
    }catch(err){
        console.error(err);
        $(`<li class="linksListItem errorinfo">${language["error"]}` + err.message + `</li>`).appendTo("#linksList");
        window.frameElement.style.height = "10em";
    }
    
    //写入更新时间
    let updateTime = new Date();
    $("#updateTime").text(language["updateTime"] + updateTime.toLocaleString());
    mutex = 0;
}

let __save = async function(){
    await getCustomAttr();
    custom_attr["listDepth"] = parseInt(document.getElementById("listdepth").selectedIndex + 1);
    await setCustomAttr();
}

let __init = async function(){
    //获取当前页面id[Help wanted: 还有啥稳定的方法吗？]
    // thisDocId = $(window.parent.document).find(".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background").attr("data-node-id");
    thisWidgetId = window.frameElement.parentElement.parentElement.dataset.nodeId;
    let queryResult = await queryAPI("SELECT box, path, parent_id as parentId FROM blocks WHERE id = '" + thisWidgetId + "'");
    console.assert(queryResult.code == 0 && queryResult.data.length, "SQL查询失败", queryResult);
    if (queryResult.code != 0 || queryResult.data.length != 1){
        throw Error(language["getPathFailed"]);
    }
    thisDocId = queryResult.data[0].parentId;
    console.log("sql", queryResult.data);
    console.log("thisdocid", thisDocId);
    console.assert(thisDocId != null && thisDocId != undefined, "当前文档id获取失败（jquery方案失败）");
    if (thisDocId == null || thisDocId == undefined){//获取当前页面id方案2（获取的是当前挂件块id）
        thisDocId = window.frameElement.parentElement.parentElement.dataset.nodeId;
    }
    //尝试规避 找不到块创建位置的运行时错误
    setTimeout(()=>{ __main(true)}, 1000);
    //获取展示层级（参数）
    await getCustomAttr();
    document.getElementById("listdepth").selectedIndex = custom_attr["listDepth"] - 1;
    //通用刷新操作
    await __refresh();
    //设置窗口大小
    //custom_attr.insert2file
    if (myPrinter.write2file == 1){
        window.frameElement.style.width = setting.width_2file;
        window.frameElement.style.height = setting.height_2file;
    }
    //设定事件监听
    __setObserver();
}

let __setObserver = function (){
    //(思源主窗口)可见性变化时更新列表（导致在删除插件时仍然触发的错误）
    // document.addEventListener('visibilitychange', __main);
    //页签切换时更新列表
    let test = function (mutationsList, observer){
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified.', mutation);
            }
        }
    }
    //获取dataId
    let dataId = $(window.parent.document).find(`div[data-type="wnd"]:has(.protyle-background[data-node-id="${thisDocId}"])`)
        .find(`div.protyle:has(.protyle-background[data-node-id="${thisDocId}"])`).attr("data-id");
    // console.log(dataId);
    // let target = $(window.parent.document).find(`div[data-type="wnd"]:has(.protyle-background[data-node-id="${thisDocId}"])`).find(".layout-tab-bar .item");
    //由dataId找页签，挂上监视
    let target = $(window.parent.document).find(`div[data-type="wnd"]:has(.protyle-background[data-node-id="${thisDocId}"])`)
        .find(`.layout-tab-bar .item[data-id=${dataId}]`);
    // console.log(target);
    console.assert(target.length == 1, "无法监听页签切换", target);
    let mutationObserver = new MutationObserver(__main);
    //不能观察class变化，class会在每次编辑、操作时变更
    mutationObserver.observe(target[0], {"attributes": true, "attributeFilter": ["data-activetime"]});
    
}
//绑定按钮事件
document.getElementById("refresh").onclick=() => {__main(false)};
document.getElementById("savedepth").onclick=__save;
document.getElementById("savedepth").style.display = "none";
__init();
setTimeout(__setObserver, 1000);
//用于监视深色模式变化
let mutationObserver2 = new MutationObserver(()=>{console.log("hh");setTimeout(__refresh, 2000);});
console.log($(window.parent.document).find("#barThemeMode").get(0));
mutationObserver2.observe($(window.parent.document).find("#barThemeMode").get(0), {"attributes": true, "attributeFilter": ["aria-label"]});
//问题：当前页签在后台未展示时刷新页面，挂件将获取其他文档为主文档
//切换深色模式后，监听页签变化也会设置错误
//修复意见：以挂件id为准->docId->找到页签id，挂监视
//或者手动刷新，将docId，widgetid写入属性中，非手动刷新时，需要重新获取；