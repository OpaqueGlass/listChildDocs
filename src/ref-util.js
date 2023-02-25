/**
 * ref-util.js
 * 外部工具类，这里的代码来自于其他项目，详见代码注释或README.md
 */

import { isValidStr } from "./common.js";

export {openRefLink, showFloatWnd};
/**
 * 在点击<span data-type="block-ref">时打开思源块/文档
 * 为引入本项目，和原代码相比有更改
 * @refer https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/baselib/src/commonFunctionsForSiyuan.js#L118-L141
 * @license 木兰宽松许可证
 * @param {点击事件} event 
 */
let openRefLink = function(event, paramId = ""){
    
    let 主界面= window.parent.document
    let id = event?.currentTarget?.getAttribute("data-id") ?? paramId;
    // 处理笔记本等无法跳转的情况
    if (!isValidStr(id)) {return;}
    event?.preventDefault();
    event?.stopPropagation();
    let 虚拟链接 =  主界面.createElement("span")
    虚拟链接.setAttribute("data-type","block-ref")
    虚拟链接.setAttribute("data-id",id)
    虚拟链接.style.display = "none";//不显示虚拟链接，防止视觉干扰
    let 临时目标 = 主界面.querySelector(".protyle-wysiwyg div[data-node-id] div[contenteditable]")
    临时目标.appendChild(虚拟链接);
    let clickEvent = new MouseEvent("click", {
        ctrlKey: event?.ctrlKey,
        shiftKey: event?.shiftKey,
        altKey: event?.altKey,
        bubbles: true
    });
    虚拟链接.dispatchEvent(clickEvent);
    虚拟链接.remove();
}

/**
 * 打开浮窗
 * 为引入本项目，和原代码相比有更改
 * @link https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L320-L385
 * @param {事件} event
 * @returns 
 */
let showFloatWnd = function(event){
    //当前鼠标所悬停元素（块）的id
    // event.target触发事件的元素, event.currentTarget事件绑定的元素
    let blockId = event.target.getAttribute("data-node-id") ? event.target.getAttribute("data-node-id") : event.currentTarget.getAttribute("data-node-id");
    let 挂件自身元素 = getWidgetElem()? getWidgetElem() : window.frameElement;
    let 思源主界面 = window.parent.document; 
    let 挂件坐标 = 获取元素视图坐标(挂件自身元素);
    //所引用的对象的id
    let linkId = event.target.getAttribute("data-id") ? event.target.getAttribute("data-id"):blockId;
    // 处理笔记本等无法跳转的情况
    if (!isValidStr(linkId)) return;
    let 虚拟链接 = 思源主界面.createElement("span");
    虚拟链接.setAttribute("data-type", "block-ref");
    虚拟链接.setAttribute("data-id", linkId);
    let 临时目标 = 思源主界面.querySelector(
        ".protyle-wysiwyg div[data-node-id] div[contenteditable]"
    );
    临时目标.appendChild(虚拟链接);
    虚拟链接.style.position = "fixed";
    虚拟链接.style.display = "none";//不显示虚拟链接，防止视觉干扰
    挂件坐标 = 获取元素视图坐标(挂件自身元素);
    let Y = event.clientY + 挂件坐标.Y;
    let X = event.clientX + 挂件坐标.X;
    虚拟链接.style.top = Y + "px";//这个是临时创建的“block-ref”的位置，不设定应该也没啥？
    虚拟链接.style.left = X + "px";
    
    // 鼠标悬停事件，该事件的bubbles也很关键，让事件冒泡出去
    let mouseoverEvent = new MouseEvent("mouseover", {
        "button": 0,
        "cancelable": false,
        "view": window.parent,
        "detail": 1,
        "screenX": 500,
        "screenY": 500,
        "clientX": 500,
        "clientY": 500,
        "bubbles": true,
        "ctrlKey": event.ctrlKey,
        "relatedTarget": window.frameElement
    });
    // if (Y < 100 || X < 100) { 
    //     虚拟链接.remove();
    //     return null
    // }
    虚拟链接.dispatchEvent(mouseoverEvent);
    //不让悬停时挂件highlight（暂时未定位的产生原因，先通过移除class样式临时解决）
    window.frameElement.parentElement.parentElement.classList.remove("protyle-wysiwyg--hl");
    //搬运过来有修改，和上面的修改有点...冲突，此部分充满了玄学
    //强制重设popover位置，间隔5ms，重设时间1.2s
    let interval = setInterval( ()=>{
        //参考了https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L102-L117
        let panel = 思源主界面.querySelector(`.block__popover[data-oid="${linkId}"]`);
        if (panel) {
            console.log("Reset",Y,X)
            panel.style.top = Y + 36 + "px";//呃，不再覆盖链接试一下
            let left = X - (panel.offsetWidth / 2 || 0);
            if (left < 0) left = 0;
            panel.style.left = left + "px";
            panel.style.maxHeight  = (window.innerHeight - panel.getBoundingClientRect().top - 8) + "px";
            linkId = "";
        }
    }, 5);
    setTimeout( ()=> {虚拟链接.remove();}, 3000);
    setTimeout(()=>{clearInterval(interval);}, 1200);//移除重设定时器
    // console.log("test", window.top.siyuan.blockPanels);
    // 可以考虑由挂件移除blockPanel，但触发事件不好确定
    // } else (this.链接id = "")
}



/** 
 * 获取元素视图坐标
 * @refer https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L399-L413
 * @param element 要获取的元素
 * */
let 获取元素视图坐标 = function(element) {
    var scrollTop = 获取文档元素(getWidgetElem()).scrollTop;
    var scrollLeft = 获取文档元素(getWidgetElem()).scrollLeft;
    let frame宽度 = window.frameElement.offsetWidth
    let 左偏移 = 0
    let 总宽度 = getWidgetElem().offsetWidth
    左偏移 = (总宽度 - frame宽度) / 2 || 0;
    var absolutePosi = 获取元素绝对坐标(element);
    var Viewport = {
        X: absolutePosi.left - scrollLeft + 左偏移,
        Y: absolutePosi.top - scrollTop,
    };
    return Viewport;
}

/**
 * 获取挂件自身元素
 * @refer https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/baselib/src/commonFunctionsForSiyuan.js#L106-L110
 * */
let getWidgetElem = function(){
    try{
        return window.frameElement.parentElement.parentElement}
    catch(e){
        console.error("获取挂件自身元素失败window.frameElement.parentElement.parentElement");
        return null
    }
}


/**
 * 获取元素绝对坐标
 * 在原代码基础上无更改
 * @refer https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L386-L398
 * */
let 获取元素绝对坐标 = function(element) {
    element = element
        ? element
        : window.frameElement.parentElement || window.frameElement;
    var result = { left: element.offsetLeft, top: element.offsetTop };
    element.offsetParent ? (element = element.offsetParent) : null;
    while (element) {
        result["left"] += element.offsetLeft;
        result["top"] += element.offsetTop;
        element = element.offsetParent;
    }
    return result;
}
/**
 * 获取文档元素
 * 在原代码基础上无更改
 * @refer https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L414-L421
 * @param {*} element 
 * @returns 
 */
let 获取文档元素 = function(element) {
    let docElement = {};
    while (element?.classList && !element.classList.contains("protyle-content")) {
        element = element.parentElement;
    }
    docElement = element;
    return docElement;
}