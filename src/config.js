import allPrinter from './listChildDocsClass.js';
let custom_attr = {//这里列出的属性为默认属性，也可以手动更改挂件属性custom-list-child-docs来更改
    printMode: "2",//默认格式和输出位置，具体参数见下方的printerList
    childListId: "",//子文档列表块id，由挂件自动生成，对应的块将会被本挂件自动更新，请避免自行修改
    listDepth: 1,//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
    auto: true, //自动刷新
};
let setting = {
    width_2file: "30em",//将列表写入文件时，此项控制挂件的宽
    height_2file: "4em",//将列表写入文件时，此项控制挂件的高
    
}
let excludeOs = ["android", "ios"]//监视页签变化将在列出的OS上禁用
let token = "";//API鉴权token，可以不填的样子
let en = {
    refreshNeeded: "Can't find the child-doc-list block. Please click refresh button again.",
    insertBlockFailed: "Failed to create or update the unordered-list-block.",
    writeAttrFailed: "Failed to write widget properties.",
    getPathFailed: "Failed to query the path to which the current widget belongs.",
    noChildDoc: "This document appears to have no child document.",
    error: "ERROR: ",
    updateTime: "LastUpdate: ",
    modifywarn:　"Created by listChildDocs widget. Manual changes will not be saved.",
    getAttrFailed: "Failed to read widget properties.",
    wrongPrintMode: "PrintMode is incorrect. The default value has been restored, please refresh again.",
    inwidget: "Widget",
    inUrl: "siyuan URL",
    inDulChain: "Ref block",
    default: "Default",
    refreshBtn: "Click to refresh",
    depthList: "The display depth of child-doc",
    modeList: "Print mode",
    autoBtn: "'Auto' refresh",
    getAttrFailedAtInit: "Failed to read widget properties. If you just created the widget, please ignore this error and refresh again later.",
}
let zh_CN = {
    refreshNeeded: "更新目录失败，找不到原有无序列表块，再次刷新将创建新块。",
    insertBlockFailed: "创建或更新无序列表块失败，请稍后刷新重试。",
    writeAttrFailed: "写入挂件属性失败，请稍后刷新重试。",
    getPathFailed: "查询当前文档所属路径失败，请稍后刷新重试。",
    noChildDoc: "似乎没有子文档。",
    error: "错误：",
    updateTime: "更新时间：",
    modifywarn:　"此块由listChildDocs挂件创建，您的更改可能会被覆盖。如果挂件删除，请删除此块。",
    getAttrFailed: "读取挂件属性失败。",
    wrongPrintMode: "错误的输出模式设定，已恢复默认值，请刷新重试。",
    inwidget: "挂件",
    inUrl: "url",
    inDulChain: "引用块",
    default: "默认",
    refreshBtn: "刷新",
    depthList: "子文档展示层级",
    modeList: "展示方式",
    autoBtn: "'半'自动刷新",
    getAttrFailedAtInit: "读取挂件属性失败。如果是刚创建挂件，请稍后刷新重试。",
}
let language = zh_CN;//当前使用的语言
let modeName = {//key应为数字
    "0": language["default"],
    "1": language["inwidget"],
    "2": language["inUrl"],
    "3": language["inDulChain"],
}
let printerList = {//key应为数字
    "0": allPrinter.HtmlAlinkPrinter,//出错时将重置到此模式，务必存在
    "1": allPrinter.HtmlAlinkPrinter,
    "2": allPrinter.MarkdownUrlUnorderListPrinter,
    "3": allPrinter.MarkdownDChainUnorderListPrinter,
};//您可以在./listChildDocsClass.js中自定义输出格式Printer类，export，然后在此列出，并在modeName中起名

export {custom_attr, token, language, setting, printerList, modeName, excludeOs};