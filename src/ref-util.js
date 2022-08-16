export {openRefLink, showFloatWnd};
/**
 * 在点击<span data-type="block-ref">时打开思源块/文档
 * 为引入本项目，和原代码相比有更改
 * @link https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/baselib/src/commonFunctionsForSiyuan.js#L118-L141
 * @license 木兰宽松许可证
 * @param {点击事件} event 
 */
let openRefLink = function(event){
    let 主界面= window.parent.document
    let id = event.target.getAttribute("data-id")
    let 虚拟链接 =  主界面.createElement("span")
    虚拟链接.setAttribute("data-type","block-ref")
    虚拟链接.setAttribute("data-id",id)
    let 临时目标 = 主界面.querySelector(".protyle-wysiwyg div[data-node-id] div[contenteditable]")
    临时目标.appendChild(虚拟链接)
    let 点击事件 =  主界面.createEvent('MouseEvents')
    点击事件.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    虚拟链接.dispatchEvent(点击事件);
    虚拟链接.remove()
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
    let 虚拟链接 = 思源主界面.createElement("span");
    虚拟链接.setAttribute("data-type", "block-ref");
    虚拟链接.setAttribute("data-id", linkId);
    let 临时目标 = 思源主界面.querySelector(
        ".protyle-wysiwyg div[data-node-id] div[contenteditable]"
    );
    临时目标.appendChild(虚拟链接);
    虚拟链接.style.position = "fixed";
    挂件坐标 = 获取元素视图坐标(挂件自身元素);
    虚拟链接.style.top = (event.clientY + 挂件坐标.Y).toString() + "px";//和浮窗弹出位置相关
    虚拟链接.style.left = (event.clientX + 挂件坐标.X).toString() + "px";
    let 点击事件 = 思源主界面.createEvent("MouseEvents");
    点击事件.initMouseEvent(
        "mouseover",
        true,
        false,
        window.parent,
        1,
        100,
        100,
        100,
        100,
        false,
        false,
        false,
        false,
        0,
        null
    );
    
    虚拟链接.dispatchEvent(点击事件);
    setTimeout( ()=> {虚拟链接.remove();},1000);
    // } else (this.链接id = "")
}

/** 
 * 获取元素视图坐标
 * https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L399-L413
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
 * https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/baselib/src/commonFunctionsForSiyuan.js#L106-L110
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
 * https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L386-L398
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
 * @link https://github.com/leolee9086/cc-template/blob/6909dac169e720d3354d77685d6cc705b1ae95be/index.html#L414-L421
 * @param {*} element 
 * @returns 
 */
let 获取文档元素 = function(element) {
    let docElement = {};
    while (element.className != "protyle-content" && element) {
        element = element.parentElement;
    }
    docElement = element;
    return docElement;
}