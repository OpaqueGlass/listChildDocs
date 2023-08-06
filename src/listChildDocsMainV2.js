/**
 * listChildDocs main V2
 */
import { logPush, errorPush, warnPush, checkWorkEnvironment, commonPushCheck, WORK_ENVIRONMENT, isValidStr, debugPush } from "./common.js";
import { ConfigSaveManager, CONSTANTS_CONFIG_SAVE_MODE, ConfigViewManager } from "./ConfigManager.js";
import { getCurrentDocIdF, getCurrentWidgetId, isDarkMode } from "./API.js";


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
            // 解析路径参数？
            g_workEnvId = getCurrentDocIdF();
            if (!isValidStr(g_workEnvId)) {

            }
            g_configManager = new ConfigSaveManager(CONSTANTS_CONFIG_SAVE_MODE.PLUGIN, g_wordEnvId);
        }
    }
    // 载入设置项
    [g_allData, g_globalConfig] = await g_configManager.loadAll();
    logPush("allData", g_allData);
    logPush("globalConfig", g_globalConfig);
    
    g_configViewManager = new ConfigViewManager(g_configManager);
    // 绑定快捷键
    __shortcutBinder();

    
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

/**
 * 绑定快捷键
 * @param {*} bindFlag 为false则解绑快捷键
 */
function __shortcutBinder(bindFlag = true) {
    if (bindFlag) {
        document.addEventListener("keydown", shortcutActor);
    } else {
        document.removeEventListener("keydown", shortcutActor);
    }

    function shortcutActor(event) {
        debugPush("event", event);
        if (event.code == "KeyF" && event.ctrlKey == true) {
            event.stopPropagation();
            event.preventDefault();
            logPush("检索快捷键已被按下");
            // TODO: 检索
            // findDialog.show();
            return;
        }
        if (event.code == "F5") {
            event.stopPropagation();
            event.preventDefault();
            logPush("刷新快捷键已被按下");
            // TODO: 刷新
            return;
        }
        if (event.code == "KeyO" && event.ctrlKey == true) {
            event.stopPropagation();
            event.preventDefault();
            logPush("显示设置快捷键已被按下");
            _showSetting();
            return;
        }
    }
}

/**
 * 显示设置
 */
function _showSetting() {
    if ($("#innerSetting").css("display") == "none") {
        $("#innerSetting").css("display", "");
    } else {
        $("#innerSetting").css("display", "none");
    }
    // let display = showBtn ? "inline" : "none";
    // $("#innerSetting *, #modeSetting *").css("display", display);
    // if ((custom_attr.listDepth != 0 && !custom_attr.endDocOutline) && showBtn) {//层级不为0时不显示大纲层级
    //     $("#outlinedepth, #outlinedepthhint").css("display", "none");
    // }
    // if (myPrinter.write2file == 1) {//写入文档时重设挂件大小
    //     window.frameElement.style.height = showBtn ? setting.height_2file_setting : setting.height_2file;
    // }
}

let g_configManager = null;
let g_configViewManager = null;
let g_wordEnvMode = null;
let g_workEnvId = null;
let g_allData = null;
let g_globalConfig = null;
let g_myPrinter = null;

await __init__();