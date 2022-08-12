import allPrinter from './listChildDocsClass.js';
let custom_attr = {//这里列出的属性为默认属性，也可以手动更改挂件属性custom-list-child-docs来更改
    printMode: "url",//默认格式和输出位置，具体参数见下方的printerList
    childListId: "",//子文档列表块id，由挂件自动生成，对应的块将会被本挂件自动更新，请避免自行修改
    listDepth: 2//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
};
let setting = {
    width_2file: "30em",//将列表写入文件时，此项控制挂件的宽
    height_2file: "4em",//将列表写入文件时，此项控制挂件的高
}
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
}
let language = zh_CN;//当前使用的语言
let printerList = {
    "widget": allPrinter.HtmlAlinkPrinter,
    "url": allPrinter.MarkdownUrlUnorderListPrinter,
    "chain": allPrinter.MarkdownDChainUnorderListPrinter,
    "default": allPrinter.HtmlAlinkPrinter,//出错时恢复到
};//您可以在./listChildDocsClass.js中自定义输出格式Printer类，然后在此声明
export {custom_attr, token, language, setting, printerList};