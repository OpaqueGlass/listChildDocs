export {
    postRequest,
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    pushMsgAPI,
    isValidStr
};
import {token} from "./config.js";
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
        throw Error("请求失败" + response.msg);
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
    return response;
}

//列出子文件（api）
let getSubDocsAPI = async function (notebookId, path){
    let url = "/api/filetree/listDocsByPath";
    let result = await postRequest({notebook: notebookId, path: path}, url);
    return result;
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
 * @param {*} text 
 * @param {*} blockid 
 * @param {*} textType 
 * @returns 更新成功的块id，为null则失败
 */
let updateBlockAPI = async function(text, blockid, textType = "markdown"){
    let url = "/api/block/updateBlock";
    let data = {dataType: textType, data: text, id: blockid};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0].id;
        }
    }catch(err){
        console.error(err);
    }
    return null;
}

/**
 * 插入块（返回值有删减）
 * @param {*} text 文本
 * @param {*} blockid 创建的块将平级插入于该块之后
 * @param {*} textType "markdown" or "dom"
 * @return 创建的块id，为null则创建失败
 */
let insertBlockAPI = async function(text, blockid, textType = "markdown"){
    let url = "/api/block/insertBlock";
    let data = {dataType: textType, data: text, previousID: blockid};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0].id;
        }
    }catch(err){
        console.error(err);
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
 * 通过jQuery获取当前文档id（伪api）
 */
let getCurrentDocIdFake = function(){
    let thisDocId;
    let thisWidgetId = "";
    try{
        thisDocId = $(window.parent.document).find(".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background").attr("data-node-id");
        if (!isValidStr(thisDocId)){//获取当前页面id方案2（获取的是当前挂件块id）
            throw Error("jquery获取文档id失败")
        }
    }catch(err){
        thisWidgetId = getCurrentWidgetId();
    }
    if (thisWidgetId != ""){

    }

}

let getCurrentWidgetId = function(){
    try{
        return window.frameElement.parentElement.parentElement.dataset.nodeId;
    }catch(err){
        console.warn("getCurrentWidgetId window...nodeId方法失效");
        return null;
    }
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