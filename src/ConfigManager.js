/**
 * 读取或保存配置
 */
import { getJSONFile, putJSONFile, addblockAttrAPI, getblockAttrAPI } from "./API.js";
import { isFileNameIllegal, logPush } from "./common.js";
/**
 * 负责配置文件的读取和写入
 */
export class ConfigSaveManager {
    saveMode = 0;
    // 数据保存路径，（自工作空间的相对路径）务必以/结尾；
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
        listColumn: 1,//子文档列表列数，过多的列数将导致显示问题
        outlineDepth: 3,//大纲列出层级数，混合列出时此项只控制大纲部分
        targetId: "", //统计对象id，统计的目标应当为文档块或笔记本
        endDocOutline: false, // 一并列出叶子文档的大纲？（目录中包括最深层级文档的大纲？）影响性能、反应极慢，建议禁用(设置为false)。（i.e.混合列出）
        // 如果需要默认隐藏刷新按钮，请删除下面一行前的双斜杠
        // hideRefreshBtn: true,
        sortBy: 256, //排序模式，具体取值请参考本文件最下方的DOC_SORT_TYPES，默认值15为跟随文档树排序
        maxListCount: 0,//控制每个文档的子文档显示数量
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
    defaultGlobalConfig ={
        allSaveToFile: false
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
        // 载入默认设置
        let userDefaultConfig = await this.loadUserConfigDefault();
        // 读取独立设置（和数据等）
        const distinctAll = await this.loadDistinct(userDefaultConfig);
        this.allData = distinctAll;
        // 非挂件模式将尝试读入url中的设置
        if (this.saveMode != CONSTANTS_CONFIG_SAVE_MODE.WIDGET && pathVariable != null) {
            [this.allData["config"], this.globalConfig] = this.loadFromPathVar(pathVariable);
        }
        // TODO: 判断是否需要使用schema
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
                return {};
            }
        } else {
            let response = await getblockAttrAPI(this.relateId);
            let allDataLocal = {};
            if (response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG]) {
                const configData = JSON.parse(response.data[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG].replace(new RegExp("&quot;", "g"), "\""));
                allDataLocal["config"] = Object.assign(userDefaultConfig, configData);
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
    // 保存全部设置
    async saveDistinct(inputData) {
        if (this.saveMode == CONSTANTS_CONFIG_SAVE_MODE.WIDGET && !this.globalConfig.allSaveToFile) {
            let attrData = {};
            if (inputData["config"]) {
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG] = JSON.stringify(inputData["config"]);
            }
            if (inputData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE]) {
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CACHE] = inputData["cacheHTML"];
            }
            if (inputData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_SAVED_DATA]) {
                attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_SAVED_DATA] = JSON.stringify(inputData["savedData"]);
            }
            logPush("saveDistinct", attrData);
            await addblockAttrAPI(attrData, this.relateId);
        } else {
            logPush("saveDistinct", inputData);
            await putJSONFile(this.dataSavePath, inputData);
        }
    }
    // 保存独立设置
    async saveDistinctConfig(distinctConfig) {
        if (this.saveMode == CONSTANTS_CONFIG_SAVE_MODE.WIDGET && !this.globalConfig.allSaveToFile) {
            let attrData = {};
            attrData[CONFIG_MANAGER_CONSTANTS.ATTR_NAME_CONFIG] = JSON.stringify(distinctConfig);
            logPush("saveDistinctConfig", attrData);
            await addblockAttrAPI(attrData, this.relateId);
        } else {
            let inputData = Object.assign({}, this.allData);
            inputData["config"] = distinctConfig;
            logPush("saveDistinctConfig", inputData);
            await putJSONFile(this.dataSavePath, inputData);
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
        const response = getJSONFile(filePathName);
        let temp = Object.assign({}, this.defaultConfig);
        if (!response) {
            return temp;
        }
        return Object.assign(temp, response);
    }
    // 保存用户设定的默认值【请仅传入config，不要传入cacheHTML等】
    async saveUserConfigDefault(configData) {
        if ("cacheHTML" in configData) {
            throw new Error("仅支持传入cofig作为默认配置");
        }
        const filePathName = this.saveDirPath + "schema/" + CONFIG_MANAGER_CONSTANTS.DEFAULT;
        putJSONFile(filePathName, configData);
    }
    // 全局设置
    async loadGlobalConfig() {
        const filePathName = this.saveDirPath + CONFIG_MANAGER_CONSTANTS.GLOBAL;
        const response = getJSONFile(filePathName);
        if (response == null) {
            return Object.assign({}, this.defaultGlobalConfig);
        } else {
            let temp = Object.assign({}, this.defaultGlobalConfig);
            return Object.assign(temp, response);
        }
    }
    async saveGlobalConfig(globalConfig) {
        const filePathName = this.saveDirPath + CONFIG_MANAGER_CONSTANTS.GLOBAL;
        return putJSONFile(filePathName, globalConfig);
    }
    // TODO: schema
    async loadSchema() {

    }
    async listSchema() {

    }
    /**
     * 保存为schema（设置模板）
     * @param {*} configData 
     * @param {*} schemaName 
     * @returns 
     */
    async saveAsSchema(configData, schemaName) {
        if (isFileNameIllegal(schemaName)) {
            throw new Error("Illegal File Name");
        }
        const filePathName = this.saveDirPath + "schema/" + schemaName + ".json";
        return await putJSONFile(filePathName, configData);
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
    getDistinctConfig() {
        return this.allData["config"];
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
    // elem 接管的element
    constructor(configSaveManager = null, elem = null) {
        this.configSaveManager = configSaveManager;
        this.settingElem = elem;
        // main中初始化绑定表单提交
        let form = layui.form;
        let layer = layui.layer;
        form.on("submit(save)", this.submitDistinctConfigData.bind(this));
        // TODO: 赋值，将设置项载入界面
        form.val("general-config", this.configSaveManager.getDistinctConfig());
    }

    // 重新载入设置项语言
    reloadLanguage() {
    }
    // 从设置项界面收集数据，转换为allData/Config格式
    submitDistinctConfigData(submitData) {
        console.log("saved", submitData);
        const distinctConfig = this.loadUISettings(submitData.field, submitData.form);
        // TODO: 保存设置项
        this.configSaveManager.saveDistinctConfig(distinctConfig);
        return false; // 阻止默认 form 跳转
    }
    // 转换数据
    loadUISettings(formData, formElement) {
        let data = formData;
        // 扫描标准元素 input[]
        let result = {};
        for(const key in data) {
            const value = data[key];
            result[key] = value;
            if (value === "on") {
                result[key] = true;
            }else if (value === "null" || value == "false") {
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
    
        logPush("UI SETTING", result);
        return result;
    }
    // 将独立设置载入至设置项界面
    async loadDistinctConfig(configData) {

    }

}
