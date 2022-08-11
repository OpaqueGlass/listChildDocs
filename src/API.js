export {
    postRequest,
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI
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
    return checkResponse(result);
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

/**
 * 更新块（返回值有删减）
 * @param {*} text 
 * @param {*} blockid 
 * @param {*} textType 
 * @returns 更新成功的块id，为null则失败
 */
let updateBlockAPI = async function(text, blockid, textType = "markdown"){
    let url = "http://127.0.0.1:6806/api/block/updateBlock";
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
    let url = "http://127.0.0.1:6806/api/block/insertBlock";
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

// // 移除块
// let removeBlockAPI = async function(blockid){
//     let url = "http://127.0.0.1:6806/api/block/deleteBlock";
//     let response = await postRequest({id: blockid}, url);
//     if (response.code != 0 || response.data.length != 1 || response.data[0].doOperations.length != 1 ||
//         !response.data[0].doOperations[0].id){
//         return 0;
//     }
//     return -1;
// }