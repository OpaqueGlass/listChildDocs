/**
 * 【如果修改后崩溃或运行不正常，请删除挂件重新下载，或更改前手动备份】
 * 请不要删除//双斜杠注释
 * 请不要删除//双斜杠注释前的英文逗号,（如果有）
 * 为true 或者 false的设置项，只能填这两者
 * 有英文双引号的设置项，只更改英文双引号内的内容，不要删除英文双引号
 * 显示模式设置请在‘printerConfig.js’中完成。
 *  */

let custom_attr = {//这里列出的是挂件的默认设置，只在创建时写入到挂件中，挂件内属性custom-list-child-docs可覆盖此设置
    printMode: "0",//默认格式和输出位置，参数见本文件最下方，或参考modeName（在本文件中搜索）
    childListId: "",//子文档列表块id，由挂件自动生成，对应的块将会被本挂件更新，请避免自行修改
    listDepth: 1,//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
    auto: true, //创建挂件、打开挂件时是否自动更新，如果您关闭了安全模式、使用同步且目录列表插入文档，请勿设定为true
    listColumn: 1,//子文档列表列数，过多的列数将导致显示问题
    outlineDepth: 3,//大纲列出层级数，混合列出时此项只控制大纲部分
    targetId: "", //统计对象id，统计的目标应当为文档块或笔记本
};
// 全局设置
let setting = {
    // 将列表写入文件时，此项控制挂件的宽
    width_2file: "20em",
    // 将列表写入文件时，此项控制挂件的高
    height_2file: "4em",
    // 将列表写入文件时，此项控制显示设置时挂件的高
    height_2file_setting: "7em",
    // 在挂件中显示自动刷新选项，设定true启用、false禁用【！自动刷新可能导致同步覆盖问题，详见README】
    showAutoBtn: true,
    // 在启动时显示所有设置项，设定true启用
    showSettingOnStartUp: false, 
    // 安全模式【!建议开启，设定为true】：安全模式将禁止打开文档时自动刷新文档中的目录列表块
    // 可以避免此挂件自行刷新导致可能的同步覆盖问题。
    safeMode: true,
    // 分列截断提示词（仅用于写入文档模式：url、引用块）
    divideIndentWord: "(续)",
    // 分列截断方式（仅用于写入文档模式：url、引用块
    // 为true: 多层级时，在缩进处截断，使每列行数相同，但层级>=2时体验不佳; 
    // 为false，按照第一层级分列，每列行数不等
    divideColumnAtIndent: false,
    // 为true则一并写入文档icon Emoji
    emojiEnable: true,
    // 为true启用挂件内浮窗（挂件beta模式）
    floatWindowEnable: true,
    // 数组中的属性名将在更新目录列表块时一并写入无序列表对应的元素属性中，或许可以适配部分主题的无序列表转导图功能
    includeAttrName: ["custom-f"],
    // 使用玄学的超级块创建方式。如果出现问题，请设置为false（测试中）
    superBlockBeta: true,
    // 一并列出终端文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
    showEndDocOutline: false,
    // 刷新列表后重写属性
    inheritAttrs: true,
    // 文档使用自定义emoji时，写入自定义emoji图片
    customEmojiEnable: true,
    // 在模式“默认”“挂件beta”下，使得挂件高度跟随目录长度自动调整
    autoHeight: false,
    // 开发者选项 插入https:// 或 http:// 协议的emoji，未完成功能
    webEmojiEnable: false
};
//全局设置
let includeOs = ["windows"];//监视页签变化自动刷新功能将在列出的操作系统上启用
let token = "";//API鉴权token，可以不填的样子（在设置-关于中查看）
let zh_CN = {
    refreshNeeded: "更新目录失败，找不到原有无序列表块，再次刷新将创建新块。",
    insertBlockFailed: "创建或更新无序列表块失败，请稍后刷新重试。",
    writeAttrFailed: "写入挂件属性失败，请稍后刷新重试。",
    getPathFailed: "查询当前文档所属路径失败，请稍后刷新重试。",
    noChildDoc: "似乎没有子文档。",
    error: "错误：",
    updateTime: "更新时间：",
    modifywarn:　"此块由listChildDocs挂件创建，若刷新列表，您的更改将会被覆盖。",
    getAttrFailed: "读取挂件属性失败。",
    wrongPrintMode: "错误的输出模式设定，已恢复默认值，请刷新重试。",
    // 模式提示词
    modeName0: "默认",
    modeName1: "挂件beta",
    modeName2: "url",
    modeName3: "引用块",
    modeName5: "1.1.默认",
    modeName4: "1.1.挂件",
    modeName6: "1.url",
    modeName7: "1.引用块",
    modeName8: "1.1.url",
    // 界面元素鼠标悬停提示词
    refreshBtn: "刷新",
    depthList: "子文档展示层级",
    modeList: "展示方式",
    autoBtn: "'半'自动刷新",
    targetIdTitle: "目标文档id",
    // 错误提示词
    getAttrFailedAtInit: "读取挂件属性失败。如果是刚创建挂件，请稍后刷新重试。",
    startRefresh: "开始更新子文档列表---来自listChildDocs挂件的通知",
    widgetRefLink: "挂件beta",
    saved: "设置项已保存",
    columnBtn: "子文档展示列数",
    settingBtn: "显示/隐藏设置",
    columnHint: "分列",
    depthHint: "层级",
    noOutline: "似乎没有文档大纲。",
    outlineDepthHint: "大纲层级",
    working: "执行中……",
    wrongTargetId: "错误的目标id。目标id应为存在的文档块id、开启的笔记本id或/"
};
/*let en = {//先当他不存在
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
    startRefresh: "Refreshing child docs list. -- from listChildDocs widget",
    widgetRefLink: "in Widget beta"
};*/
let language = zh_CN;//当前使用的语言


export {custom_attr, token, language, setting, includeOs};
/* printerMode参数
0 默认
1 挂件beta
2 url
3 引用块
4 1.挂件
5 1.默认
6 1.url
7 1.引用块
8 1.2.url
*/