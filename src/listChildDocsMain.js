import any from './listChildDocsClass.js'; 
let thisDocId = "";
let thisWidgetId = "";
let token = "cnft0vw0i1szq8hy";//API token
// let insert2file = 1;//1: 以Markdown超链接的形式将子文档无序列表写入源文档、不在挂件中展示
let custom_attr = {
    insert2file: 0,//将链接写入到文档
    childListId: "",//子文档列表块id
    listDepth: 2//列出子文档的最大层级
};
//向思源api发送请求
let postRequest = async function (data, url){
    let result;
    await fetch(url, {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
            "Authorization": "Token "+token,
            "Content-Type": "application/json"
        }
    }).then((response) => {
        result = response.json();
    });
    return result;
}

//SQL（api）
let queryAPI = async function (sqlstmt){
    let url = "http://127.0.0.1:6806/api/query/sql";
    let response = await postRequest({stmt: sqlstmt},url);
    return response;
}

//列出子文件（api）
let getSubDocsAPI = async function (notebookId, path){
    let url = "http://127.0.0.1:6806/api/filetree/listDocsByPath";
    let result = await postRequest({notebook: notebookId, path: path}, url);
    return result;
}

//添加属性（API）
let addblockAttrAPI = async function(attrs, blockid = thisWidgetId){
    let url = "http://127.0.0.1:6806/api/attr/setBlockAttrs";
    let attr = {
        id: blockid,
        attrs: attrs
    }
    let result = await postRequest(attr, url);
    return result;
}

//获取挂件块参数（API）
let getblockAttrAPI = async function(blockid = thisWidgetId){
    let url = "http://127.0.0.1:6806/api/attr/getBlockAttrs";
    let response = await postRequest({id: blockid}, url);
    if (response.code != 0){
        throw Error("获取挂件块参数失败");
    }
    return response;
}

//移除块
// let removeBlock = async function(blockid){
//     let url = "http://127.0.0.1:6806/api/block/deleteBlock";
//     let response = await postRequest({id: blockid}, url);
//     if (response.code != 0 || response.data.length != 1 || response.data[0].doOperations.length != 1 ||
//         !response.data[0].doOperations[0].id){
//         return 1;
//     }
//     return 0;
// }

//生成html链接文本
let getALinksText = function (doc){
    let result = `<li class="linksListItem"><a class='childDocLinks'  href="siyuan://blocks/${doc.id}">${doc.name.replace(".sy", "")}</a></li>`;
    return result;
}

//向挂件中加入子文档链接
let addDocsLinks = function (text){
    $(text).appendTo("#linksList");
}

let addText2File = async function (markdownText, blockid = ""){
    let url = isValidStr(blockid) ? "http://127.0.0.1:6806/api/block/updateBlock" : "http://127.0.0.1:6806/api/block/insertBlock";
    let postAttr = isValidStr(blockid) ? {dataType: "markdown", data: markdownText, id: blockid} : {dataType: "markdown", data: markdownText, previousID: thisWidgetId};
    let result = await postRequest(postAttr, url);
    //将子文档无序列表块id写入属性
    if (result.code == 0 && isValidStr(result.data[0].doOperations[0].id)){
        custom_attr['childListId'] = result.data[0].doOperations[0].id;
    }else if (result.code == -1){
        //找不到块，移除原有属性
        custom_attr['childListId'] = "";
        console.log("更新失败，下次将创建新块");
        throw Error("更新目录失败，找不到原有无序列表块，再次刷新将创建新块");
    }else{
        throw Error("写入或更新无序列表块失败");
    }
}

let isValidStr = function(s){
    if (s == undefined || s == null || s === '') {
		return false;
	}
	return true;
}

//获取attr
let getCustomAttr = async function(){
    let response = await getblockAttrAPI(thisWidgetId);
    let attrObject = {};
    if ('custom-list-child-docs' in response.data){
        console.log("attrString", response.data['custom-list-child-docs'].replaceAll("&quot;", "\""));
        try{
            attrObject = JSON.parse(response.data['custom-list-child-docs'].replaceAll("&quot;", "\""));
        }catch(err){
            console.warn("解析挂件属性json失败，将新建配置记录", err.message);
            return ;
        }
        Object.assign(custom_attr, attrObject);
    }
}

//统一写入attr到挂件属性
let setCustomAttr = async function(){
    let attrString = JSON.stringify(custom_attr);
    let response = await addblockAttrAPI({"custom-list-child-docs": attrString}, thisWidgetId);
}

//获取要写入的markdown文本
let getMarkdownText = async function(notebook, nowDocPath){
    let insertData = await getOneLevelText(notebook, nowDocPath, "", 1);
    return insertData;
}

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
    //为缩进无序列表引入空格
    let tabs = "";
    for (let i = 0; i < (nowDepth - 1); i++){
        tabs += "  ";
    }
    let docs = subDocsAPIResponse.data.files;
    //生成无序列表Markdown文本
    for (let doc of docs){
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0){
            docName = docName.substring(0, docName.length - 3);
        }
        if (custom_attr.insert2file == 0){
            insertData += getALinksText(doc);
        }else{
            insertData += tabs + `- [${docName}](siyuan://blocks/${doc.id})\n`;
        }
        if (doc.subFileCount > 0){
            //path去除上一层级.sy
            if (custom_attr.insert2file == 0){
                insertData += `<ul>`;
            }
            let nextDocPath = nowDocPath.replace(".sy", "") + "/" + doc.id + ".sy";
            insertData = await getOneLevelText(notebook, nextDocPath, insertData, nowDepth + 1);
            if (custom_attr.insert2file == 0){
                insertData += `</ul>`;
            }
        }
        
    }
    return insertData;
}

let __init = async function(){

}

let __main = async function (){
    //写入更新时间//TODO：考虑放到最后
    let updateTime = new Date();
    $("#updateTime").text("更新时间：" + updateTime.toLocaleString());
    try{
        //获取当前页面id[Help wanted: 还有啥稳定的方法吗？]
        thisDocId = $(window.parent.document).find(".protyle.fn__flex-1:not(.fn__none) .protyle-background").attr("data-node-id");
        thisWidgetId = window.frameElement.parentElement.parentElement.dataset.nodeId;
        console.assert(thisDocId != null && thisDocId != undefined, "当前文档id获取失败（jquery方案失败）");
        //获取挂件参数
        await getCustomAttr();
        if (thisDocId == null || thisDocId == undefined){//获取当前页面id方案2（获取的是当前挂件块id）
            thisDocId = window.frameElement.parentElement.parentElement.dataset.nodeId;
        }
        //以当前页面id查询当前页面所属笔记本和路径
        let queryResult = await queryAPI("SELECT box, path FROM blocks WHERE id = '" + thisDocId + "'");
        console.assert(queryResult.code == 0 && queryResult.data.length, "SQL查询失败", queryResult);
        if (queryResult.code != 0 || queryResult.data.length != 1){
            throw Error("查询当前文档所属路径失败");
        }
        let notebook = queryResult.data[0].box;//笔记本名
        let thisDocPath = queryResult.data[0].path;//当前文件路径(在笔记本下)
        //查询当前文件下子文件
        let markdownString = await getMarkdownText(notebook, thisDocPath);
        //清理原有内容
        $(".linksListItem").remove();
        //写入子文档链接
        if (custom_attr.insert2file){
            await addText2File(markdownString, custom_attr.childListId);
        }else{
            addDocsLinks(markdownString);
        }
        if (custom_attr.insert2file == 1){
            window.frameElement.style.width = "20em";
            window.frameElement.style.height = "4em";
        }
    }catch(err){
        console.error(err);
        $(`<li class="linksListItem errorinfo">错误：` + err.message + `</li>`).appendTo("#linksList");
        window.frameElement.style.height = "10em";
    }
    //
    await setCustomAttr();
}

//绑定按钮事件
document.getElementById("refresh").onclick=__main;
//设定挂件块大小
if (custom_attr.insert2file == 1){
    window.frameElement.style.width = "20em";
    window.frameElement.style.height = "4em";
}
//尝试规避 找不到块创建位置的运行时错误
setTimeout(__main, 1000);
//(思源主窗口)可见性变化时更新列表
// document.addEventListener('visibilitychange', __main);
//页签切换时更新列表
let targetElem = $(window.parent.document).find(".protyle.fn__flex-1:not(.fn__none)");
console.assert(targetElem.length == 1, "无法监听页签切换");
let mutationObserver = new MutationObserver(__main);
mutationObserver.observe(targetElem[0], {"attributes": true});