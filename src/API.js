/**
 * API.js
 * 用于发送思源api请求。
 */
import {token, setting} from "./config.js";
import { isValidStr, logPush, warnPush, errorPush, debugPush } from "./common.js";
/**向思源api发送请求
 * @param data 传递的信息（body）
 * @param url 请求的地址
 */
export async function postRequest(data, url){
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

export async function checkResponse4Result(response){
    if (response.code != 0 || response.data == null){
        return null;
    }else{
        return response;
    }
}

/**
 * 检查请求是否成功，返回0、-1
 * @param {*} response 
 * @returns 成功为0，失败为-1
 */
export async function checkResponse(response){
    if (response.code == 0){
        return 0;
    }else{
        return -1;
    }
}

/**SQL（api）
 * @param sqlstmt SQL语句
 */
export async function queryAPI(sqlstmt){
    let url = "/api/query/sql";
    let response = await postRequest({stmt: sqlstmt},url);
    if (response.code == 0 && response.data != null){
        return response.data;
    }
    if (response.msg != "") {
        throw new Error(`SQL ERROR: ${response.msg}`);
    }
    
    return null;
}

/**重建索引
 * @param docpath 需要重建索引的文档路径
 */
export async function reindexDoc(docpath){
    let url = "/api/filetree/reindexTree";
    let response = await postRequest({path: docpath},url);
    return 0;
}

/**列出子文件（api）
 * @param notebookId 笔记本id
 * @param path 需要列出子文件的路径
 * @param maxListCount 子文档最大显示数量
 * @param sort 排序方式（类型号）
 */
export async function getSubDocsAPI(notebookId, path, maxListCount = undefined, sort = undefined){
    let url = "/api/filetree/listDocsByPath";
    let body = {
        "notebook": notebookId,
        "path": path
    }
    if (maxListCount != undefined && maxListCount >= 0) {
        body["maxListCount"] = (maxListCount > 32 || maxListCount == 0) ? maxListCount : 32;
    }
    if (sort != undefined && sort != DOC_SORT_TYPES.FOLLOW_DOC_TREE && sort != DOC_SORT_TYPES.UNASSIGNED) {
        body["sort"] = sort;
    }else if (false){
        let sortMode = getNotebookSortModeF(notebookId);
        if (sortMode) body["sort"] = sortMode;
    }
    let response = await postRequest(body, url);
    if (response.code != 0 || response.data == null){
        return new Array();
    }

    if (maxListCount > 32 || !maxListCount || maxListCount == 0) {
        return response.data.files;
    }else{
        return response.data.files.slice(0, maxListCount);
    }
}

/**
 * 添加属性（API）
 * @param attrs 属性对象
 * @param 挂件id
 * */
export async function addblockAttrAPI(attrs, blockid){
    let url = "/api/attr/setBlockAttrs";
    let attr = {
        id: blockid,
        attrs: attrs
    }
    let result = await postRequest(attr, url);
    return checkResponse(result);
}

/**获取挂件块参数（API）
 * @param blockid
 * @return response 请访问result.data获取对应的属性
 */
export async function getblockAttrAPI(blockid){
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
 * @returns 对象，为response.data[0].doOperations[0]的值，返回码为-1时也返回null
 */
export async function updateBlockAPI(text, blockid, textType = "markdown"){
    let url = "/api/block/updateBlock";
    let data = {dataType: textType, data: text, id: blockid};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null &&  isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0];
        }
        if (response.code == -1){
            warnPush("更新块失败", response.msg);
            return null;
        }
    }catch(err){
        errorPush(err);
        warnPush(response.msg);
    }
    return null;
}

/**
 * 插入块（返回值有删减）
 * @param {string} text 文本
 * @param {string} blockid 指定的块
 * @param {string} textType 插入的文本类型，"markdown" or "dom"
 * @param {string} addType 插入到哪里？默认插入为指定块之后，NEXT 为插入到指定块之前， PARENT 为插入为指定块的子块
 * @return 对象，为response.data[0].doOperations[0]的值，返回码为-1时也返回null
 */
export async function insertBlockAPI(text, blockid, addType = "previousID", textType = "markdown", ){
    let url = "/api/block/insertBlock";
    let data = {dataType: textType, data: text};
    switch (addType) {
        case "parentID":
        case "PARENT":
        case "parentId": {
            data["parentID"] = blockid;
            break;
        }
        case "nextID":
        case "NEXT":
        case "nextId": {
            data["nextID"] = blockid;
            break;
        }
        case "previousID":
        case "PREVIOUS":
        case "previousId": 
        default: {
            data["previousID"] = blockid;
            break;
        }
    }
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0];
        }
        if (response.code == -1){
            warnPush("插入块失败", response.msg);
            return null;
        }
    }catch(err){
        errorPush(err);
        warnPush(response.msg);
    }
    return null;

}

/**
 * 获取文档大纲
 * @param {string} docid 要获取的文档id
 * @returns {*} 响应的data部分，为outline对象数组
 */
export async function getDocOutlineAPI(docid){
    let url = "/api/outline/getDocOutline";
    let data = {"id": docid};
    let response = await postRequest(data, url);
    if (response.code == 0){
        return response.data;
    }else{
        return null;
    }
}

/**
 * 插入为后置子块
 * @param {*} text 子块文本
 * @param {*} parentId 父块id
 * @param {*} textType 默认为"markdown"
 * @returns 
 */
export async function prependBlockAPI(text, parentId, textType = "markdown"){
    let url = "/api/block/prependBlock";
    let data = {"dataType": textType, "data": text, "parentID": parentId};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0];
        }
        if (response.code == -1){
            warnPush("插入块失败", response.msg);
            return null;
        }
    }catch(err){
        errorPush(err);
        warnPush(response.msg);
    }
    return null;

}
/**
 * 插入为前置子块
 * @param {*} text 子块文本
 * @param {*} parentId 父块id
 * @param {*} textType 默认为markdown
 * @returns 
 */
export async function appendBlockAPI(text, parentId, textType = "markdown"){
    let url = "/api/block/appendBlock";
    let data = {"dataType": textType, "data": text, "parentID": parentId};
    let response = await postRequest(data, url);
    try{
        if (response.code == 0 && response.data != null && isValidStr(response.data[0].doOperations[0].id)){
            return response.data[0].doOperations[0];
        }
        if (response.code == -1){
            warnPush("插入块失败", response.msg);
            return null;
        }
    }catch(err){
        errorPush(err);
        warnPush(response.msg);
    }
    return null;

}

/**
 * 推送普通消息
 * @param {string} msgText 推送的内容
 * @param {number} timeout 显示时间，单位毫秒
 * @return 0正常推送 -1 推送失败
 */
export async function pushMsgAPI(msgText, timeout){
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
export async function getCurrentDocIdF(){
    let thisDocId;
    let thisWidgetId = getCurrentWidgetId();
    
    //依靠widgetId sql查，运行时最稳定方案（但挂件刚插入时查询不到！）
    if (isValidStr(thisWidgetId)){
        try {
            let queryResult = await queryAPI("SELECT root_id as parentId FROM blocks WHERE id = '" + thisWidgetId + "'");
            console.assert(queryResult != null && queryResult.length == 1, "SQL查询失败", queryResult);
            if (queryResult!= null && queryResult.length >= 1){
                logPush("获取当前文档idBy方案A"+queryResult[0].parentId);
                return queryResult[0].parentId;
            }
        } catch (error) {
            logPush("获取文档idBy方案A失败", error);
        }
    }

    try{
        if (isValidStr(thisWidgetId)){
            //通过获取挂件所在页面题头图的data-node-id获取文档id【安卓下跳转返回有问题，原因未知】
            let thisDocId = window.top.document.querySelector(`div.protyle-content:has(.iframe[data-node-id="${thisWidgetId}"]) .protyle-background`).getAttribute("data-node-id");
            if (isValidStr(thisDocId)){
                logPush("获取当前文档idBy方案B" + thisDocId);
                return thisDocId;
            }
        }
        
    }catch(err){
        warnPush(err);
    }

    // 移动端文档id获取
    if (isMobile()) {
        try {
            // 先前是因为移动端background id更新不及时，所以使用了文档icon获取的方法
            let temp;
            temp = window.top.document.querySelector(".protyle-breadcrumb .protyle-breadcrumb__item .popover__block[data-id]")?.getAttribute("data-id");
            let iconArray = window.top.document.querySelectorAll(".protyle-breadcrumb .protyle-breadcrumb__item .popover__block[data-id]");
            for (let i = 0; i < iconArray.length; i++) {
                let iconOne = iconArray[i];
                if (iconOne.children.length > 0 
                    && iconOne.children[0].getAttribute("xlink:href") == "#iconFile"){
                    temp = iconOne.getAttribute("data-id");
                    break;
                }
            }
            debugPush("文档图标获取当前文档id", temp);
            thisDocId = temp;
        }catch(e){
            warnPush("通过文档图标获取当前文档id失败", e);
            temp = null;
        }
        if (!thisDocId) {
            thisDocId = window.top.document.querySelector(".protyle.fn__flex-1:not(.fn__none) .protyle-background")?.getAttribute("data-node-id");
            debugPush("使用background的匹配值", thisDocId);
        }
        return thisDocId;
    }

    //widgetId不存在，则使用老方法（存在bug：获取当前展示的页面id（可能不是挂件所在的id））
    if (!isValidStr(thisWidgetId)){
        try{
            thisDocId = window.top.document.querySelector(".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background").getAttribute("data-node-id");
            logPush("获取当前文档idBy方案C" + thisDocId);
        }catch(err){
            warnPush("获取当前文档id均失败");
            return null;
        }
        return thisDocId;
    }
    return null;
}

/**
 * 获取当前挂件id
 * @returns 
 */
export function getCurrentWidgetId(){
    try{
        if (!window.frameElement.parentElement.parentElement.dataset.nodeId) {
            return window.frameElement.parentElement.parentElement.dataset.id;
        }else{
            return window.frameElement.parentElement.parentElement.dataset.nodeId;
        }
    }catch(err){
        warnPush("getCurrentWidgetId window...nodeId方法失效");
        return null;
    }
}

/**
 * 检查运行的操作系统
 * @return true 可以运行，当前os在允许列表中
 */
 export function checkOs(){
    try{
        if (setting.includeOs.indexOf(window.top.siyuan.config.system.os.toLowerCase()) != -1){
            return true;
        }
    }catch(err){
        errorPush(err);
        warnPush("检查操作系统失败");
    }
    
    return false;
}
/**
 * 删除块
 * @param {*} blockid 
 * @returns 
 */
export async function removeBlockAPI(blockid){
    let url = "/api/block/deleteBlock";
    let response = await postRequest({id: blockid}, url);
    if (response.code == 0){
        return true;
    }
    warnPush("删除块失败", response);
    return false;
}

/**
 * 获取块kramdown源码
 * @param {*} blockid 
 * @returns kramdown文本
 */
export async function getKramdown(blockid){
    let url = "/api/block/getBlockKramdown";
    let response = await postRequest({id: blockid}, url);
    if (response.code == 0 && response.data != null && "kramdown" in response.data){
        return response.data.kramdown;
    }
    return null;
}

/**
 * 获取笔记本列表
 * @returns 
        "id": "20210817205410-2kvfpfn", 
        "name": "测试笔记本",
        "icon": "1f41b",
        "sort": 0,
        "closed": false
      
 */
export async function getNodebookList() {
    let url = "/api/notebook/lsNotebooks";
    let response = await postRequest({}, url);
    if (response.code == 0 && response.data != null && "notebooks" in response.data){
        return response.data.notebooks;
    }
    return null;
}

/**
 * 基于本地window.siyuan获得笔记本信息
 * @param {*} notebookId 为空获得所有笔记本信息
 * @returns 
 */
export function getNotebookInfoLocallyF(notebookId = undefined) {
    try {
        if (!notebookId) return window.top.siyuan.notebooks;
        for (let notebookInfo of window.top.siyuan.notebooks) {
            if (notebookInfo.id == notebookId) {
                return notebookInfo;
            }
        }
        return undefined;
    }catch(err) {
        errorPush(err);
        return undefined;
    }
}

/**
 * 获取笔记本排序规则
 * （为“跟随文档树“的，转为文档树排序
 * @param {*} notebookId 笔记本id，不传则为文档树排序
 * @returns 
 */
export function getNotebookSortModeF(notebookId = undefined) {
    try {
        let fileTreeSort = window.top.siyuan.config.fileTree.sort;
        if (!notebookId) return fileTreeSort;
        let notebookSortMode = getNotebookInfoLocallyF(notebookId).sortMode;
        if (notebookSortMode == DOC_SORT_TYPES.UNASSIGNED || notebookSortMode == DOC_SORT_TYPES.FOLLOW_DOC_TREE) {
            return fileTreeSort;
        }
        return notebookSortMode;
    }catch(err) {
        errorPush(err);
        return undefined;
    }
}

/**
 * 批量添加闪卡
 * @param {*} ids 
 * @param {*} deckId 目标牌组Id 
 * @param {*} oldCardsNum 原有牌组卡牌数（可选）
 * @returns （若未传入原卡牌数）添加后牌组内卡牌数,  （若传入）返回实际添加的卡牌数； 返回null表示请求失败
 */
export async function addRiffCards(ids, deckId, oldCardsNum = -1) {
    let url = "/api/riff/addRiffCards";
    let postBody = {
        deckID: deckId,
        blockIDs: ids
    };
    let response = await postRequest(postBody, url);
    if (response.code == 0 && response.data != null && "size" in response.data) {
        if (oldCardsNum < 0) {
            return response.data.size;
        }else{
            return response.data.size - oldCardsNum;
        }
    }
    warnPush("添加闪卡出错", response);
    return null;
}

/**
 * 批量移除闪卡
 * @param {*} ids 
 * @param {*} deckId 目标牌组Id 
 * @param {*} oldCardsNum 原有牌组卡牌数（可选）
 * @returns （若未传入原卡牌数）移除后牌组内卡牌数,  （若传入）返回实际移除的卡牌数； 返回null表示请求失败
 */
export async function removeRiffCards(ids, deckId, oldCardsNum = -1) {
    let url = "/api/riff/removeRiffCards";
    let postBody = {
        deckID: deckId,
        blockIDs: ids
    };
    let response = await postRequest(postBody, url);
    if (response.code == 0 && response.data != null && "size" in response.data) {
        if (oldCardsNum < 0) {
            return response.data.size;
        }else{
            return oldCardsNum - response.data.size;
        }
    }
    warnPush("移除闪卡出错", response);
    return null;
}

/**
 * 获取全部牌组信息
 * @returns 返回数组
 * [{"created":"2023-01-05 20:29:48",
 * "id":"20230105202948-xn12hz6",
 * "name":"Default Deck",
 * "size":1,
 * "updated":"2023-01-19 21:48:21"}]
 */
export async function getRiffDecks() {
    let url = "/api/riff/getRiffDecks";
    let response = await postRequest({}, url);
    if (response.code == 0 && response.data != null) {
        return response.data;
    }
    return new Array();
}

/**
 * 获取文件内容或链接信息
 * @param {*} blockid 获取的文件id
 * @param {*} size 获取的块数
 * @param {*} mode 获取模式，0为获取html；1为
 */
export async function getDoc(blockid, size = 5, mode = 0) {
    let url = "/api/filetree/getDoc";
    let response = await postRequest({id: blockid, mode: mode, size: size}, url);
    if (response.code == 0 && response.data != null) {
        return response.data;
    }
    return undefined;
}

/**
 * 获取文档导出预览
 * @param {*} docid 
 * @returns 
 */
export async function getDocPreview(docid) {
    let url = "/api/export/preview";
    let response = await postRequest({id: docid}, url);
    if (response.code == 0 && response.data != null) {
        return response.data.html;
    }
    return "";
}
/**
 * 删除文档
 * @param {*} notebookid 笔记本id
 * @param {*} path 文档所在路径
 * @returns 
 */
export async function removeDocAPI(notebookid, path) {
    let url = "/api/filetree/removeDoc";
    let response = await postRequest({"notebook": notebookid, "path": path}, url);
    if (response.code == 0) {
        return response.code;
    }
    warnPush("删除文档时发生错误", response.msg);
    return response.code;
}
/**
 * 重命名文档
 * @param {*} notebookid 笔记本id
 * @param {*} path 文档所在路径
 * @param {*} title 新文档名
 * @returns 
 */
export async function renameDocAPI(notebookid, path, title) {
    let url = "/api/filetree/renameDoc";
    let response = await postRequest({"notebook": notebookid, "path": path, "title": title}, url);
    if (response.code == 0) {
        return response.code;
    }
    warnPush("重命名文档时发生错误", response.msg);
    return response.code;
}

export function isDarkMode() {
    if (window.top.siyuan) {
        return window.top.siyuan.config.appearance.mode == 1 ? true : false;
    } else {
        let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDarkMode;
    }
}

/**
 * 通过markdown创建文件
 * @param {*} notebookid 笔记本id
 * @param {*} hpath 示例 /父文档1/父文档2/你要新建的文档名
 * @param {*} md 
 * @returns 
 */
export async function createDocWithMdAPI(notebookid, hpath, md) {
    let url = "/api/filetree/createDocWithMd";
    let response = await postRequest({"notebook": notebookid, "path": hpath, "markdown": md}, url);
    if (response.code == 0 && response.data != null) {
        return response.data.id;
    }
    return null;
}

/**
 * 
 * @param {*} notebookid 
 * @param {*} path 待创建的新文档path，即，最后应当为一个随机的id.sy
 * @param {*} title 
 * @returns 
 */
export async function createDocWithPath(notebookid, path, title = "Untitled") {
    let url = "/api/filetree/createDoc";
    let response = await postRequest({"notebook": notebookid, "path": path, "md": "", "title": title}, url);
    if (response.code == 0) {
        return true;
    }
    return false;
}

/**
 * 将对象保存为JSON文件
 * @param {*} path 
 * @param {*} object 
 * @param {boolean} format
 * @returns 
 */
export async function putJSONFile(path, object, format = false) {
    const url = "/api/file/putFile";
    const pathSplited = path.split("/");
    let fileContent = "";
    if (format) {
        fileContent = JSON.stringify(object, null, 4);
    } else {
        fileContent = JSON.stringify(object);
    }
    // File的文件名实际上无关，但这里考虑到兼容，将上传文件按照路径进行了重命名
    const file = new File([fileContent], pathSplited[pathSplited.length - 1], {type: "text/plain"});
    const data = new FormData();
    data.append("path", path);
    data.append("isDir", false);
    data.append("modTime", new Date().valueOf());
    data.append("file", file);
    return fetch(url, {
        body: data,
        method: 'POST',
        headers: {
            "Authorization": "Token "+ token
        }
    }).then((response) => {
        return response.json();
    });
}

/**
 * 从JSON文件中读取对象
 * @param {*} path 
 * @returns 
 */
export async function getJSONFile(path) {
    const url = "/api/file/getFile";
    let response = await postRequest({"path": path}, url);
    if (response.code == 404) {
        return null;
    }
    return response;
}

export async function getFileAPI(path) {
    const url = "/api/file/getFile";
    let data = {"path": path};
    let result;
    let response = await fetch(url, {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
            "Authorization": "Token "+token,
            "Content-Type": "application/json"
        }
    });
    result = await response.text();
    try {
        let jsonresult = JSON.parse(result);
        if (jsonresult.code == 404) {
            return null;
        }
        return result;
    } catch(err) {

    }
    return result;
}

/**
 * 列出工作空间下的文件
 * @param {*} path  例如"/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
 * @returns isDir, isSymlink, name三个属性
 */
export async function listFileAPI(path) {
    const url = "/api/file/readDir";
    let response = await postRequest({"path": path}, url);
    if (response.code == 0) {
        return response.data;
    }
    return [];
}

export async function removeFileAPI(path) {
    const url = "/api/file/removeFile";
    let response = await postRequest({"path": path}, url);
    if (response.code == 0) {
        return true;
    } else {
        return false;
    }
}

export function isMobile() {
    return window.top.document.getElementById("sidebar") ? true : false;
};

export const DOC_SORT_TYPES = {
    FILE_NAME_ASC: 0,
    FILE_NAME_DESC: 1,
    NAME_NAT_ASC: 4,
    NAME_NAT_DESC: 5,
    CREATED_TIME_ASC: 9,
    CREATED_TIME_DESC: 10,
    MODIFIED_TIME_ASC: 2,
    MODIFIED_TIME_DESC: 3,
    REF_COUNT_ASC: 7,
    REF_COUNT_DESC: 8,
    DOC_SIZE_ASC: 11,
    DOC_SIZE_DESC: 12,
    SUB_DOC_COUNT_ASC: 13,
    SUB_DOC_COUNT_DESC: 14,
    CUSTOM_SORT: 6,
    FOLLOW_DOC_TREE: 15, 
    UNASSIGNED: 256,
};  