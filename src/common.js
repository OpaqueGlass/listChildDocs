/**
 * common.js 一些可能常用的方法
 */
import { setting } from "./config.js";
/**
 * 检查窗口状况，防止在历史预览页面刷新更改文档
 * @param thisDocId 待判断的文档id
 * @return {boolean} true: 当前情况安全，允许执行刷新操作
 * UNSTABLE: !此方法大量依赖jQuery定位页面元素
 */
export function isSafelyUpdate(thisDocId) {
    if (setting.safeModePlus == false) return true;
    // console.log($(window.top.document).find(".b3-dialog--open #historyContainer")); // 防止历史预览界面刷新
    try{
        // 判定历史预览页面
        // $(window.top.document).find(".b3-dialog--open #historyContainer").length >= 1
        if (window.top.document.querySelectorAll(".b3-dialog--open #historyContainer").length >= 1) {
            return false;
        }
        // 旧方法：存在多个编辑窗口只判断第一个的问题；保留用于判断界面是否大改
        // if ($(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == "false") {
        //     return false;
        // }
        // $(window.top.document).find(".protyle-wysiwyg").attr("contenteditable") == undefined
        if (!window.top.document.querySelector(".protyle-wysiwyg").getAttribute("contenteditable")) {
            console.warn("界面更新，请@开发者重新适配");
            return true;
        }
        // 判定文档已打开&只读模式【挂件所在文档在窗口中，且页面为编辑状态，则放行】
        // 只读模式判定警告：若在闪卡页面，且后台开启了当前文档（编辑模式），只读不会拦截
        // console.log($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false");
        // console.log($(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`));
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`)
        let candidateThisDocEditor = window.top.document.querySelector(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`);
        if (!isValidStr(candidateThisDocEditor) || candidateThisDocEditor.length <= 0) {
            console.warn("未在窗口中找到挂件所在的文档（挂件所在文档编辑器可能未打开），为防止后台更新，此操作已拦截。");
            return false;
        }
        // 判定只读模式
        // $(window.top.document).find(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).attr("contenteditable") == "false"
        if (window.top.document.querySelector(`.protyle-background[data-node-id="${thisDocId}"] ~ .protyle-wysiwyg`).getAttribute("contenteditable") == "false") {
            return false;
        }
    }catch (err) {
        console.warn("安全检查时出现错误，已放行刷新操作，错误为：", err);
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