/**
 * common.js 一些可能常用的方法
 */
import { setting } from "./config.js";
/**
 * 检查窗口状况，防止在历史预览页面刷新更改文档
 * @param thisDocId 待判断的文档id
 * @param config 检查项
 * @param thisWidgetId 待判断的widgetId（需config中启用widgetMode
 * @return {boolean} true: 当前情况安全，允许执行刷新操作
 * UNSTABLE: !此方法大量依赖jQuery定位页面元素
 */
export function isSafelyUpdate(thisDocId, customConfig = null, thisWidgetId = "") {
    if (setting.safeModePlus == false) return true;
    let config = {
        "history": true, // 检查历史页面
        "targetDoc": true, // 检查目标文档是否已经打开，并且未启用只读模式
        "anyDoc": true, // 检查任意文档是否存在，并且未启用只读模式
        "allowWhenError": false, // 发生错误时，默认放行或拦截
        "widgetMode": false
    }
    if (config != null) {
        for (let key in customConfig) {
            if (key in config) {
                config[key] = customConfig[key];
            }else{
                console.warn("传入的自定义检查项配置部分不存在", key);
            }
        }
    }
    // console.log($(window.top.document).find(".b3-dialog--open #historyContainer")); // 防止历史预览界面刷新
    try{
        // 判定历史预览页面 history
        // $(window.top.document).find(".b3-dialog--open #historyContainer").length >= 1
        if (window.top.document.querySelectorAll(".b3-dialog--open #historyContainer").length >= 1 && config.history) {
            return false;
        }
        // 旧方法：存在多个编辑窗口只判断第一个的问题；保留用于判断界面是否大改
        // if ($(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == "false") {
        //     return false;
        // }
        // $(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == undefined
        let anyDocEditable = window.top.document.querySelector(".protyle-wysiwyg").getAttribute("contenteditable");
        if (anyDocEditable == undefined || anyDocEditable == null) {
            console.warn("界面更新，请@开发者重新适配");
            return false;
        }
        // if (anyDocEditable == "false" && config.anyDoc) {
        //     console.warn("存在一个文档为只读状态");
        //     return false;
        // }
        // 判定文档已打开&只读模式【挂件所在文档在窗口中，且页面为编辑状态，则放行】
        // 只读模式判定警告：若在闪卡页面，且后台开启了当前文档（编辑模式），只读不会拦截
        // console.log($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false");
        // console.log($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`));
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`)
        let candidateThisDocEditor = window.top.document.querySelector(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`);
        let candidateThisDocPopup = window.top.document.querySelector(`.block__popover[data-oid="${thisDocId}"] .protyle-wysiwyg`);
        if ((!isValidStr(candidateThisDocEditor) || candidateThisDocEditor.length <= 0)
                && (!isValidStr(candidateThisDocPopup) || candidateThisDocPopup.length <= 0)) {
            if (config.widgetMode && config.targetDoc) {
                if (window.top.document.querySelector(`.block__popover[data-oid] [data-node-id="${thisWidgetId}"]`).length <= 0) {
                    console.warn("未在窗口中找到挂件所在的文档（文档所在文档编辑器可能未打开），为防止后台更新，此操作已拦截。");
                    return false;
                }
            }else if (config.targetDoc) {
                console.warn("未在窗口中找到目标文档（文档所在文档编辑器可能未打开），为防止后台更新，此操作已拦截。");
                return false;
            }
        }
        if (candidateThisDocEditor == null && candidateThisDocPopup == null) {
            console.warn("找不到挂件所在文档");
        }
        // 判定只读模式
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false"
        if (config.targetDoc && (candidateThisDocEditor == null ? candidateThisDocPopup : candidateThisDocEditor).getAttribute("contenteditable") == "false") {
            return false;
        }
    }catch (err) {
        console.warn(`安全检查时出现错误，已放行刷新操作？${config.allowWhenError}，错误为：`, err);
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
    let timeStr = nowDate.toJSON().replaceAll("-","").substring(0, 8) + nowDate.toLocaleTimeString().replaceAll(":", "");
    return timeStr;
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