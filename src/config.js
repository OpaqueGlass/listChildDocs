let custom_attr = {
    insert2file: 1,//为1将列表写入到文档，为0将列表写入挂件内
    childListId: "",//子文档列表块id，由挂件自动处理，避免更改
    listDepth: 2//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
};
let setting = {
    width_2file: "30em",//将列表写入文件时，此项控制挂件的宽
    height_2file: "4em"//将列表写入文件时，此项控制挂件的高
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
    insertBlockFailed: "创建或更新无序列表块失败。",
    writeAttrFailed: "写入挂件属性失败。",
    getPathFailed: "查询当前文档所属路径失败。",
    noChildDoc: "似乎没有子文档。",
    error: "错误：",
    updateTime: "更新时间：",
    modifywarn:　"此块由listChildDocs挂件创建，手动更改将不会保存",
    getAttrFailed: "读取挂件属性失败",
}
let language = zh_CN;//当前使用的语言
export {custom_attr, token, language, setting};