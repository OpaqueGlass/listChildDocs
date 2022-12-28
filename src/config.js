/**
 * config.js
 * 挂件默认设置和全局配置。
 * 
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
    endDocOutline: false, // 一并列出叶子文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
};
// 全局设置
let setting = {
    // 将列表写入文件时，此项控制挂件的宽
    width_2file: "20em",
    // 将列表写入文件时，此项控制挂件的高
    height_2file: "4em",
    // 将列表写入文件时，此项控制显示设置时挂件的高
    height_2file_setting: "9em",

    // 在挂件中显示自动刷新选项，设定true启用、false禁用【！自动刷新可能导致同步覆盖问题，详见README】
    showAutoBtn: true,
    // 在启动时显示所有设置项，设定true启用
    showSettingOnStartUp: false, 

    // 安全模式【!建议开启，设定为true】：安全模式将禁止打开文档时自动刷新文档中的目录列表块
    // 可以避免此挂件自行刷新导致可能的同步覆盖问题。
    safeMode: true,
    // 安全模式PLUS【!可能因为思源版本更新而失效或导致bug，但部分情况下建议开启】
    // 避免在历史预览界面、编辑器只读时执行文档更改操作(目前允许挂件设置保存，请注意只读情况下设置保存的风险)
    safeModePlus: false,

    // 分列截断提示词（仅用于写入文档模式：url、引用块）
    divideIndentWord: "(续)",

    // 分列截断方式（仅用于写入文档模式：url、引用块
    // 为true: 多层级时，在缩进处截断，使每列行数相同，但层级>=2时体验不佳; 
    // 为false，按照第一层级分列，每列行数不等
    divideColumnAtIndent: false,

    // 为true启用挂件内浮窗（挂件beta模式）
    floatWindowEnable: true,

    // 数组中的属性名将在更新目录列表块时一并写入无序列表对应的元素属性中，或许可以适配部分主题的无序列表转导图功能
    includeAttrName: ["custom-f"],

    // 使用玄学的超级块创建方式。如果出现问题，请设置为false（测试中）
    superBlockBeta: true,

    // 【已废弃】一并列出终端文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
    // v0.0.9及以下版本使用，现已停用，请使用custom_attr.endDocOutline和挂件内设置指定。
    // 若设定为true，将在挂件加载时迁移“启用叶子文档大纲”到挂件属性中保存，此设置项迁移将在下一版本移除。
    showEndDocOutline: false, 
    // 混合列出时区分提示词
    outlineDistinguishingWords: "@",

    // 刷新列表后重写属性
    inheritAttrs: true,

    // 为true则一并写入文档icon Emoji
    emojiEnable: true,
    // 文档使用自定义emoji时，写入自定义emoji图片
    customEmojiEnable: true,

    // 在模式“默认”“挂件beta”下，使得挂件高度跟随目录长度自动调整
    autoHeight: false,
    // 将列表在挂件内展示、且启用自动高度，此项控制挂件的最小高度（单位px），若不限制，请设为undefined
    height_2widget_min: 300,
    // 将列表在挂件内展示、且启用自动高度，此项控制挂件的最大高度（单位px），若不限制，请设为undefined
    height_2widget_max: undefined,

    // 未完成功能 插入https:// 或 http:// 协议的emoji，
    webEmojiEnable: false,

    // 在目录列表第一个加入“../”（前往父文档）（仅挂件内目录），此设定项的类型为字符串，"true"（启用）"false"（禁用）"auto"（仅窄屏设备展示）
    backToParent: "auto",

    // 挂件内时，扩大点击响应范围为整行
    extendClickArea: true,
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
    modifywarn: "此块由listChildDocs挂件创建，若刷新列表，您的更改将会被覆盖。", // 不想显示这个提示的话，改成空字符串""就行
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
    modeName9: "任务列表",
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
    endDocOutlineHint: "叶子文档大纲",
    targetIdhint: "目标文档id",
    working: "执行中……",
    wrongTargetId: "错误的目标id。目标id应为存在的文档块id、开启的笔记本id或/",
    readonly: "工作在只读模式，禁止对文档的更改操作。如要关闭此安全检查，请修改自定义设置safeModePlus为false。"
};
let en_US = {//先当他不存在 We don't fully support English yet.
    refreshNeeded: "Failed to refresh directory : couldn't find original directory list block. Click refresh button again to generate a new block. ",
    insertBlockFailed: "Failed to create or update the child-docs list block, please try again later. ",
    writeAttrFailed: "Failed to write widget properties, please try again later. ",
    getPathFailed: "Failed to get the path of current document, please try again later. ",
    noChildDoc: "There appears to be no child-docs.",
    error: "ERROR: ",
    updateTime: "Last update: ",
    modifywarn: "Created by listChildDocs widget. Your changes to this block will be overwritten when you click refresh button in the widget",
    getAttrFailed: "Failed to get widget properties.",
    wrongPrintMode: "Wrong output mode setting, default value restored, please refresh again.",
    // 模式提示词 Mode Name
    modeName0: "Default",
    modeName1: "Widget beta",
    modeName2: "siyuan url",
    modeName3: "ref block",
    modeName5: "1.1.Default",
    modeName4: "1.1.Widget",
    modeName6: "1.url",
    modeName7: "1.ref block",
    modeName8: "1.1.url",
    modeName9: "todo list",
    // 界面元素鼠标悬停提示词 hangover popup words
    refreshBtn: "Refresh",
    depthList: "Number of layers of child-docs display",
    modeList: "Output mode",
    autoBtn: "'Auto' Refresh",
    targetIdTitle: "Target doc id",
    // 错误提示词error warn
    getAttrFailedAtInit: "Failed to read widget properties. If you just created the widget, please ignore this error and refresh again later.",
    startRefresh: "Updating child-doc-list ... --- list child docs widget",
    widgetRefLink: "Widget beta",
    saved: "Settings have been saved",
    columnBtn: "Number of columns",
    settingBtn: "Show/hide settings",
    columnHint: "Column",
    depthHint: "Level",
    noOutline: "There appears to be no doc-outline.",
    outlineDepthHint: "Outline level",
    endDocOutlineHint: "Leaf document outline",
    targetIdhint: "Target document id",
    working: "Running...",
    wrongTargetId: "Wrong target doc id. The target id should be an existing document id, an open notebook id or /",
    readonly: "Work in read-only mode. Changes to the document are prohibited. To turn off this security check, please modify the custom setting 'safeModePlus' to false."
};
let language = zh_CN; // 使用的语言 the language in use. Only zh_CN and en_US are available.
// ~~若思源设定非中文，则显示英文~~
// let siyuanLanguage;
// try{
//     siyuanLanguage = window.top.siyuan.config.lang;
// }catch (err){
//     console.warn("读取语言信息失败");
// }
// if (siyuanLanguage != zh_CN && siyuanLanguage != undefined) {
//     language = en_US;
// }


// 导入外部config.js 测试功能，如果您不清楚，请避免修改此部分；
try {
    let allCustomConfig = await import('/widgets/custom.js');
    let customConfig = null;
    let customConfigName = "listChildDocs";
    if (allCustomConfig[customConfigName] != undefined) {
        customConfig = allCustomConfig[customConfigName];
    }else if (allCustomConfig.config != undefined && allCustomConfig.config[customConfigName] != undefined) {
        customConfig = allCustomConfig.config[customConfigName];
    }
    // 导入token
    if (allCustomConfig.token != undefined) {
        token = allCustomConfig.token;
    }else if (allCustomConfig.config != undefined && allCustomConfig.config.token != undefined) {
        token = allCustomConfig.config.token;
    }
    
    // 仅限于config.setting/config.defaultAttr下一级属性存在则替换，深层对象属性将完全覆盖
    if (customConfig != null) {
        if ("setting" in customConfig) {
            for (let key in customConfig.setting) {
                if (key in setting) {
                    setting[key] = customConfig.setting[key];
                }
            }
        }

        if ("custom_attr" in customConfig) {
            for (let key in customConfig.custom_attr) {
                if (key in custom_attr) {
                    custom_attr[key] = customConfig.custom_attr[key];
                }
            }
        }
        
    }
    
}catch (err) {
    console.warn("导入用户自定义设置时出现错误", err);
}


export {custom_attr, token, language, setting, includeOs};
/* printerMode参数
0 默认
1 挂件beta
2 url
3 引用块
4 1.1.挂件
5 1.1.默认
6 1.url
7 1.引用块
8 1.1.url
9 todo列表（任务列表）url
*/