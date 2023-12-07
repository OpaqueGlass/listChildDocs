/**
 * common.js 一些可能常用的方法
 */

/**
 * 检查窗口状况，防止在历史预览页面刷新更改文档
 * @param thisDocId 待判断的文档id
 * @param config 检查项
 * @param thisWidgetId 待判断的widgetId（需config中启用widgetMode
 * @return {boolean} true: 当前情况安全，允许执行刷新操作
 * UNSTABLE: !此方法大量依赖jQuery定位页面元素
 */
export function isSafelyUpdate(thisDocId, customConfig = null, thisWidgetId = "") {
    let config = {
        "history": true, // 检查历史页面
        "targetDoc": true, // 检查目标文档是否已经打开，并且未启用只读模式
        "anyDoc": true, // 检查任意文档是否存在，并且未启用只读模式
        "allowWhenError": true, // 发生错误时，默认放行或拦截
        "widgetMode": false
    }
    if (config != null) {
        for (let key in customConfig) {
            if (key in config) {
                config[key] = customConfig[key];
            }else{
                warnPush("传入的自定义检查项配置部分不存在", key);
            }
        }
    }
    // logPush($(window.top.document).find(".b3-dialog--open #historyContainer")); // 防止历史预览界面刷新
    try{
        // 判定历史预览页面 history
        // $(window.top.document).find(".b3-dialog--open #historyContainer").length >= 1
        if (window.top.document.querySelectorAll(".b3-dialog--open #historyContainer").length >= 1 && config.history) {
            logPush("安全刷新：在历史页面");
            return false;
        }
        // 旧方法：存在多个编辑窗口只判断第一个的问题；保留用于判断界面是否大改
        // if ($(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == "false") {
        //     return false;
        // }
        // $(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == undefined
        let anyDocEditable = window.top.document.querySelector(".protyle-wysiwyg").getAttribute("contenteditable");
        if (anyDocEditable == undefined || anyDocEditable == null) {
            warnPush("界面更新，请@开发者重新适配");
            return false;
        }
        // if (anyDocEditable == "false" && config.anyDoc) {
        //     warnPush("存在一个文档为只读状态");
        //     return false;
        // }
        // 判定文档已打开&只读模式【挂件所在文档在窗口中，且页面为编辑状态，则放行】
        // 只读模式判定警告：若在闪卡页面，且后台开启了当前文档（编辑模式），只读不会拦截
        // logPush($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false");
        // logPush($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`));
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`)
        let candidateThisDocEditor = window.top.document.querySelector(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`);
        let candidateThisDocPopup = window.top.document.querySelector(`.block__popover[data-oid="${thisDocId}"] .protyle-wysiwyg`);
        if ((!isValidStr(candidateThisDocEditor) || candidateThisDocEditor.length <= 0)
                && (!isValidStr(candidateThisDocPopup) || candidateThisDocPopup.length <= 0)) {
            if (config.widgetMode && config.targetDoc) {
                if (window.top.document.querySelector(`.block__popover[data-oid] [data-node-id="${thisWidgetId}"]`).length <= 0) {
                    warnPush("未在窗口中找到挂件所在的文档（文档所在文档编辑器可能未打开），为防止后台更新，此操作已拦截。");
                    return false;
                }
            }else if (config.targetDoc) {
                warnPush("未在窗口中找到目标文档（文档所在文档编辑器可能未打开），为防止后台更新，此操作已拦截。");
                return false;
            }
        }
        if (candidateThisDocEditor == null && candidateThisDocPopup == null) {
            warnPush("找不到挂件所在文档");
        }
        // 判定只读模式
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false"
        if (!isMobile() && config.targetDoc && (candidateThisDocEditor == null ? candidateThisDocPopup : candidateThisDocEditor).getAttribute("contenteditable") == "false") {
            logPush("安全刷新：candidateEditor或Popup判定在只读模式", candidateThisDocEditor, candidateThisDocPopup, thisDocId);
            return false;
        }
    }catch (err) {
        warnPush(`安全检查时出现错误，已${config.allowWhenError?"放行":"禁止"}刷新操作，错误为：`, err);
        return config.allowWhenError;
    }
    
    return true;
}


/**
 * 判断字符串是否为空
 * @param {*} s 
 * @returns 非空字符串true，空字符串false
 */
export function isValidStr(s){
    if (s == undefined || s == null || s === '') {
		return false;
	}
	return true;
}

export function isInvalidValue(s) {
    if (s === undefined || s === null) {
        return true;
    }
    return false;
}

/**
 * 获取当前更新时间字符串
 * @returns 
 */
export function getUpdateString(){
    let nowDate = new Date();
    let hours = nowDate.getHours();
    let minutes = nowDate.getMinutes();
    let seconds = nowDate.getSeconds();
    hours = formatTime(hours);
    minutes = formatTime(minutes);
    seconds = formatTime(seconds);
    let timeStr = nowDate.toJSON().replace(new RegExp("-", "g"),"").substring(0, 8) + hours + minutes + seconds;
    return timeStr;
    function formatTime(num) {
        return num < 10 ? '0' + num : num;
    }
}

/**
 * 生成一个随机的块id
 * @returns 
 */
export function generateBlockId(){
    let timeStr = getUpdateString();
    let alphabet = new Array();
    for (let i = 48; i <= 57; i++) alphabet.push(String.fromCharCode(i));
    for (let i = 97; i <= 122; i++) alphabet.push(String.fromCharCode(i));
    let randomStr = "";
    for (let i = 0; i < 7; i++){
        randomStr += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    let result = timeStr + "-" + randomStr;
    return result;
}

/**
 * 转换块属性对象为{: }格式IAL字符串
 * @param {*} attrData 其属性值应当为String类型
 * @returns 
 */
export function transfromAttrToIAL(attrData) {
    let result = "{:";
    for (let key in attrData) {
        result += ` ${key}=\"${attrData[key]}\"`;
    }
    result += "}";
    if (result == "{:}") return null;
    return result;
}

export function pushDebug(text) {
    let areaElem = document.getElementById("debugArea");
    areaElem.value = areaElem.value + `\n${new Date().toLocaleTimeString()}` + text;
    areaElem.scrollTop = areaElem.scrollHeight;
}


export function isFileNameIllegal(str) {
    let regex = /[\\/:*?"<>|]/;
    return regex.test(str);
}


// debug push
let g_DEBUG = 2;
const g_NAME = "lcd";
const g_FULLNAME = "列出子文档";

/*
LEVEL 0 忽略所有
LEVEL 1 仅Error
LEVEL 2 Err + Warn
LEVEL 3 Err + Warn + Info
LEVEL 4 Err + Warn + Info + Log
LEVEL 5 Err + Warn + Info + Log + Debug
*/
export function commonPushCheck() {
    if (window.top["OpaqueGlassDebugV2"] == undefined || window.top["OpaqueGlassDebugV2"][g_NAME] == undefined) {
        return g_DEBUG;
    }
    return window.top["OpaqueGlassDebugV2"][g_NAME];
}

export function debugPush(str, ...args) {
    pushDebug(str);
    if (commonPushCheck() >= 5) {
        console.debug(`${g_FULLNAME}[D] ${new Date().toLocaleString()} ${str}`, ...args);
    }
}

export function logPush(str, ...args) {
    pushDebug(str);
    if (commonPushCheck() >= 4) {
        console.log(`${g_FULLNAME}[L] ${new Date().toLocaleString()} ${str}`, ...args);
    }
}

export function errorPush(str, ... args) {
    if (commonPushCheck() >= 1) {
        console.error(`${g_FULLNAME}[E] ${new Date().toLocaleString()} ${str}`, ...args);
    }
}

export function warnPush(str, ... args) {
    if (commonPushCheck() >= 2) {
        console.warn(`${g_FULLNAME}[W] ${new Date().toLocaleString()} ${str}`, ...args);
    }
}

export function checkWorkEnvironment() {
    if (window.siyuan == null && window.top.siyuan == null) {
        if (window.frameElement) {
            return WORK_ENVIRONMENT.IFRAME;
        }
        return WORK_ENVIRONMENT.SINGLE;
    }
    let widgetId = "";

    try {
        let widgetNodeDataset = window.frameElement.parentElement.parentElement.dataset;
        let widgetNodeDom = window.frameElement.parentElement.parentElement;
        if (isValidStr(widgetNodeDataset["nodeId"]) || isValidStr(widgetNodeDataset["id"])) {
            widgetId = widgetNodeDataset["nodeId"];
            if (widgetNodeDataset["workEnviroment"]) {
                return widgetNodeDataset["workEnviroment"];
            } else {
                if (widgetNodeDataset["type"] == undefined) {
                    return WORK_ENVIRONMENT.PLUGIN;
                } else {
                    return WORK_ENVIRONMENT.WIDGET;
                }
            }
        } else {
            return WORK_ENVIRONMENT.PLUGIN;
        }
    }catch{

    }
    return WORK_ENVIRONMENT.UNKNOWN;
}

export const WORK_ENVIRONMENT = {
    "UNKNOWN": -1, // 未知
    "SINGLE": 0, // 在单独页面
    "PLUGIN": 1, // 在思源页面，有window.siyuan上下文
    "WIDGET": 2, // 在挂件中，有挂件上下文
    "IFRAME":3, // 在页面中嵌入，但无window.siyuan上下文
}

export function isMobile() {
    return window.top.document.getElementById("sidebar") ? true : false;
};