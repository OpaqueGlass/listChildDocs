/**
 * 读取或保存配置
 */
import { getJSONFile, putJSONFile, addblockAttrAPI, getblockAttrAPI, listFileAPI, removeFileAPI } from "./API.js";
import { debugPush, isFileNameIllegal, isValidStr, logPush } from "./common.js";
/**
 * 负责配置文件的读取和写入
 */
export class ConfigSaveManager {
    saveMode = 0;
    // 数据保存路径，（自工作空间的相对路径）务必以/结尾、以/开头；
    saveDirPath = "";
    dataSavePath = "";
    schemaSavePath = "";
    allData = {};
    globalConfig = {};
    // widgetId = "";
    // docId = "";
    // boxId = "";
    relateId = "";
    // 默认的挂件独立设置
    defaultConfig = {
        printMode: "0",//默认格式和输出位置，参数见本文件最下方，或参考modeName（在本文件中搜索）
        childListId: "",//子文档列表块id，由挂件自动生成，对应的块将会被本挂件更新，请避免自行修改
        listDepth: 1,//列出子文档的最大层级，仅支持数字，过多层级将导致性能或其他潜在问题
        auto: true, //创建挂件、打开挂件时是否自动更新，如果您关闭了安全模式、使用同步且目录列表插入文档，请勿设定为true
        listColumn: 0,//子文档列表列数，过多的列数将导致显示问题
        outlineDepth: 3,//大纲列出层级数，混合列出时此项只控制大纲部分
        targetId: "", //统计对象id，统计的目标应当为文档块或笔记本
        outlineStartAt: "h1",
        outlineEndAt: "h6",
        endDocOutline: false, // 一并列出叶子文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
        // 如果需要默认隐藏刷新按钮，请删除下面一行前的双斜杠
        // hideRefreshBtn: true,
        sortBy: 256, //排序模式，具体取值请参考本文件最下方的DOC_SORT_TYPES，默认值15为跟随文档树排序
        maxListCount: 0,//控制每个文档的子文档显示数量,
        floatWndEnable: false, // 浮窗
        customModeSettings: {}
    };
    // 存储文件时，结构
    defaultAllData = {
        // 本文件/本文件夹配置
        config: {

        },
        // 直接缓存的HTML
        cacheHTML: "",
        // 全局的文件排序
        globalFileSort: [],
        // 该文件保存的数据：包括排序、文件名、用户自定义层级，这里应当
        savedData: {}
    }
    defaultGlobalConfig = {
        // 即使是挂件模式,也将设置保存到文档
        allSaveToFile: false,
        // 将列表写入文件时，此项控制挂件的宽
        width_2file: "20em",
        // 将列表写入文件时，此项控制挂件的高
        height_2file: "3em",
        // 将列表写入文件时，此项控制显示设置时挂件的高
        height_2file_setting: "30em",
        width_2file_setting: "50em",

        // 在挂件中显示自动刷新选项，设定true启用、false禁用【！自动刷新可能导致同步覆盖问题，详见README】
        // showAutoBtn: true,
        // 在启动时显示所有设置项，设定true启用
        // showSettingOnStartUp: false, 
        // 显示搜索按钮
        showSearchBtn: true,

        // 安全模式【!建议开启，设定为true】：安全模式将禁止打开文档时自动刷新文档中的目录列表块
        // 可以避免此挂件自行刷新导致可能的同步覆盖问题。
        safeMode: true,
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
        // floatWindowEnable: true,

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
        // 将列表在挂件内展示、且启用自动高度，此项控制挂件的最小高度（单位px），若不限制，请设为空字符串
        height_2widget_min: "",
        // 将列表在挂件内展示、且启用自动高度，此项控制挂件的最大高度（单位px），若不限制，请设为空字符串
        height_2widget_max: "",

        // 【弃用】【在插入挂件时表现不稳定，可能在第二次打开时设定、保存样式】挂件保存1次自身的显示样式，设置为undefined以禁用
        // issue #30 https://github.com/OpaqueGlass/listChildDocs/issues/30
        // 示例 "width: 2000px; height: 303px;"
        // saveDefaultWidgetStyle: undefined,

        /*  挂件配置批量操作 【弃用】
        issue #31 https://github.com/OpaqueGlass/listChildDocs/issues/31
        ！同步用户请注意：以下两个配置启用后挂件将在载入后更新挂件属性，未同步时可能导致同步覆盖
        */
        // 载入挂件后以配置文件为准重写独立设置
        // overwriteIndependentSettings: false,
        // 载入挂件后移除独立设置
        // removeIndependentSettings: false,
        // 重载/移除设置时一并删除文档中的原目录列表块；(如果重载为文档中模式，不会执行删除)
        // deleteChildListBlockWhileReset: true,
        // 独立设置重载或移除白名单
        // 在这里列出的文档下的挂件，不会执行独立设置重载或移除
        // 示例["20220815001720-4xjvir0"]
        // overwriteOrRemoveWhiteDocList: [],

        // 未完成功能 插入https:// 或 http:// 协议的emoji，
        webEmojiEnable: false,

        // 在目录列表第一个加入“../”（前往父文档）（仅挂件内目录），此设定项的类型为字符串，"true"（启用）"false"（禁用）"auto"（仅窄屏设备展示）
        backToParent: "auto",

        // 挂件内时，扩大点击响应范围为整行
        extendClickArea: true,

        // 适配挂件插入辅助（addChildDocLinkHelper.js）的属性检测模式，为所在文档插入属性（不建议一直开启，请开启此功能后几天关闭）
        // 默认情况下，无需打开此功能
        // addChildDocLinkHelperEnable: false,

        // 首次创建目录块时插入的目录属性
        // 请注意，您写入的属性如果是自定义属性，应当以"custom-"开头，示例 "custom-type": "map"
        // 请不要写入"id"，"update"等块固有属性
        blockInitAttrs: "{}",

        // 【格式更改，弃用】在页签切换文档时自动刷新功能将在列出的操作系统上启用，不支持不显示页签的客户端
        // 若要禁用，值应当为[]；如要在windows启用，["windows"]；如要在多个操作系统上启用，示例：["linux", "windows"]
        // includeOs: ["windows"],

        // 导图模式Markmap配置项，详见https://markmap.js.org/docs/json-options
        markmapConfig: "{}",
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
        showBtnArea: "true",

        // 切换页签刷新
        switchBarAutoRefresh: true,
    };
    constructor(saveMode, relateId, saveDirPath = "/data/storage/listChildDocs/") {
        // 载入全局配置
        this.saveMode = saveMode;
        this.relateId = relateId;
        this.saveDirPath = saveDirPath;
        this.dataSavePath = this.getDataJSONFilePath(relateId);
    }
    async loadAll(pathVariable = null) {
        // 载入全局设置
        this.globalConfig = await this.loadGlobalConfig();
        debugPush("loadAll载入的全局设置", this.globalConfig);
        // 载入默认设置
        let userDefaultConfig = await this.loadUserConfigDefault();
        logPush("userDefaultConfig", userDefaultConfig);
        // 读取独立设置（和数据等）
        const distinctAll = await this.loadDistinct(userDefaultConfig);
        logPush("distinctAll", userDefaultConfig);
        this.allData = distinctAll;
        // 非挂件模式将尝试读入url中的设置
        if (this.saveMode != CONSTANTS_CONFIG_SAVE_MODE.WIDGET && pathVariable != null) {
            [this.allData["config"], this.globalConfig] = this.loadFromPathVar(pathVariable);
        }
        // ~~判断是否需要使用schema~~ Schema使用一次导入的方案，这里不做处理
        return [this.allData, this.globalConfig];
    }
    // 从url中读取设置
    loadFromPathVar(pathVariable) {
        let tempDistinct = Object.assign({}, this.allData["config"]);
        let tempGlobal = Object.assign({}, this.globalConfig);
        if (pathVariable == null) {
            return [tempDistinct, tempGlobal];
        }
        
        for (let key in tempDistinct) {
            if (key in pathVariable) {
                tempDistinct[key] = pathVariable[key];
            }
        }
        for (let key in tempGlobal) {
            if (key in pathVariable) {
                tempGlobal[key] = pathVariable[key];
            }
        }
        return [tempDistinct, tempGlobal];
    }
    // 读取独立设置（包括缓存等数据），如果制定了userDefaultConfig，则会执行设置合并
    async loadDistinct(userDefaultConfig = null) {
        if (this.saveMode != CONSTANTS_CONFIG_SAVE_MODE.WIDGET || this.globalConfig.allSaveToFile) {
            let response = await getJSONFile(this.getDataJSONFilePath(this.relateId));
            if (response) {
                if (userDefaultConfig != null) {
                    let dictinctConfig = response["config"];
                    if (dictinctConfig == null) {
                        dictinctConfig = {};
                    }
                    Object.assign(userDefaultConfig, dictinctConfig);
                    response["config"] = userDefaultConfig;
                }
                return response;
            } else {
                return {"config": userDefaultConfig};
            }
        } else {
            let response = await getblockAttrAPI(this.relateId);
            let allDataLocal = {};
            if (response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG]) {
                const configData = JSON.parse(response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG].replace(new RegExp("&quot;", "g"), "\""));
                debugPush("直接获取到的属性结果", configData);
                allDataLocal["config"] = Object.assign(userDefaultConfig, configData);
            } else {
                allDataLocal["config"] = userDefaultConfig;
            }
            if (response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE]) {
                const cache = response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE];
                allDataLocal["cacheHTML"] = cache;
            }
            if (response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_SAVED_DATA]) {
                const savedData = JSON.parse(response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_SAVED_DATA].replace(new RegExp("&quot;", "g"), "\""));
                allDataLocal["savedData"] = savedData;
            }
            return allDataLocal;
        }
    }
    // WARN: 请注意，通过这里读入的更新设置，必须在此方法内同步到this.allData / this.globalConfig，否则下次读入将出现问题
    // 保存全部设置
    async saveDistinct(inputData) {
        debugPush("Manager保存Distinct", inputData);
        if (this.saveMode == CONSTANTS_CONFIG_SAVE_MODE.WIDGET && !this.globalConfig.allSaveToFile) {
            let attrData = {};
            if (inputData["config"]) {
                inputData["config"] = this.filterNonConfigData(inputData["config"]);
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG] = JSON.stringify(inputData["config"]);
            }
            if (inputData["cacheHTML"]) {
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE] = inputData["cacheHTML"];
            }
            if (inputData["savedData"]) {
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_SAVED_DATA] = JSON.stringify(inputData["savedData"]);
            }
            this.allData = inputData;
            logPush("saveDistinct", attrData);
            await addblockAttrAPI(attrData, this.relateId);
        } else {
            inputData["config"] = this.filterNonConfigData(inputData["config"]);
            this.allData = inputData;
            logPush("saveDistinct", inputData);
            await putJSONFile(this.dataSavePath, inputData);
        }
    }
    // 保存独立设置
    async saveDistinctConfig(distinctConfig) {
        debugPush("Manager保存DistinctConfig", distinctConfig);
        distinctConfig = this.filterNonConfigData(distinctConfig);
        this.allData["config"] = distinctConfig;
        if (this.saveMode == CONSTANTS_CONFIG_SAVE_MODE.WIDGET && !this.globalConfig.allSaveToFile) {
            let attrData = {};
            attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG] = JSON.stringify(distinctConfig);
            logPush("saveDistinctConfig-过滤后", attrData);
            await addblockAttrAPI(attrData, this.relateId);
        } else {
            let inputData = Object.assign({}, this.allData);
            inputData["config"] = distinctConfig;
            logPush("saveDistinctConfig-过滤后", inputData);
            await putJSONFile(this.dataSavePath, inputData);
        }
    }
    async saveCache(cache) {
        debugPush("Manager保存缓存", cache);
        if (this.saveMode == CONSTANTS_CONFIG_SAVE_MODE.WIDGET && !this.globalConfig.allSaveToFile) {
            let attrData = {};
            attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE] = cache;
            this.allData["cacheHTML"] = cache;
            logPush("saveCache", attrData);
            await addblockAttrAPI(attrData, this.relateId);
        } else {
            this.allData["cacheHTML"] = cache;;
            logPush("saveCache", cache);
            await putJSONFile(this.dataSavePath, this.allData);
        }
    }
    async readSavedData() {
        
    }
    async writeSavedData() {

    }
    // 这里比较特殊，需要判定文件在不在等信息，保存前需要读取，且不能覆盖写入
    // 不指定时，获取widget/doc对应的排序
    async readGlobalFileSort(id) {
        
    }
    async writeGlabalFileSort(id, sortData) {
        
    }
    // 载入用户设定config的默认值（挂件创建时默认值）
    async loadUserConfigDefault() {
        const filePathName = this.saveDirPath + "schema/" + CONFIG_MANAGER_CONSTANTS.DEFAULT;
        const response = await getJSONFile(filePathName);
        let temp = Object.assign({}, this.defaultConfig);
        // 防止其他情况可能引入保存了childListId的情况
        // QA：之前为什么没有保存？——使用的是表单内容直接保存的，表单中不涉及childListId，因而没有保存
        if (response) {
            delete response["childListId"];
        }
        if (!response) {
            // TODO: 尝试载入旧设置项
            try {
                let allCustomConfig = await import('/widgets/custom.js');
                let [globalSetting, defaultDistinct] = this.loadCustomSetting(allCustomConfig["config"]);
                await this.saveUserConfigDefault(defaultDistinct);
                return Object.assign(temp, defaultDistinct);
            } catch (err) {
                logPush("载入旧设置项失败", err);
            }
            return temp;
        }
        return Object.assign(temp, response);
    }
    // 保存用户设定的默认值【请仅传入config，不要传入cacheHTML等】
    async saveUserConfigDefault(configData) {
        debugPush("Manager保存用户默认设置", configData);
        if ("cacheHTML" in configData) {
            throw new Error("仅支持传入cofig作为默认配置");
        }
        const filePathName = this.saveDirPath + "schema/" + CONFIG_MANAGER_CONSTANTS.DEFAULT;
        for (let key in configData) {
            if (this.defaultConfig[key] == undefined) {
                delete configData[key];
            }
        }
        putJSONFile(filePathName, Object.assign(Object.assign({}, this.defaultConfig), configData));
    }
    // 全局设置
    async loadGlobalConfig() {
        const filePathName = this.saveDirPath + CONFIG_MANAGER_CONSTANTS.GLOBAL;
        const response = await getJSONFile(filePathName);
        if (response == null) {
            // TODO: 尝试载入旧设置项
            try {
                let allCustomConfig = await import('/widgets/custom.js');
                let [globalSetting, defaultDistinct] = this.loadCustomSetting(allCustomConfig["config"]);
                await this.saveGlobalConfig(globalSetting);
                return Object.assign(Object.assign({}, this.defaultGlobalConfig), globalSetting);
            } catch (err) {
                logPush("载入旧设置项失败", err);
            }
            // END: 
            return Object.assign({}, this.defaultGlobalConfig);
        } else {
            if (response.height_2widget_max) {
                response.height_2widget_max = parseInt(response.height_2widget_max);
            }
            if (response.height_2widget_min) {
                response.height_2widget_min = parseInt(response.height_2widget_min);
            }
            let temp = Object.assign({}, this.defaultGlobalConfig);
            return Object.assign(temp, response);
        }
    }
    async saveGlobalConfig(globalConfig) {
        const filePathName = this.saveDirPath + CONFIG_MANAGER_CONSTANTS.GLOBAL;
        debugPush("Manager保存全局设置", globalConfig);
        for (let key in globalConfig) {
            if (this.defaultGlobalConfig[key] == undefined) {
                delete globalConfig[key];
            }
        }
        // 通过拷贝保留没有在设置页面显示的设置项
        return putJSONFile(filePathName, Object.assign(this.globalConfig, globalConfig), true);
    }
    // TODO: schema
    async applySchema(schemaName) {
        const filePathName = this.saveDirPath + "schema/" + schemaName + ".json";
        const response = await getJSONFile(filePathName);
        let temp = Object.assign({}, this.defaultConfig);
        if (response) {
            Object.assign(temp, response);
        }
        await this.saveDistinctConfig(temp);
        debugPush("已经将内容载入");
    }
    async listSchema() {
        const pathPrefix = this.saveDirPath + "schema/";
        const listResult = await listFileAPI(pathPrefix);
        let result = [];
        for (let oneListRes of listResult) {
            if (oneListRes.name.endsWith(".json")) {
                result.push({
                    name: oneListRes.name.replace(".json", ""),
                    path: pathPrefix + oneListRes.name
                });
            }
        }
        return result;
    }
    async removeSchema(schemaName) {
        const path = this.saveDirPath + "schema/" + schemaName + ".json";
        await removeFileAPI(path);
    }
    /**
     * 保存为schema（设置模板）
     * @param {*} distinctConfigData 
     * @param {*} schemaName 
     * @returns 
     */
    async saveAsSchema(distinctConfigData, schemaName) {
        // FIXME: 移除设置项中的`childListId`
        if (isFileNameIllegal(schemaName)) {
            throw new Error("Illegal File Name");
        }
        const filePathName = this.saveDirPath + "schema/" + schemaName + ".json";
        return await putJSONFile(filePathName, distinctConfigData);
    }
    /**
     * 生成文件存储路径
     * @param {*} id 
     * @param {*} isData 
     * @param {*} schemaName 
     * @returns 
     */
    getDataJSONFilePath(id, isData = true, schemaName = "default") {
        let filePathName = this.saveDirPath;
        if (isData) {
            filePathName += "data/";
        } else {
            filePathName += "schema/" + schemaName + ".json";
            return filePathName;
        }
        filePathName += id;
        switch (this.saveMode) {
            case CONSTANTS_CONFIG_SAVE_MODE.SINGLE: {
                filePathName += "S";
                break;
            }
            case CONSTANTS_CONFIG_SAVE_MODE.WIDGET: {
                filePathName += "W";
                break;
            }
            case CONSTANTS_CONFIG_SAVE_MODE.PLUGIN: {
                filePathName += "D";
                break;
            }
        }
        filePathName += ".json";
        return filePathName;
    }
    setDistinctConfig(distinctConfig) {
        Object.assign(this.allData["config"], distinctConfig);
    }
    setGlobalConfig(globalConfig) {
        Object.assign(this.globalConfig, globalConfig);
    }
    getDistinctConfig() {
        return this.allData["config"];
    }
    getAllData() {
        return this.allData;
    }
    getGlobalConfig() {
        return this.globalConfig;
    }
    // 迁移设置使用的解析旧custom
    loadCustomSetting(allCustomConfig) {
        let customConfig = null;
        let customConfigName = "listChildDocs";
        let setting = {}, custom_attr = {};
        if (allCustomConfig[customConfigName] != undefined) {
            customConfig = allCustomConfig[customConfigName];
        }else if (allCustomConfig.config != undefined && allCustomConfig.config[customConfigName] != undefined) {
            customConfig = allCustomConfig.config[customConfigName];
        }
        let token;
        // 导入token
        if (allCustomConfig["token"] != undefined) {
            token = allCustomConfig["token"];
        }else if (allCustomConfig["config"] != undefined && allCustomConfig["config"]["token"] != undefined) {
            token = allCustomConfig.config["token"];
        }
        
        // 仅限于config.setting/config.defaultAttr下一级属性存在则替换，深层对象属性将完全覆盖
        if (customConfig != null) {
            if ("setting" in customConfig) {
                for (let key in customConfig.setting) {
                    if (key in this.defaultGlobalConfig) {
                        setting[key] = customConfig.setting[key];
                        // initAttr格式变更
                        switch (key){
                            case "blockInitAttrs": {
                                if (setting["blockInitAttrs"]) {
                                    setting["blockInitAttrs"] = JSON.stringify(setting["blockInitAttrs"]);
                                }
                                break;
                            }
                            case "markmapConfig": {
                                if (setting["markmapConfig"]) {
                                    setting["markmapConfig"] = JSON.stringify(setting["markmapConfig"]);
                                }
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                    }
                }
            }
            // dev： 引入每一个，每一行都要改
            if ("custom_attr" in customConfig) { //改1处
                for (let key in customConfig.custom_attr) {//改1处
                    if (key in this.defaultConfig) {//改1处
                        custom_attr[key] = customConfig.custom_attr[key];//改2处
                    }
                }
            }
        }
        debugPush("载入用户旧设置成功", setting, custom_attr);
        return [setting, custom_attr];
    }
     // 过滤非独立设置的项目
    filterNonConfigData(input) {
        if (!input) return {};
        let output = {};
        for (let key in input) {//改1处
            if (key in this.defaultConfig) {//改1处
                output[key] = input[key];//改2处
            }
        }
        return output;
    }
    // 过滤非全局设置的项目
    filterNonGlobalData(input) {
        if (!input) return {};
        let output = {};
        for (let key in input) {//改1处
            if (key in this.defaultGlobalConfig) {//改1处
                output[key] = input[key];//改2处
            }
        }
        return output;
    }
}


export const CONSTANTS_CONFIG_SAVE_MODE = {
    "SINGLE": 0, // 无思源上下文环境， window.top.siyuan等无法访问（用户指定运行实例id，然后设置项保存到S{指定的id}.json）
    "PLUGIN": 1, // 有思源上下文环境，无挂件上下文环境（设置项保存到文件D{文档id}.json）
    "WIDGET": 2, // 有思源上下文环境，有挂件上下文环境（设置项保存到挂件属性，允许保存为文件W{挂件id}.json）
}

const CONFIG_MANAGER_CONSTANTS = {
    "DEFAULT": "default.json",
    "GLOBAL": "global.json",
    "ATTR_NAME_CACHE": "custom-lcd-cache",
    "ATTR_NAME_CONFIG": "custom-list-child-docs",
    "ATTR_NAME_SAVED_DATA": "",
}

/* 设置项HTML显示元素，表单控制和收集 */

export class ConfigViewManager {
    settingElem = null;
    configSaveManager = null;
    refreshCallBack = null;
    // elem 接管的element
    constructor(configSaveManager, refreshCallBack, elem = null) {
        this.configSaveManager = configSaveManager;
        this.refreshCallBack = refreshCallBack;
        this.settingElem = elem;
        // main中初始化绑定表单提交
        let form = layui.form;
        let layer = layui.layer;
        // TODO: 赋值，将设置项载入界面
        form.val("general-config", this.configSaveManager.getDistinctConfig());
        form.val("global-config", this.configSaveManager.getGlobalConfig());
        debugPush("view获取到的全局设置", this.configSaveManager.getGlobalConfig());
        // 提示组
        $("[lay-tips]").on("mouseover", function(othis){
            // logPush("lay-tips", this, othis);
            layer.tips(this.getAttribute("lay-tips"), this, {time: 0});
        });
        $("[lay-tips]").on("mouseout", function(){layui.layer.closeAll();});
        // // 普通事件
        // layui.util.on('lay-tips', {
        //     // 悬停显示提示
        //     "info": function(othis){
        //         console.log(othis);
        //         layer.tips(othis.context.getAttribute("lay-tips-content"), othis)
        //         }
        // }, "click");
    }
    setSettingsToUI(distinct, global = null) {
        let form = layui.form;
        this.configSaveManager.setDistinctConfig(distinct);
        form.val("general-config", this.configSaveManager.getDistinctConfig());
        if (global) {
            this.configSaveManager.setGlobalConfig(distinct);
            form.val("global-config", this.configSaveManager.getGlobalConfig());
        }
    }
    // 重新载入设置项语言
    reloadLanguage() {
    }
    // 从设置项界面收集数据，转换为allData/Config格式
    submitDistinctConfigData(submitData) {
        const distinctConfig = this.loadUISettings(submitData.form, submitData.field);
        // 保存设置项
        this.configSaveManager.saveDistinctConfig(distinctConfig);
        this.refreshCallBack();
        return false; // 阻止默认 form 跳转
    }
    submitDefaultConfigData(submitData) {
        const distinctConfig = this.loadUISettings(submitData.form, submitData.field);
        // 保存设置项
        this.configSaveManager.saveUserConfigDefault(distinctConfig);
        this.refreshCallBack();
        return false; // 阻止默认 form 跳转
    }
    // 转换数据
    loadUISettings(formElement, formData, filter = null) {
        let data = formData;
        // if (data == null) {
        //     // FIXME: formData获取失败
        //     data = new FormData(formElement);
        //     debugPush("getFromFormElem", new FormData(formElement));
        // }
        debugPush("loadUISettings", data, formElement);
        // 扫描标准元素 input[]
        let result = {};
        for(const key in data) {
            const value = data[key];
            result[key] = value;
            if (value === "on") {
                result[key] = true;
            }else if (value === "null") {
                // TODO: 这里为什么对false充值为空字符串？
                result[key] = "";
            }
        }
        let checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
        for (let i = 0; i < checkboxes.length; i++) {
            let checkbox = checkboxes[i];
            // console.log(checkbox, checkbox.name, data[checkbox.name], checkbox.name);
            if (result[checkbox.name] == undefined) {
                result[checkbox.name] = false;
            }
        }
    
        let numbers = formElement.querySelectorAll("input[type='number']");
        // console.log(numbers);
        for (let number of numbers) {
            result[number.name] = parseFloat(number.value);
        }
        // if (filter != null && filter.length > 0) {
        //     for(let key in result){
        //         if (filter.indexOf(key) == -1) {
        //             delete result[key];
        //         }
        //     }
        // }
        logPush("UI SETTING", result);
        return result;
    }
    // 将独立设置载入至设置项界面
    async loadDistinctConfig(configData) {

    }

}
