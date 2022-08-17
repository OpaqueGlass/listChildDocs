export {
    postRequest,
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    pushMsgAPI,
    isValidStr,
    getCurrentDocIdF,
    getCurrentWidgetId,
    updateBlockAPI,
    insertBlockAPI,
    checkOs
};
import {token, includeOs} from "./config.js";
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

let checkResponse4Result = async function(response){
    if (response.code != 0 || response.data == null){
        return null;
    }else{
        return response;
    }
}

let checkResponse = async function(response){
    if (response.code == 0){
        return 0;
    }else{
        return -1;
    }
}

//SQL（api）
let queryAPI = async function (sqlstmt){
    let url = "/api/query/sql";
    let response = await postRequest({stmt: sqlstmt},url);
    if (response.code == 0 && response.data != null){
        return response.data;
    }
    return null;
}

//列出子文件（api）
let getSubDocsAPI = async function (notebookId, path){
    let url = "/api/filetree/listDocsByPath";
    let response = await postRequest({notebook: notebookId, path: path}, url);
    if (response.code != 0 || response.data == null){
        return new Array();
    }
    return response.data.files;
}

//添加属性（API）
let addblockAttrAPI = async function(attrs, blockid = thisWidgetId){
    let url = "/api/attr/setBlockAttrs";
    let attr = {
        id: blockid,
        attrs: attrs
    }
    let result = await postRequest(attr, url);
    return checkResponse(result);
}

//获取挂件块参数（API）
let getblockAttrAPI = async function(blockid = thisWidgetId){
    let url = "/api/attr/getBlockAttrs";
    let response = await postRequest({id: blockid}, url);
    if (response.code != 0){
        throw Error("获取挂件块参数失败");
    }
    return response;
}

/**
 * 更新块（返回值有删减）
 * @param {String} text 更新写入的文本
 * @param {String} blockid 更新的块id
 * @param {String} textType 文本类型，markdown、dom可选
 * @returns 被更新的块id，为null则未知失败，为空字符串则写入失败
 */
let updateBlockAPI = async function(text, blockid, textType = "markdown"){
    let url = "/api/block/updateBlock";
    let data = {dataType: textType, data: text, id: blockid};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null &&  isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0].id;
        }
        if (response.code == -1){
            console.warn("更新块失败", response.msg);
            return "";
        }
    }catch(err){
        console.error(err);
        console.warn(response.msg);
    }
    return null;
}

/**
 * 插入块（返回值有删减）
 * @param {*} text 文本
 * @param {*} blockid 创建的块将平级插入于该块之后
 * @param {*} textType 插入的文本类型，"markdown" or "dom"
 * @return 创建的块id，为null则未知失败，为空字符串则写入失败，错误提示信息将输出在
 */
let insertBlockAPI = async function(text, blockid, textType = "markdown"){
    let url = "/api/block/insertBlock";
    let data = {dataType: textType, data: text, previousID: blockid};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0].id;
        }
        if (response.code == -1){
            console.warn("插入块失败", response.msg);
            return "";
        }
    }catch(err){
        console.error(err);
        console.warn(response.msg);
    }
    return null;

}

/**
 * 判断字符串是否为空
 * @param {*} s 
 * @returns 非空字符串true，空字符串false
 */
let isValidStr = function(s){
    if (s == undefined || s == null || s === '') {
		return false;
	}
	return true;
}

/**
 * 推送普通消息
 * @param {*} msgText 推送的内容
 * @param {*} timeout 显示时间，单位毫秒
 * @return 0正常推送 -1 推送失败
 */
let pushMsgAPI = async function(msgText, timeout){
    let url = "/api/notification/pushMsg";
    let response = await postRequest({msg: msgText, timeout: timeout}, url);
    if (response.code != 0 || response.data == null || !isValidStr(response.data.id)){
        return -1;
    }
    return 0;
}

/**
 * 获取当前文档id（伪api）
 * 优先使用jquery查询
 */
let getCurrentDocIdF = async function(){
    let thisDocId;
    let thisWidgetId = getCurrentWidgetId();
    try{
        if (isValidStr(thisWidgetId)){
            //通过获取挂件所在页面题头图的data-node-id获取文档id
            let thisDocId = $(window.parent.document).find(`div.protyle:has(.iframe[data-node-id="${thisWidgetId}"])`)
            .find(`.protyle-background`).attr("data-node-id");
            // console.log(dataId);
            if (isValidStr(thisDocId)){
                return thisDocId;
            }
        }
        
    }catch(err){
        console.warn(err);
    }
    //还不行的话依靠widgetId sql查，最终方案（挂件刚插入时查询不到！）
    if (isValidStr(thisWidgetId)){
        let queryResult = await queryAPI("SELECT parent_id as parentId FROM blocks WHERE id = '" + thisWidgetId + "'");
        console.assert(queryResult != null, "SQL查询失败", queryResult);
        if (queryResult!= null){
            return queryResult[0].parentId;
        }
    }

    //widgetId不存在，则使用老方法（存在bug：获取当前展示的页面id（可能不是挂件所在的id））
    if (!isValidStr(thisWidgetId)){
        thisDocId = $(window.parent.document).find(".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background").attr("data-node-id");
        return thisDocId;
    }
    return null;
}

/**
 * 获取当前挂件id
 * @returns 
 */
let getCurrentWidgetId = function(){
    try{
        return window.frameElement.parentElement.parentElement.dataset.nodeId;
    }catch(err){
        console.warn("getCurrentWidgetId window...nodeId方法失效");
        return null;
    }
}

/**
 * 检查运行的操作系统
 * @return true 可以运行，当前os在允许列表中
 */
 let checkOs = function(){
    try{
        if (includeOs.indexOf(window.top.siyuan.config.system.os.toLowerCase()) != -1){
            return true;
        }
    }catch(err){
        console.error(err);
        console.warn("检查操作系统失败");
    }
    
    return false;
}
// // 移除块
// let removeBlockAPI = async function(blockid){
//     let url = "/api/block/deleteBlock";
//     let response = await postRequest({id: blockid}, url);
//     if (response.code != 0 || response.data.length != 1 || response.data[0].doOperations.length != 1 ||
//         !response.data[0].doOperations[0].id){
//         return 0;
//     }
//     return -1;
// }