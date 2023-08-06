/**
 * listChildDocs main V2
 */
import { logPush, errorPush, warnPush, checkWorkEnvironment, commonPushCheck, WORK_ENVIRONMENT } from "./common.js";
import { ConfigSaveManager, CONSTANTS_CONFIG_SAVE_MODE, ConfigViewManager } from "./ConfigManager.js";
import { getCurrentWidgetId, isDarkMode } from "./API.js";


/**
 * 初始化
 * 旧版迁移
 * 判断工作模式
 * 载入设置项
 * 判断明亮/黑夜模式
 */
async function __init__() {
    // 先做基础外观调整
    // 更新明亮/黑夜模式
    __changeAppearance();
    // 判断工作模式
    const workEnviroment = checkWorkEnvironment();
    switch (workEnviroment) {
        case WORK_ENVIRONMENT.WIDGET: {
            g_workEnvId = getCurrentWidgetId();
            g_configManager = new ConfigSaveManager(CONSTANTS_CONFIG_SAVE_MODE.WIDGET, g_workEnvId);
            break;
        }
        case WORK_ENVIRONMENT.PLUGIN: {

        }
    }
    // 载入设置项
    [g_allData, g_globalConfig] = await g_configManager.loadAll();
    logPush("allData", g_allData);
    logPush("globalConfig", g_globalConfig);
    
    g_configViewManager = new ConfigViewManager(g_configManager);


    
}

function __changeAppearance() {
    if (isDarkMode()) {
        document.body.classList.add("dark");
        document.getElementById('layui_theme_css').setAttribute('href','static/layui-v2.8.12/css/layui-dark-230803.css');
    } else {
        document.body.classList.remove("dark");
        document.getElementById('layui_theme_css').removeAttribute('href');
    }
}

let g_configManager = null;
let g_configViewManager = null;
let g_wordEnvMode = null;
let g_workEnvId = null;
let g_allData = null;
let g_globalConfig = null;

await __init__();