/**
 * listChildDocs main V2
 */
import { logPush, errorPush, warnPush, checkWorkEnvironment, commonPushCheck, WORK_ENVIRONMENT } from "./common.js";
import { ConfigSaveManager, CONSTANTS_CONFIG_SAVE_MODE } from "./ConfigManager.js";
import { getCurrentWidgetId, isDarkMode } from "./API.js";


/**
 * 初始化
 * 旧版迁移
 * 判断工作模式
 * 载入设置项
 * 判断明亮/黑夜模式
 */
async function __init__() {
    // 判断工作模式
    const workEnviroment = checkWorkEnvironment();
    switch (workEnviroment) {
        case WORK_ENVIRONMENT.WIDGET: {
            g_workEnvId = getCurrentWidgetId();
            g_configManager = new ConfigSaveManager(CONSTANTS_CONFIG_SAVE_MODE.WIDGET, g_workEnvId);
            break;
        }
    }
    // 载入设置项
    [g_allData, g_globalConfig] = await g_configManager.loadAll();
    logPush("allData", g_allData);
    logPush("globalConfig", g_globalConfig);
    // 更新明亮/黑夜模式



    
}

function __changeAppearance() {
    if (isDarkMode()) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
}

let g_configManager = null;
let g_wordEnvMode = null;
let g_workEnvId = null;
let g_allData = null;
let g_globalConfig = null;

await __init__();