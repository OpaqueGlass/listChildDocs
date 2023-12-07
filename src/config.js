/**
 * config.js
 * 挂件默认设置和全局配置。
 * 
 * 【如果修改后崩溃或运行不正常，请删除挂件重新下载，或更改前手动备份】
 * 请不要删除//双斜杠
 * 请不要删除//双斜杠注释前的英文逗号,（如果有）
 * 为true 或者 false的设置项，只能填这两者
 * 有英文双引号的设置项，只更改英文双引号内的内容，不要删除英文双引号。
 *  */

// dev warn: Main.js多处使用Object.assign浅拷贝对象！
let custom_attr = {//这里列出的是挂件的默认设置，只在创建时写入到挂件中，挂件内属性custom-list-child-docs可覆盖此设置
    printMode: "0",//默认格式和输出位置，参数见本文件最下方，或参考modeName（在本文件中搜索）
    childListId: "",//子文档列表块id，由挂件自动生成，对应的块将会被本挂件更新，请避免自行修改
    listDepth: 1,//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
    auto: true, //创建挂件、打开挂件时是否自动更新，如果您关闭了安全模式、使用同步且目录列表插入文档，请勿设定为true
    listColumn: 1,//子文档列表列数，过多的列数将导致显示问题
    outlineDepth: 3,//大纲列出层级数，混合列出时此项只控制大纲部分
    targetId: "", //统计对象id，统计的目标应当为文档块或笔记本
    endDocOutline: false, // 一并列出叶子文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
    // 如果需要默认隐藏刷新按钮，请删除下面一行前的双斜杠
    // hideRefreshBtn: true,
    sortBy: 256, //排序模式，具体取值请参考本文件最下方的DOC_SORT_TYPES，默认值15为跟随文档树排序
    maxListCount: 0,//控制每个文档的子文档显示数量
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
    // 显示搜索按钮
    showSearchBtn: true,

    // 安全模式【!建议开启，设定为true】：安全模式将禁止打开文档时自动刷新文档中的目录列表块
    // 可以避免此挂件自行刷新导致可能的同步覆盖问题。
    safeMode: false,
    // 安全模式PLUS【!可能因为思源版本更新而失效或导致bug，但部分情况下建议开启】
    // 避免在历史预览界面、编辑器只读时执行文档更改操作(目前允许挂件设置保存，请注意只读情况下设置保存的风险)
    // 【如果您使用自动插入助手，请启用此功能】
    safeModePlus: true,

    // 分列截断提示词（仅用于写入文档模式：url、引用块）
    divideIndentWord: "(续)",

    // 分列截断方式（仅用于写入文档模式：url、引用块
    // 为true: 多层级时，在缩进处截断，使每列行数相同，但层级>=2时体验不佳; 
    // 为false，按照第一层级分列，每列行数不等
    divideColumnAtIndent: false,

    // 为true启用挂件内浮窗（挂件beta模式）
    floatWindowEnable: true,

    // 使用玄学的超级块创建方式。如果出现问题，请设置为false（测试中）
    superBlockBeta: true,

    // 混合列出时区分提示词（启用叶子文档大纲时，该提示词将被加载大纲的前面）
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
    height_2widget_min: undefined,
    // 将列表在挂件内展示、且启用自动高度，此项控制挂件的最大高度（单位px），若不限制，请设为undefined
    height_2widget_max: undefined,

    // 【在插入挂件时表现不稳定，可能在第二次打开时设定、保存样式】挂件保存1次自身的显示样式，设置为undefined以禁用
    // issue #30 https://github.com/OpaqueGlass/listChildDocs/issues/30
    // 示例 "width: 2000px; height: 303px;"
    saveDefaultWidgetStyle: undefined,

    /*  挂件配置批量操作 
      issue #31 https://github.com/OpaqueGlass/listChildDocs/issues/31
    ！同步用户请注意：以下两个配置启用后挂件将在载入后更新挂件属性，未同步时可能导致同步覆盖
    */
    // 载入挂件后以配置文件为准重写独立设置
    overwriteIndependentSettings: false,
    // 载入挂件后移除独立设置
    removeIndependentSettings: false,
    // 重载/移除设置时一并删除文档中的原目录列表块；(如果重载为文档中模式，不会执行删除)
    deleteChildListBlockWhileReset: true,
    // 独立设置重载或移除白名单
    // 在这里列出的文档下的挂件，不会执行独立设置重载或移除
    // 示例["20220815001720-4xjvir0"]
    overwriteOrRemoveWhiteDocList: [],

    // 未完成功能 插入https:// 或 http:// 协议的emoji，
    webEmojiEnable: false,

    // 在目录列表第一个加入“../”（前往父文档）（仅挂件内目录），此设定项的类型为字符串，"true"（启用）"false"（禁用）"auto"（仅窄屏设备展示）
    backToParent: "auto",

    // 挂件内时，扩大点击响应范围为整行
    extendClickArea: true,

    // 适配挂件插入辅助（addChildDocLinkHelper.js）的属性检测模式，为所在文档插入属性（不建议一直开启，请开启此功能后几天关闭）
    // 默认情况下，无需打开此功能
    addChildDocLinkHelperEnable: false,

    // 首次创建目录块时插入的目录属性
    // 请注意，您写入的属性如果是自定义属性，应当以"custom-"开头，示例 "custom-type": "map"
    // 请不要写入"id"，"update"等块固有属性
    blockInitAttrs: {
        
    },

    // 在页签切换文档时自动刷新功能将在列出的操作系统上启用，不支持不显示页签的客户端
    // 若要禁用，值应当为[]；如要在windows启用，["windows"]；如要在多个操作系统上启用，示例：["linux", "windows"]
    includeOs: ["windows"],

    // 导图模式Markmap配置项，详见https://markmap.js.org/docs/json-options
    markmapConfig: {},
    // 导图模式：响应挂件大小变化
    markmapResizeHandlerEnable: true,

    // 按时间分组模式，显示日期的格式，yyyy将被替换为4位年，MM将被替换为两位数月份，dd将被替换为两位数日
    dateTemplate: "MM-dd",
    // 按时间分组模式，显示时间的格式，设置为""则不显示时间，HH将被替换为小时（24小时制），mm将被替换为分钟
    timeTemplate: "(HH:mm)",

    // 缓存只对挂件中显示的模式有效
    // 先载入缓存，再执行自动刷新
    loadCacheWhileAutoEnable: false,
    // 在自动刷新时也自动保存缓存（!同步用户请注意：多端同步未完成时保存缓存，可能导致同步覆盖）
    saveCacheWhileAutoEnable: false,

    // 右键重命名或删除操作
    deleteOrRenameEnable: true,

    // 使用Ctrl+F作为搜索快捷键（焦点在挂件内才生效）
    searchHotkeyEnable: false,

    // 悬停显示顶部按钮栏
    mouseoverButtonArea: false,
};
// 自动插入助手设置
// 自动插入助手和挂件本体共用setting.safeModePlus（只读安全模式检查设置项），如果您使用自动插入助手，请启用此功能。
let helperSettings = {
    // 文档中属性名称
    attrName: "custom-add-cdl-helper",
    // 模式为插入自定义时，插入的内容模板
    docLinkTemplate: "((%DOC_ID% '%DOC_NAME%'))",
    // 自动插入模式
    /* 【请只使用“插入挂件”模式。其他模式可能存在问题，请勿使用。】
    插入挂件 【插入挂件将不重复插入（通过属性或文档为空判断）】
    插入链接【可能有缺陷，不建议使用】
    插入引用块【可能有缺陷，不建议使用】
    插入自定义【可能有缺陷，不建议使用】 根据docLinkTemplate，插入自定义的内容
    */
    mode: "插入挂件",// 除非您了解这部分代码实现，请不要修改模式！Do not edit it unless you understand the codes. 
/* 通用 */
    // 插入在父文档结尾？若设置为undefined，则采用对应模式的默认设置
    insertAtEnd: undefined,
    // 在切换页签（而不是仅仅是打开）时也检查、执行自动插入
    switchTabEnable: false,

/* 仅插入挂件模式 */
    // 检查文档是否为空？设置为false，将通过文档的属性判断是否插入过。
    checkEmptyDocInsertWidget: true,
    // 选择触发时机：
        /*
        // "open": 开启空白的父文档时；
        // "create": 在空白父文档下创建子文档时（不建议修改为create，在这种实现方式下，将持续获取WebSocket通信并判断是否进行了创建文档操作）；
        */
    insertWidgetMoment: "open",
    // 要插入的挂件路径信息
    widgetPath: ["widgets/listChildDocs"],

/* 插入链接/引用块/自定义模式 */
    // 当发现子文档被删除，移除对应的子文档链接？若设置为undefined，则采用对应模式的默认设置
    removeLinkEnable: false,
    // 当发现子文档文件名变化时，重写对应的子文档链接？若设置为undefined，则采用对应模式的默认设置
    renameLinkEnable: false,   
}
//全局设置
let token = "";//API鉴权token，可以不填的样子（在设置-关于中查看）
let zh_CN = {
    refreshNeeded: "更新目录失败，找不到原有无序列表块，再次刷新将创建新块。",
    insertBlockFailed: "创建或更新无序列表块失败，请稍后刷新重试。",
    writeAttrFailed: "写入挂件属性失败，请稍后刷新重试。",
    getPathFailed: "查询当前文档所属路径失败，请稍后刷新重试。",
    noChildDoc: "似乎没有子文档@_@。",
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
    modeName10: "导图",
    modeName11: "预览方格",
    modeName12: "按日期分组",
    // 界面元素鼠标悬停提示词
    refreshBtn: "[单击] 刷新\n[双击] 保存设置",
    depthList: "子文档展示层级\n设置为0就可以只显示大纲啦​~\(≧▽≦)/~​​​",
    searchBtnTitle: "显示搜索对话框",
    modeList: "挂件工作模式",
    autoBtn: "自动刷新",
    autoNotWork: "\n由于启用了安全模式（safeMode），自动刷新对当前工作模式无效。",
    targetIdTitle: "目标文档id\n从这里指定的文档或笔记本开始列出子文档，\n设定为/则从所有已开启的笔记本开始",
    disabledBtnHint: "\n因为不支持当前模式，我被禁用了T^T",
    endDocOutlineTitle: "启用后，对于目录列表中没有子文档的，将显示大纲",
    hideRefreshBtnTitle: "将刷新按钮搬运到设置中，防止误触",
    outlineDepthTitle: "大纲层级\n大纲层级和h1、h2等无关，以大纲面板显示的层次为准。",
    sortByTitle: "控制文档的排序方式\n请在思源v2.8.7及以上版本使用，较早的版本可能无法排序",
    maxListCountTitle: "每个文档的子文档显示数量（设置为0则显示全部）\n不支持思源2.8.5以下版本",
    // 错误提示词
    getAttrFailedAtInit: "读取挂件属性失败。如果是刚创建挂件，请稍后刷新重试。",
    startRefresh: "开始更新子文档列表---来自listChildDocs挂件的通知",
    widgetRefLink: "挂件beta",
    saved: "设置项已保存",
    columnBtn: "子文档展示列数",
    settingBtn: "显示/隐藏设置",
    // 界面提示词
    columnHint: "分列",
    depthHint: "层级",
    noOutline: "似乎没有文档大纲@_@。",
    outlineDepthHint: "大纲层级",
    endDocOutlineHint: "叶子文档大纲",
    targetIdhint: "目标文档id",
    hideRefreshBtnHint: "隐藏刷新按钮",
    sortByHint: "排序方式",
    maxListCountHint: "子文档最大数量",
    autoRefreshHint: "自动刷新",
    working: "执行中……",
    loadingCache: "载入缓存中",
    cacheLoaded: "已载入缓存",
    loadCacheFailed: "未能载入文档列表缓存",
    wrongTargetId: "错误的目标id。目标id应为存在的文档块id、开启的笔记本id或/",
    readonly: "检测到只读模式，已停止对文档的更改操作。",
    saveDefaultStyleFailed: "保存默认挂件样式设定失败，如反复出现此问题，请禁用saveDefaultWidgetStyle。",
    refreshFinish: "刷新完成",
    refreshReject: "刷新被拒绝",
    refreshFailed: "刷新出错",
    // 自动插入助手提示
    helperAddBlockMemo: "自动插入的子文档链接块：在此块下的编辑将在文档变化时被覆盖",
    queryFilePathFailed: "获取文档路径失败，文档可能刚创建",
    helperErrorHint: "helper执行时发生错误，如果可以，请向开发者反馈：",
    // 模式内部提示12
    mode12_doc_num_text: "展示的文档数",
    mode12_update_hint: "按照更新时间排列",
    mode12_today: "（今天）",
    mode12_yesterday: "（昨天）",
    mode12_day_ago: "（%%天前）",
    mode12_week_day: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    // 模式内部提示13
    mode13_cannot_select_folder: "此模式只适用于桌面端（electron&notejs环境），当前无法选择目录。",
    mode13_select_folder: "指定本地目录",
    mode13_not_select_folder: "您似乎没有选择目录",
    mode13_show_what: "显示什么？",
    mode13_display_path_here: "[这里显示您选择的路径]",
    mode13_only_folder: "仅文件夹",
    mode13_only_file: "仅文件",
    mode13_show_all: "文件夹和文件",
    mode13_cannot_refresh: "此模式仅支持桌面端，移动端、Docker、浏览器环境无法更新。",
    mode13_not_select_folder_when_refresh: "您似乎没有选择目录。请在模式设置中指定本机目标路径。",
    mode13_trust_sysid: "信任当前系统",
    mode13_another_sys_warn: "<p>和您选择目录时操作系统不匹配，继续刷新可能出现异常，确认继续？</p><p>若选择信任当前系统，您需要在刷新完成后，手动双击刷新按钮保存。选择信任后，对于当前所选的目录刷新将不再询问，视为允许刷新。</p>",
    mode13_error_while_select_folder: "选文件夹时出现错误，请重选",
    // 对话框dialog
    dialog_canceled: "已取消",
    dialog_delete: "删除",
    dialog_delete_hint: "确定要删除所选文档“%%”吗？<br />请注意，如果有子文档，子文档也将被一并删除。",
    dialog_rename: "重命名",
    dialog_cancel: "取消",
    dialog_confirm: "确定",
    dialog_create_doc: "新建子文档",
    dialog_option: "已选择",
    dialog_search: "搜索",
    dialog_search_cancel: "清除高亮",
    dialog_search_panel: "搜索文档标题",
    dialog_search_nomatch: "无结果",
    doc_sort_type: {
        FILE_NAME_ASC: "名称字母升序",
        FILE_NAME_DESC: "名称字母降序",
        NAME_NAT_ASC: "名称自然升序",
        NAME_NAT_DESC: "名称自然降序",
        MODIFIED_TIME_ASC: "修改时间升序",
        MODIFIED_TIME_DESC: "修改时间降序",
        CREATED_TIME_ASC: "创建时间升序",
        CREATED_TIME_DESC: "创建时间降序",
        REF_COUNT_ASC: "引用次数升序",
        REF_COUNT_DESC: "引用次数降序",
        DOC_SIZE_ASC: "文档大小升序",
        DOC_SIZE_DESC: "文档大小降序",
        SUB_DOC_COUNT_ASC: "子文档数量升序",
        SUB_DOC_COUNT_DESC: "子文档数量降序",
        CUSTOM_SORT: "文档树自定义排序",
        UNASSIGNED: "跟随文档树排序",
    },
    // 弹层提示词
    removeDistinctSuccess: "成功删除%1%个挂件的独立设置。",
    removeDistinctFailed: "成功删除%1%个挂件的独立设置，失败%2%个。失败的挂件id分别是：%3%",
    removeOtherSuccess: "成功删除%1%个挂件",
    removeOtherFailed: "成功删除%1%个挂件，失败%2%个。失败的挂件id分别是：%3%",
    workResult: "结果",
    removeDistinctConfim: "确定要删除其他挂件的独立设置吗？<br/>请注意：1. 挂件在文档中插入的列表也将被一并删除；<br/>2. 受限于API查询数量限制，您可能需要多次执行此操作以确保完全删除。",
    removeOtherConfim: "确定要删除其他挂件吗？<br/>请注意：1. 挂件在文档中插入的列表不会被一并删除；<br/>2. 受限于API查询数量限制，您可能需要多次执行此操作以确保完全删除。",
    removeFileConfirm: "确定要删除不使用的配置文件吗？<br/>（如要删除所有配置文件，请前往工作空间/data/storage/listChildDocs手动删除）",
    removeFileSuccess: "成功删除%1%个配置文件。另有%2%个在使用中的配置文件未清理。",
    confirmTitle: "二次确认",
    configNameSet: "请输入配置名称",
    currentDoc: "当前文档",
    deletedSchema: "所选配置已删除",
    childDocsCreated: "已创建",
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
    modeName10: "markmap",
    modeName11: "preview box",
    modeName12: "group by date",
    // 界面元素鼠标悬停提示词 hangover popup words
    refreshBtn: "[Click] Refresh\n[Double click] Save Settings",
    searchBtnTitle: "Show search dialog",
    depthList: "The number of display levels for the child docs",
    modeList: "Output mode",
    autoBtn: "'Auto' Refresh",
    autoNotWork: "\nNot available for current output mode, because safe mode is enabled",
    targetIdTitle: "Target doc id\nAlso accept notebookid, '/' as target id.",
    disabledBtnHint: "\nDisabled by current mode.",
    endDocOutlineTitle: "For the documents that have no subdocuments, display their outline.",
    hideRefreshBtnTitle: "Move refresh button into settings.",
    outlineDepthTitle: "The number of display levels for the doc outine. ",
    sortByTitle: "child docs sort mode\n available in siyuan v2.8.7 and later",
    maxListCountTitle: "Maximum number of subdocuments to be displayed for each document. If set to 0, all documents are displayed. Versions earlier than siyuan v2.8.5 are not supported.",
    refreshFinish: "Refreshed. ",
    refreshReject: "Refresh was rejected. ",
    refreshFailed: "An error occurred. ",
    // 错误提示词error warn
    getAttrFailedAtInit: "Failed to read widget properties. If you just created the widget, please ignore this error and refresh again later.",
    startRefresh: "Updating child-doc-list ... --- list child docs widget",
    widgetRefLink: "Widget beta",
    saved: "Settings have been saved",
    // 界面控件提示词 Hint words
    columnBtn: "Number of columns",
    settingBtn: "Show/hide settings",
    columnHint: "Column",
    depthHint: "Level",
    noOutline: "There appears to be no doc-outline.",
    outlineDepthHint: "Outline level",
    endDocOutlineHint: "Leaf document outline",
    targetIdhint: "Target document id",
    hideRefreshBtnHint: "Hide refresh button",
    sortByHint: "Sort Mode",
    maxListCountHint: "Maximum of sub-docs",
    autoRefreshHint: "Auto refresh",
    // 
    working: "Running...",
    loadingCache: "Loading...",
    cacheLoaded: "Cache loaded.",
    loadCacheFailed: "Couldn't load doc-list cache.",
    wrongTargetId: "Wrong target doc id. The target id should be an existing document id, an open notebook id or /",
    readonly: "Work in read-only mode. Changes to the document are prohibited.",
    saveDefaultStyleFailed: "Failed to save default pendant style settings. If this problem occurs repeatedly, please disable saveDefaultWidgetStyle.",
    // addChildDocLinkHelper hint text
    helperAddBlockMemo: "Child-doc link block: the edits under this block will be overwritten when the child-docs changes.",
    queryFilePathFailed: "Failed to get the document path, the document may have just been created.",
    helperErrorHint: "An error occured during helper execution. If it's convenient for you, please give feedback to the developer.",
    // hint text in mode
    mode12_doc_num_text: "the num of doc",
    mode12_update_hint: "Order by update time",
    mode12_today: "(today)",
    mode12_yesterday: "(yesterday)",
    mode12_day_ago: "(%% days ago)",
    mode12_week_day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
    // 模式内部提示  tips in mode13 
    mode13_cannot_select_folder: " This mode is only applicable in desktop environments (electron & notejs), so you cannot select a directory at present.",
    mode13_select_folder: "Specify the local directory",
    mode13_show_what: "What should be included?",
    mode13_display_path_here: "[The path you selected should be displayed here",
    mode13_not_select_folder: "It seems you have not selected a directory.",
    mode13_only_folder: "Only folders",
    mode13_only_file: "Only files",
    mode13_show_all: "Folders and files",
    mode13_cannot_refresh: "This mode is only supported for desktop, so cannot be updated in mobile, Docker, or browser environments.",
    mode13_not_select_folder_when_refresh: "It seems you have not selected a directory. Please specify the local path in the mode settings.",
    mode13_trust_sysid: "Allow Refresh in Current System",
    mode13_another_sys_warn: "<p>The current operating system does not match the one you when selecting the directory, continuing to refresh may cause abnormalities. Do you want to continue? </p><p>If you choose 'Allow Refresh in Current System', you need to manually double-click the refresh button to save after the refresh is complete.</p>",
    mode13_error_while_select_folder: "An error occured during selecting folder, please try again",
    // dialog
    dialog_canceled: "Canceled",
    dialog_delete: "Delete",
    dialog_delete_hint: "Are you sure you want to delete the selected document \"%%\"?<br />Please note that if there are subdocuments, they will also be deleted.",
    dialog_rename: "Rename",
    dialog_cancel: "Cancel",
    dialog_confirm: "OK",
    dialog_create_doc: "Create_child_doc",
    dialog_option: "Selected",
    dialog_search: "Search",
    dialog_search_cancel: "Clear",
    dialog_search_panel: "Search by Doc Name",
    dialog_search_nomatch: "No match",
    doc_sort_type: {
        FILE_NAME_ASC: "Name Alphabet ASC",
        FILE_NAME_DESC: "Name Alphabet DESC",
        NAME_NAT_ASC: "Name Natural ASC",
        NAME_NAT_DESC: "Name Natural DESC",
        MODIFIED_TIME_ASC: "Modified Time ASC",
        MODIFIED_TIME_DESC: "Modified Time DESC",
        CREATED_TIME_ASC: "Created Time ASC",
        CREATED_TIME_DESC: "Created Time DESC",
        REF_COUNT_ASC: "Ref Count ASC",
        REF_COUNT_DESC: "Ref Count DESC",
        DOC_SIZE_ASC: "Document Size ASC",
        DOC_SIZE_DESC: "Document Size DESC",
        SUB_DOC_COUNT_ASC: "Sub-docs Count ASC",
        SUB_DOC_COUNT_DESC: "Sub-docs Count DESC",
        CUSTOM_SORT: "Custom Sorting in the File Tree",
        UNASSIGNED: "Follow the File Tree"
    },
    // 弹层提示词
    removeDistinctSuccess: "Successfully deleted inpendent settings for %1% widgets.",
    removeDistinctFailed: "Successfully removed inpendent settings for %1% widgets, failed %2%. Failed widget ids are: %3%",
    removeOtherSuccess: "Successfully deleted %1% widgets",
    removeOtherFailed: "Successfully deleted %1% widgets, failed %2%. Failed widget ids are: %3%",
    workResult: "Result",
    removeDistinctConfim: "Are you sure you want to delete the inpendent settings for other widgets? <br/>Notice that the list created by the widget will also be deleted.",
    removeOtherConfim: "Are you sure you want to delete other widgets? <br/>Notice that the list created by the widget will NOT be deleted.",
    removeFileConfirm: "Are you sure you want to delete unused config files? <br/>（If you want to delete all config files, please go to workspace/data/storage/listChildDocs to delete them manually）",
    removeFileSuccess: "Successfully deleted %1% profiles. Another %2% active profiles were not cleaned.",
    confirmTitle: "Secondary Confirmation",
    configNameSet: "Please enter the configuration name",
    currentDoc: "Current Doc",
    deletedSchema: "The selected schema has been deleted.",
    childDocsCreated: "Created"
};
let language = zh_CN; // 使用的语言 the language in use. Only zh_CN and en_US are available.
// ~~若思源设定非中文，则显示英文~~
let siyuanLanguage;
try{
    siyuanLanguage = window.top.siyuan.config.lang;
}catch (err){
    console.warn("读取语言信息失败");
}
if (siyuanLanguage != "zh_CN" && siyuanLanguage != undefined) {
    language = en_US;
}


// 导入外部config.js 测试功能，如果您不清楚，请避免修改此部分；

//注：下方的排序分类可能不会随着思源版本而及时更新
const SORT_TYPES = {
    FILE_NAME_ASC: {type: 0, name: "文件名升序", englishName: "Name Alphabet ASC"},
    FILE_NAME_DESC: {type: 1, name: "文件名降序", englishName: "Name Alphabet DESC"},
    NAME_NAT_ASC: {type: 4, name: "名称自然升序", englishName: "Name Natural ASC"},
    NAME_NAT_DESC: {type: 5, name: "名称自然降序", englishName: "Name Natural DESC"},
    MODIFIED_TIME_ASC: {type: 2, name: "修改时间升序", englishName: "Modified Time ASC"},
    MODIFIED_TIME_DESC: {type: 3, name: "修改时间降序", englishName: "Modified Time DESC"},
    CREATED_TIME_ASC: {type: 9, name: "创建时间升序", englishName: "Created Time ASC"},
    CREATED_TIME_DESC: {type: 10, name: "创建时间降序", englishName: "Created Time DESC"},
    REF_COUNT_ASC: {type: 7, name: "引用次数升序", englishName: "Ref Count ASC"},
    REF_COUNT_DESC: {type: 8, name: "引用次数降序", englishName: "Ref Count DESC"},
    DOC_SIZE_ASC: {type: 11, name: "文档大小升序", englishName: "Document Size ASC"},
    DOC_SIZE_DESC: {type: 12, name: "文档大小降序", englishName: "Document Size DESC"},
    SUB_DOC_COUNT_ASC: {type: 13, name: "子文档数量升序", englishName: "Sub-docs Count ASC"},
    SUB_DOC_COUNT_DESC: {type: 14, name: "子文档数量降序", englishName: "Sub-docs Count DESC"},
    CUSTOM_SORT: {type: 6, name: "自定义排序", englishName: "Custom Sorting in the File Tree"},
    FOLLOW_DOC_TREE: {type: 256, name: "跟随文档树排序", englishName: "Follow Doc Tree Sorting"},
};


export {custom_attr, token, language, setting, helperSettings};
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
10 导图
11 预览方格
12 按时间分组
*/