/**
 * listChildDocsClass.js
 * 用于生成子文档目录文本的Printer。
 */
import { language} from './config.js';
import { getUpdateString, generateBlockId, isValidStr, transfromAttrToIAL, isInvalidValue, logPush, errorPush, debugPush } from "./common.js";
import { openRefLink } from './ref-util.js';
import { getCurrentDocIdF, getDoc, getDocPreview, getKramdown, getSubDocsAPI, postRequest, queryAPI, isDarkMode } from './API.js';
//建议：如果不打算更改listChildDocsMain.js，自定义的Printer最好继承自Printer类
//警告：doc参数输入目前也输入outline对象，请注意访问范围应当为doc和outline共有属性，例如doc.id doc.name属性
//
//其他情况请做判断
class Printer {
    //写入到文件or写入到挂件
    //0写入到挂件（以HTML格式），1写入到当前文档（以Markdown格式）
    static id = -1;
    id = -1;
    write2file = 1;
    globalConfig = null;

    setGlobalConfig(config) {
        this.globalConfig = Object.assign({}, config);
    }
    /**
     * 输出对齐、缩进文本
     * 它在输出当前文档链接之前调用
     * @param {*} nowDepth 当前文档所在层级，层级号从1开始
     * @returns 
     */
    align(nowDepth) { return ""; }
    /**
     * 输出子文档列表格式文本
     * 在下一层级子文档列出之前被调用
     * @param {*} nowDepth 
     * @returns 
     */
    beforeChildDocs(nowDepth) { return ""; }
    /**
     * 在下一层级子文档列出之后被调用
     * @param {*} nowDepth 
     * @returns
     * */
    afterChildDocs(nowDepth) { return ""; }
    /**输出当前文档链接
     * @param {doc} doc为listDocsByPath伪API输出格式
     * 兼容性警告，目前这个参数也输入大纲对象，大纲对象情况较为复杂，
     * 请只读取doc.id doc.name属性，否则请另外判断属性是否存在、是否合法
     * */
    oneDocLink(doc, rowCountStack) { return ""; }
    /**
     * 在所有输出文本写入之前被调用
     * @returns
     * */
    beforeAll() { return ""; }
    /**
     * 在所有输出文本写入之后被调用
     * @returns 
     */
    afterAll() { return ""; }
    /**
     * 如果不存在子文档，将输出错误提示，错误提示可能需要包装以便展示
     * @params {*} emptyText 无子文档时错误信息文本
     * @returns
     */
    noneString(emptyText) { return emptyText; }

    /**
     * 分栏操作
     * 如果不需要实现，请直接返回初始值
     * (挂件内分栏通过css实现，请直接返回初始值)
     * （只在 将块写入文档的默认实现中调用此函数，如果模式自行doUpdate，则Main.js不调用）
     * @params {string} originalText 初始值
     * @params {int} nColumns 列数
     * @params {int} nDepth 文档列出层级/深度
     * @returns 分栏后的初始值
     */
    splitColumns(originalText, nColumns, nDepth, blockAttrData) { return originalText; }
    /**
     * （如果必要）模式自行生成待插入的内容块文本
     * （挂件内为html，文档内为markdown(勿在结尾加ial)）
     * @param {*} updateAttr 基本信息参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return [返回值1，返回值2] 返回值1： 非空字符串【若返回undefined、null、""，将由__main()执行内容文本的生成。；返回值2：文档（行号计数）如果自行生成，记录的行数用于自动分列
     */
    async doGenerate(updateAttr) {
        return [undefined, undefined];
    }
    /**
     * （如果必要）模式自行处理内容块写入（更新）操作
     * @param {*} textString 待写入的内容
     * @param {*} updateAttr 基本参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return 1: 由模式自行处理写入；0: 由挂件统一执行写入和更新；-1：模式拒绝刷新；-2：遇到错误；
     * 不应在此方法中执行耗时的子文档获取操作，此方法仅用于将textString写入到文档中或挂件中
     */
    async doUpdate(textString, updateAttr) {
        return 0;
    }
    /**
     * 对于文档中列表块的方式，这里返回需要作为列表块（分列时为外层超级块）的块属性
     * （只在 将块写入文档的默认实现中调用此函数，如果模式自行doUpdate，则Main.js不调用）
     * @return
     */
    getAttributes() {
        return null;
    }
    /**
     * 模式初始化操作
     * @return 
     */
    init(custom_attr) {
        $("button[lay-on='tabToModeSetting']").addClass("layui-btn-disabled");
        // 通过修改custom_attr并返回修改后的值实现强制指定某个设置项，建议只在禁止用户更改时强制指定设置项的值
        return custom_attr;
    }
    /**
     * 模式退出时操作
     */
    destory(custom_attr) {
        $("button[lay-on='tabToModeSetting']").removeClass("layui-btn-disabled");
        // 取消常规设置的禁用样式
        $("#listDepth, #listColumn, #targetId, #endDocOutline").prop("disabled", "");
        // 如果部分通用设定过于不合理，通过修改custom_attr并返回修改后的以重置。
        return custom_attr;
    }
    /**
     * 载入配置
     * 注意，可能不存在相应设置
     */
    load(savedAttrs) {

    }
    /**
     * 保存配置
     * @return 请返回一个对象
     */
    save() {
        return undefined;
    }
}
/**
 * 【旧版默认】默认模式：在挂件中插入超链接<a>
 */
// class OldDefaultPrinter extends Printer {
//     static id = 0;
//     write2file = 0;
//     beforeChildDocs(nowDepth) {
//         return "<ul>";
//     }
//     afterChildDocs(nowDepth) {
//         return "</ul>";
//     }
//     oneDocLink(doc, rowCountStack) {
//         let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
//         return `<li class="linksListItem"><a class='childDocLinks' href="siyuan://blocks/${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</a></li>`;
//     }
//     //在所有输出文本写入之前
//     beforeAll() {
//         return `<ul class="linksList" id="linksList">`;
//     }
//     //在所有输出文本写入之后
//     afterAll() {
//         return `</ul>`;
//     }
// }

/**
 * 新版默认
 */
 class DefaultPrinter extends Printer {
    static id = 0;
    id = 0;
    write2file = 0;
    beforeChildDocs(nowDepth) {
        return `<ul>`;
    }
    afterChildDocs(nowDepth) {
        return `</ul>`;
    }
    oneDocLink(doc, rowCountStack) {
        let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(doc.icon, doc.subFileCount != 0) : "";
        return `<li class="linksListItem" data-id="${doc.id}"><span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
    //在所有输出文本写入之前
    beforeAll() {
        return `<div id="refContainer"> <ul class="linksList" id="linksList">`;
    }
    //在所有输出文本写入之后
    afterAll() {
        return `</ul></div>`;
    }
 }
/**
 * 挂件beta 挂件内创建<span class="reflinks"> 无序列表
 */
class HtmlReflinkPrinter extends Printer {
    static id = 1;
    id = 1;
    write2file = 0;
    beforeChildDocs(nowDepth) {
        return `<ul>`;
    }
    afterChildDocs(nowDepth) {
        return `</ul>`;
    }
    oneDocLink(doc, rowCountStack) {
        let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(doc.icon, doc.subFileCount != 0) : "";
        return `<li class="linksListItem" data-id="${doc.id}"><span class="refLinks childDocLinks floatWindow" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
    //在所有输出文本写入之前
    beforeAll() {
        return `<div id="refContainer"> <ul class="linksList" id="linksList">`;
    }
    //在所有输出文本写入之后
    afterAll() {
        return `</ul></div>`;
    }
}

/**
 * url 文档中插入siyuan:// 无序列表
 */
class MarkdownUrlUnorderListPrinter extends Printer {
    static id = 2;
    id = 2;
    write2file = 1;
    align(nowDepth) {
        let spaces = "";
        spaces += "  ".repeat(nowDepth - 1);
        return spaces;
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        docName = htmlTransferParser(docName);
        docName = markdownUrlNameFilter(docName);
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `* ${emoji}${docName}\n`;
        }
        return `* ${emoji}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
    noneString(emptyText) {
        return "* " + emptyText;
    }
    splitColumns(originalText, nColumns, nDepth, blockAttrData) {
        return generateSuperBlock(originalText, nColumns, nDepth, blockAttrData, this.globalConfig);
    }
}
/**
 * 引用块 文档中插入((id引用块)) 无序列表
 */
class MarkdownDChainUnorderListPrinter extends Printer {
    static id = 3;
    id = 3;
    write2file = 1;
    //对齐、缩进
    align(nowDepth) {
        let spaces = "";
        for (let i = 0; i < (nowDepth - 1); i++) {
            spaces += "  ";
        }
        return spaces;
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `* ${emoji}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* ${emoji}((${doc.id} '${markdownRefBlockDocNameEncoder(docName)}'))\n`;
    }
    noneString(emptyText) {
        return "* " + emptyText;
    }
    splitColumns(originalText, nColumns, nDepth, blockAttrData) {
        return generateSuperBlock(originalText, nColumns, nDepth, blockAttrData, this.globalConfig);
    }
}

/**
 * 【旧版默认】1.默认 挂件内<a>有序列表
 */
// class HtmlAlinkOrderPrinter extends HtmlAlinkPrinter {
//     static id = 5;
//     id = 5;
//     beforeChildDocs(nowDepth) {
//         return `<ol class="noListStyle">`;
//     }
//     afterChildDocs(nowDepth) {
//         return "</ol>";
//     }
//     beforeAll() {
//         return `<ol class="linksList noListStyle" id="linksList">`;
//     }
//     afterAll() {
//         return `</ol>`;
//     }
//     oneDocLink(doc, rowCountStack) {
//         let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
//         let spaces = "";
//         for (let i = 0; i < (rowCountStack.length - 1); i++) {
//             spaces += "　　";
//         }
//         let countStr = "";
//         for (let num of rowCountStack) {
//             countStr += num + ".";
//         }
//         return `<li class="linksListItem">${spaces}<span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${countStr} ${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
//     }
// }

/**
 * 1.1. 挂件beta，挂件内beta 层级1.1.有序列表
 */
class HtmlReflinkOrderPrinter extends HtmlReflinkPrinter {
    static id = 4;
    id = 4;
    beforeChildDocs(nowDepth) {
        return `<ol class="noListStyle">`;
    }
    afterChildDocs(nowDepth) {
        return `</ol>`;
    }
    beforeAll() {
        return `<div id="refContainer"> <ol class="linksList noListStyle" id="linksList">`;
    }
    afterAll() {
        return `</ol></div>`;
    }
    oneDocLink(doc, rowCountStack) {
        // 生成空格
        let spaces = "";
        for (let i = 0; i < (rowCountStack.length - 1); i++) {
            spaces += "　　";
        }
        // 生成序号
        let countStr = "";
        for (let num of rowCountStack) {
            countStr += num + ".";
        }
        let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(doc.icon, doc.subFileCount != 0) : "";
        return `<li class="linksListItem" data-id="${doc.id}">　${spaces}　${countStr}<span class="refLinks floatWindow childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
}

/**
 * 1.1 默认
 */
 class HtmlDefaultOrderPrinter extends HtmlReflinkPrinter {
    static id = 5;
    id = 5;
    beforeChildDocs(nowDepth) {
        return `<ol class="noListStyle">`;
    }
    afterChildDocs(nowDepth) {
        return `</ol>`;
    }
    beforeAll() {
        return `<div id="refContainer"> <ol class="linksList noListStyle" id="linksList">`;
    }
    afterAll() {
        return `</ol></div>`;
    }
    oneDocLink(doc, rowCountStack) {
        // 生成空格
        let spaces = "";
        for (let i = 0; i < (rowCountStack.length - 1); i++) {
            spaces += "　　";
        }
        // 生成序号
        let countStr = "";
        for (let num of rowCountStack) {
            countStr += num + ".";
        }
        let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(doc.icon, doc.subFileCount != 0) : "";
        return `<li class="linksListItem" data-id="${doc.id}">　${spaces}　${countStr}<span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
}
/**
 * 1. url 文档中创建siyuan://有序列表（Markdown有序列表）
 */
class MarkdownUrlOrderListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 6;
    id = 6;
    align(nowDepth) {
        let spaces = "";
        // 请注意：有序列表缩进为4个空格
        spaces += "    ".repeat(nowDepth - 1);
        return spaces;
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        docName = htmlTransferParser(docName);
        docName = markdownUrlNameFilter(docName);
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `${rowCountStack[rowCountStack.length - 1]}. ${emoji}${docName}\n`;
        }
        return `${rowCountStack[rowCountStack.length - 1]}. ${emoji}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
}
/**
 * 1.引用块 文档内有序列表引用块
 */
class MarkdownDChainOrderListPrinter extends MarkdownDChainUnorderListPrinter {
    static id = 7;
    id = 7;
    align(nowDepth) {
        let spaces = "";
        spaces += "    ".repeat(nowDepth - 1);
        return spaces;
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `${rowCountStack[rowCountStack.length - 1]}. ${emoji}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `${rowCountStack[rowCountStack.length - 1]}. ${emoji}((${doc.id} '${markdownRefBlockDocNameEncoder(docName)}'))\n`;
    }
}
/**
 * 1.1.url 以1.1.的有序列表样式列出
 */
class MarkdownUrlStandardOrderListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 8;
    id = 8;
    align(nowDepth) {
        let spaces = "";
        spaces += "    ".repeat(nowDepth - 1);
        return spaces;
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        docName = htmlTransferParser(docName);
        docName = markdownUrlNameFilter(docName);
        let countStr = "";
        for (let num of rowCountStack) {
            countStr += num + ".";
        }
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `* ${countStr}　${emoji}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* ${countStr}　${emoji}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
    getAttributes() {
        return {
            "custom-list-format": "standard-ol-on-ul"
        };
    }
}

/**
 * todo url 文档中TODO列表
 */
class MarkdownTodoListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 9;
    id = 9;
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        docName = htmlTransferParser(docName);
        docName = markdownUrlNameFilter(docName);
        let emoji = "";
        if (this.globalConfig.emojiEnable) {
            emoji = getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0);
        }
        if (!isValidStr(doc.id)) {
            return `* [ ] ${emoji}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* [ ] ${emoji}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
}

/**
 * 挂件内导图 MarkMap
 */
class MarkmapPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 10;
    id = 10;
    write2file = 0;
    observer = new ResizeObserver(this.resizeHandler.bind(this));
    root;
    observerTimeout;
    widgetAttr;
    contentRectCache = {"width": 10, "height": 10};
    modeSettings = {
        "allowZoom": false,
        "allowPan": false
    };
    init(custom_attr) {
        custom_attr.listColumn = 1;
        $("#listColumn").prop("disabled", "true");
        $("#linksContainer").css("column-count", "");

        $("#modeSetting").append(`<span id="mode10_allow_pan_hint">${"允许平移Allow Pan"}</span>
        <input type="checkbox" name="mode10_allow_pan"  id="mode10_allow_pan">
        <span id="mode10_allow_zoom_hint">${"允许缩放Allow zoom"}</span>
        <input type="checkbox" name="mode10_allow_zoom"  id="mode10_allow_zoom">`);
        return custom_attr;
    }
    load(modeSettings) {
        if (modeSettings == undefined) return;
        logPush("LOAD SETTINGS")
        $("#mode10_allow_zoom").prop("checked", modeSettings["allowZoom"]);
        $("#mode10_allow_pan").prop("checked", modeSettings["allowPan"]);
    }
    save() {
        return {
            "allowZoom": $("#mode10_allow_zoom").prop("checked"),
            "allowPan": $("#mode10_allow_pan").prop("checked"),
        }
    }
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        if (!isValidStr(doc.id)) {
            return `* ${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* [${docName}](siyuan://blocks/${doc.id})\n`;
    }
    destory() {
        $("#listColumn").prop("disabled", "");
        this.observer.disconnect();
    }
    async doUpdate(textString, updateAttr) {
        this.observer.disconnect();
        let widgetAttr = updateAttr.widgetSetting;
        // 匹配移除返回父文档
        textString = textString.replace(new RegExp("\\* \\[../\\][^\\n]*\\n"), "");
        let tabHeaderElem = window.top.document.querySelector(`li[data-type="tab-header"].item.item--focus .item__text`);
        let docName = tabHeaderElem ? tabHeaderElem.innerText : undefined;
        let docNameQuery;
        if (!isValidStr(docName) || isValidStr(widgetAttr["targetId"])) {
            let queryId = isValidStr(widgetAttr["targetId"]) ? widgetAttr["targetId"] : updateAttr.docId;
            docNameQuery = await queryAPI(`SELECT * FROM blocks WHERE id = "${queryId}"`);
            if (isValidStr(docNameQuery) && docNameQuery.length > 0) {
                docName = docNameQuery[0].content;
            }else{
                docName = undefined;
            }
        }
        // 获取首个层级标题
        let regex = /^\* .*/gm;
        let firstBullets = textString.match(regex);
        // 如果最高标题层级无法判断或最高层级标题有多个，那么添加文档标题
        if (firstBullets == null || firstBullets.length > 1) {
            // 这里处理多种来源的文档名
            if (isValidStr(docName) && !isValidStr(widgetAttr["targetId"])) {
                textString = `# ${docName}\n` + textString;
            }else if (isValidStr(docName) && docNameQuery[0].type == "d"){
                textString = `# [${docName}](siyuan://blocks/${docNameQuery[0].id})\n` + textString;
            }else if (isValidStr(updateAttr.targetDocName)) {
                textString = `# ${updateAttr.targetDocName}\n` + textString;
            }
        }
        // textString = `# ${window.top.document.querySelector(`li[data-type="tab-header"].item.item--focus .item__text`).innerText}\n` + textString;
        document.getElementById("linksContainer").insertAdjacentHTML("beforeend", `<svg id="markmap" style="width: 100%; display: none;"></svg>`);
        
        let transformer = new window.markmap.Transformer();
        let { root, features } = transformer.transform(textString);
        // 保存用于Resize调用
        this.root = root;
        this.widgetAttr = widgetAttr;
        const { styles, scripts } = transformer.getUsedAssets(features);
        if (styles) window.markmap.loadCSS(styles);
        if (scripts) window.markmap.loadJS(scripts, { getMarkmap: () => markmap });
        const markmapConfig = this.loadMarkmap(root, widgetAttr);
        if (this.globalConfig.markmapResizeHandlerEnable && !markmapConfig.zoom && !markmapConfig.pan) {
            this.observer.observe(window.frameElement.parentElement);
        }
        return 1;
    }
    loadMarkmap(root, widgetAttr) {
        let markmapElem = document.getElementById("markmap");
        markmapElem.innerHTML = "";
        markmapElem.style.height = "";
        markmapElem.style.display = "";
        // logPush($(window.frameElement).outerHeight(), $("body").outerHeight());
        markmapElem.style.height = ($(window.frameElement).outerHeight() - $("body").outerHeight() + 125) + "px";
        // 计算层最大宽度
        let markmapConfig = {
            duration: 0, 
            zoom: $("#mode10_allow_zoom").prop("checked"), 
            pan: $("#mode10_allow_pan").prop("checked"), 
            maxWidth: 0};
        if (widgetAttr.listDepth != undefined) {
            if (widgetAttr.listDepth == 0 || widgetAttr.endDocOutline) {
                markmapConfig.maxWidth = $(window.frameElement).innerWidth() / (widgetAttr.listDepth + widgetAttr.outlineDepth);
            }else{
                markmapConfig.maxWidth = $(window.frameElement).innerWidth() / (widgetAttr.listDepth);
            }
        }
        // logPush("导图模式限制层宽", markmapConfig.maxWidth);
        try {
            Object.assign(markmapConfig, JSON.parse(this.globalConfig.markmapConfig));
        } catch(err) {
            errorPush("markmap全局配置导入失败", err);
        }
        window.markmap.Markmap.create('#markmap', markmapConfig, root);
        $("#markmap a").on("click",(event)=>{
            event.preventDefault();
            event.stopPropagation();
            let url = event.target.getAttribute("href");
            let id = url.match(new RegExp(`siyuan:\\/\\/blocks\\/.*`));
            id = id[0].substring("siyuan://blocks/".length);
            event.target.setAttribute("data-id", id);
            openRefLink(event);
        });
        // $("#markmap a").mousedown((event)=>{
        //     if (event.buttons = 2) {
        //         // event.preventDefault();
        //         // event.stopPropagation();
        //         let url = event.currentTarget.getAttribute("href");
        //         let id = url.match(new RegExp(`siyuan:\\/\\/blocks\\/.*`));
        //         id = id[0].substring("siyuan://blocks/".length);
        //         event.target.setAttribute("data-id", id);
        //         logPush("in rcll")
        //         // this.deleteOrRename(event.currentTarget, event.ctrlKey);
        //     }else{
        //         event.preventDefault();
        //         event.stopPropagation();
        //         let url = event.target.getAttribute("href");
        //         let id = url.match(new RegExp(`siyuan:\\/\\/blocks\\/.*`));
        //         id = id[0].substring("siyuan://blocks/".length);
        //         event.target.setAttribute("data-id", id);
        //         openRefLink(event);
        //     }
            
        // });
        $("#markmap a").addClass("markmap_a handle_rename_menu needSearch");
        return markmapConfig;
    }
    resizeHandler(entries) {
        clearTimeout(this.observerTimeout);
        // 页签切换导致frameElement 宽高变为0，因此即使没有调整挂件大小，也会触发重载，这里解决此问题
        let curWidth = entries[0].contentRect.width;
        let curHeight = entries[0].contentRect.height;
        if ((curWidth != this.contentRectCache.width || curHeight != this.contentRectCache.height) &&
          (curWidth != 0)) {
            this.observerTimeout = setTimeout(this.loadMarkmap.bind(this, this.root, this.widgetAttr), 300);
            this.contentRectCache.width = curWidth;
            this.contentRectCache.height = curHeight;
        }
    }
}

/**
 * 挂件内：子文档内容预览
 */
class ContentBlockPrinter extends Printer {
    static id = 11;
    id = 11;
    write2file = 0;
    init(custom_attr) {
        custom_attr.listDepth = 1;
        custom_attr.listColumn = 1;
        custom_attr.endDocOutline = false;
        $("#listDepth, #listColumn, #endDocOutline").prop("disabled", "true");
        $("#linksContainer").css("column-count", "");
        $("button[lay-on='tabToModeSetting']").addClass("layui-btn-disabled");
        return custom_attr;
    }
    destory() {
        $("#listDepth, #listColumn, #endDocOutline").prop("disabled", "");
        $("button[lay-on='tabToModeSetting']").removeClass("layui-btn-disabled");
       super.destory();
    }
    async doGenerate(updateAttr) {
        let result = `<div class="mode11-box">`;
        // 获取子文档列表
        let directChildDocs = await getSubDocsAPI(updateAttr["targetNotebook"], updateAttr["targetDocPath"], updateAttr["widgetSetting"]["maxListCount"], updateAttr["widgetSetting"]["sortBy"]);
        // 获取子文档内容
        for (let oneChildDoc of directChildDocs) {
            let docName = oneChildDoc.name;
            if (docName.indexOf(".sy") >= 0) {
                docName = docName.substring(0, docName.length - 3);
            }
            let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(oneChildDoc.icon, oneChildDoc.subFileCount != 0) : "";
            result += `<div class="mode11-note-box handle-ref-click"  data-id="${oneChildDoc.id}">`;
            result += `<h4 class="mode11-title needSearch">${emojiStr} ${docName}</h5>`;
            let [previewText, removeSpace] = await this.generatePreview(oneChildDoc.id);

            if (!isValidStr(removeSpace)) {
                result += await this.generateSecond(updateAttr["targetNotebook"], oneChildDoc.path, updateAttr["widgetSetting"]["maxListCount"], updateAttr["widgetSetting"]["sortBy"]);
            }else{
                result += `<div class="mode11-doc-content">${previewText}</div>`;
            }
            result += `</div>`;
        }
        // 生成
        return [result, undefined];
    }
    async doUpdate(textString, updateAttr) {
        if (updateAttr.widgetSetting.targetId == "/" | updateAttr.widgetSetting.targetId == "\\") {
            logPush("aa");
            $("#linksContainer").html(`<p>我不支持目标文档id设置为/，请重新设置一个目标文档id</p>
            <p>The current mode does not support listing from all opened notebooks, so you may not set <code>Target doc id</code> as <code>/</code></p>.`);
            return 1;
        } 
        return 0;
    }
    /**
     * 生成次级文档目录
     * @param {*} notebook 笔记本boxid 
     * @param {*} docPath 文档路径
     * @returns 
     */
    async generateSecond(notebook, docPath, maxListCount, sortBy) {
        let result = `<div class="mode11-child-p-container">`;
        let childDocResponse = await getSubDocsAPI(notebook, docPath, maxListCount, sortBy);
        for (let oneChildDoc of childDocResponse) {
            let docName = oneChildDoc.name;
            if (oneChildDoc.name.indexOf(".sy") >= 0) {
                docName = docName.substring(0, docName.length - 3);
            }
            let emojiStr = this.globalConfig.emojiEnable ? getEmojiHtmlStr(oneChildDoc.icon, oneChildDoc.subFileCount != 0) : "";
            result += `<p class="linksListItem needSearch" data-id="${oneChildDoc.id}"><span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${oneChildDoc.id}">${emojiStr}${docName}</span></p>`;
        }
        result += `</div>`;
        return result;
    }
    /**
     * 生成预览
     * @param {*} docid 
     * @returns 
     */
    async generatePreview(docid) {
        const previewHtml = await getDocPreview(docid);
        let TRIM_THRESHOLD = 20000;
        let trimedHtml = previewHtml;
        if (previewHtml.length > TRIM_THRESHOLD) {
            let temp = previewHtml.substring(TRIM_THRESHOLD);
            let crIndex = temp.search("</p>");
            if (crIndex != -1) {
                trimedHtml = previewHtml.substring(0, TRIM_THRESHOLD + crIndex + 1);
                logPush("预览内容过长，强制截断了预览内容");
            }
        }
        let cleanedHtml = this.cleanDocHtml(trimedHtml);
        let removeSpacedHtml = cleanedHtml.replace(new RegExp("&zwj;|&zwnj;|&thinsp;|&emsp;|&ensp;|&nbsp;", "g"), "");
        removeSpacedHtml = removeSpacedHtml.replace(new RegExp("<p[^>]*>[\u200d]*<\\/p>", "g"), "");
        removeSpacedHtml = removeSpacedHtml.replace(new RegExp(" |\\n", "g"), "");
        return [cleanedHtml, removeSpacedHtml];
    }
    /**
     * 清理kramdown数据
     * @param {*} text 
     * @returns 
     */
    cleanKramdown(text) {
        let threshold = 5000;
        // 超长文本截断
        if (text.length > threshold) {
            let temp = text.substring(threshold);
            let crIndex = temp.search("\n");
            if (crIndex != -1) {
                text = text.substring(0, threshold + crIndex);
            }
        }
        // 清理ial和换行、空格
        let parentDocPlainText = text;
        // 清理ial中的对象信息（例：文档块中的scroll字段），防止后面匹配ial出现遗漏
        parentDocPlainText = parentDocPlainText.replace(new RegExp('\\"{[^\n]*}\\"', "gm"), "\"\"");
        // 清理ial
        parentDocPlainText = parentDocPlainText.replace(new RegExp('{:[^}]*}\\n*', "gm"), "");
        // logPush("清理ial后", parentDocPlainText);
        // 清理换行（空行并为单行，多个空行除外）
        parentDocPlainText = parentDocPlainText.replace(new RegExp('\\n *\\n', "gm"), "\n");
        // 清理iframe
        parentDocPlainText = parentDocPlainText.replace(new RegExp(`<iframe.*</iframe>`, "gm"), "");
        // console.warn("DEBUG单次清理结果", parentDocPlainText);
        return parentDocPlainText;
    }
    cleanDocHtml(text) {
        // text = text.replace(new RegExp('<img src="assets', "g"), '<img src="/assets');
        let jqElem = $("<div>"+text+"</div>");
        jqElem.find(".iframe").remove();
        if (window.top.siyuan.config.export.addTitle) {
            if (jqElem.find("h1").get(0)) {
                jqElem.find("h1").get(0).remove();
            }
        }
        jqElem.find(".emoji").addClass("iconpic");
        jqElem.find("p").each((index, elem)=>{
            if ($(elem).html() == "" || $(elem).html() == String.fromCharCode(0x200d)) {
                jqElem.find(elem).remove();
            }
        });
        jqElem.find("img").each((index, elem)=>{
            let path = $(elem).prop("src");
            path = path.replace(new RegExp("http(s)*:\\/\\/[^\\/]*\\/widgets\\/listChildDocs(-dev)*"), "");
            jqElem.find(elem).prop("src", path);
        });
        return jqElem.html();
    }
}

/**
 * 按时间排序
 */
class OrderByTimePrinter extends Printer {
    static id = 12;
    id = 12;
    write2file = 0;
    modeSettings = {};
    beforeChildDocs(nowDepth) {
        return `<ul>`;
    }
    afterChildDocs(nowDepth) {
        return `</ul>`;
    }
    oneDocLink(doc, rowCountStack) {
        let emojiStr = "";//getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
        let formatedTime = this.globalConfig.timeTemplate;
        formatedTime = formatedTime.replace(new RegExp("HH", "g"), doc.time.substring(0, 2));
        formatedTime = formatedTime.replace(new RegExp("mm", "g"), doc.time.substring(2, 4));
        return `<li class="linksListItem" data-id="${doc.id}" title="${doc.hpath}"><span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name}</span>　${formatedTime}</li>`;
    }
    startOneDate(dateStr) {
        let formatedStr = this.globalConfig.dateTemplate;
        formatedStr = formatedStr.replace(new RegExp("yyyy", "g"), dateStr.substring(0, 4));
        formatedStr = formatedStr.replace(new RegExp("MM", "g"), dateStr.substring(4, 6));
        formatedStr = formatedStr.replace(new RegExp("dd", "g"), dateStr.substring(6, 8));
        let today = dayjs().startOf('day');
        let docDate = dayjs(dateStr, "yyyyMMdd");
        let dayGap = today.diff(docDate, "day");
        formatedStr += ` ${language["mode12_week_day"][docDate.day()]}`;
        if (dayGap < 1) {
            formatedStr += ` ${language["mode12_today"]}`;
        }else if (dayGap == 1) {
            formatedStr += ` ${language["mode12_yesterday"]}`;
        }else if (dayGap < 7) {
            formatedStr += ` ${language["mode12_day_ago"].replace(new RegExp("%%", "g"), dayGap)}`;
        }
        return `<li><span class="mode12_date_text">${formatedStr}</span></li><ul>`;
    }
    endOneDate() {
        return `</ul>`;
    }
    //在所有输出文本写入之前
    beforeAll() {
        return `<div id="refContainer"> <ul class="linksList" id="linksList">`;
    }
    //在所有输出文本写入之后
    afterAll() {
        return `</ul></div>`;
    }
    init(custom_attr) {
        custom_attr.listDepth = 999;
        custom_attr.endDocOutline = false;
        $("#listDepth, #endDocOutline, #maxListCount, #sortBy").prop("disabled", "true");
        $("#modeSetting").append(`<span id="mode12_doc_num_hint">${language["mode12_doc_num_text"]}</span>
        <input id="mode12_doc_num" type="number" name="docNum" title="要显示的文档数量最大值\nThe maximum number of docs displayed" min="1" value="20">
        <span id="mode12_update_hint">${language["mode12_update_hint"]}</span>
        <input type="checkbox" name="mode12_updated_checkbox" checked id="mode12_update_checkbox" title="禁用则使用创建时间排序\nDisabled to order by create time">`);
        return custom_attr;
    }
    destory(custom_attr) {
        custom_attr.listDepth = 1;
        $("#listDepth, #endDocOutline, #maxListCount, #sortBy").prop("disabled", "");
        $("#modeSetting").html("");
        return custom_attr;
    }
    load(modeSettings) {
        if (modeSettings == undefined) return;
        logPush("LOAD SETTINGS")
        $("#mode12_doc_num").val(modeSettings["docNum"]);
        $("#mode12_update_checkbox").prop("checked", modeSettings["byUpdate"]);
    }
    save() {
        return {
            "docNum": $("#mode12_doc_num").val(),
            "byUpdate": $("#mode12_update_checkbox").prop("checked"),
        }
    }
    async doGenerate(updateAttr) {
        // 
        let queryStmt = `SELECT * FROM blocks WHERE type="d" `;
        let isUpdateTime = false;
        let rowCount = 0;
        let result = this.beforeAll();
        // 检索时区分检索范围
        // / 或 笔记本 或path比对
        if (updateAttr["targetNotebook"] == "/") {

        }else if (updateAttr["targetDocPath"] == "/") {
            queryStmt += `AND box = "${updateAttr.targetNotebook}" `;
        }else if (isValidStr(updateAttr.widgetSetting["targetId"])){
            queryStmt += `AND path like "%${updateAttr.widgetSetting["targetId"]}/%" `;
        }else{
            queryStmt += `AND path like "%${updateAttr["docId"]}/%" `;
        }
        // 区分按照创建/按照更新时间排序
        if ($("#mode12_update_checkbox").prop("checked")) {
            queryStmt += `ORDER BY updated DESC `;
            isUpdateTime = true;
        }else{
            queryStmt += `ORDER BY created DESC `;
        }
        queryStmt += `LIMIT ${$("#mode12_doc_num").val()}`;
        // console.warn("SQL", queryStmt);
        let queryDocsResponse = await queryAPI(queryStmt);
        // logPush("RES", queryDocsResponse);
        if (!isValidStr(queryDocsResponse) || queryDocsResponse.length <= 0) {
            return language["noChildDoc"];
        }
        // 根据上下文时间处理缩进
        let lastDate = "";
        for (let doc of queryDocsResponse) {
            let currentDocDateTime = isUpdateTime ? doc.updated : doc.created;
            let currentDocDate = currentDocDateTime.substring(0, 8);
            if (currentDocDate != lastDate) {
                if (lastDate != "") result += this.endOneDate();
                result += this.startOneDate(currentDocDate);
                rowCount++;
            }
            result += this.oneDocLink({"id": doc.id, "name": doc.content, "time": currentDocDateTime.substring(8, 12), "hpath": doc.hpath});
            rowCount++;
            lastDate = currentDocDate;
        }
        result += this.endOneDate() + this.afterAll();
        // logPush(result);
        return [result, rowCount];
    }
}

/**
 * 13 桌面端生成指定的目录结构
 * Markdown 无序列表 写入文档
 */
class PCFileDirectoryPrinter extends Printer {
    static id = 13;
    id = 13;
    write2file = 1;
    globalConfig = null;
    modeSettings = {};
    updateAttr = {};
    fs = null;
    path = null;
    fileCount;
    maxFileCount = 512;
    continue = true;
    rowCount = 0;

    setGlobalConfig(config) {
        this.globalConfig = Object.assign({}, config);
    }
    /**
     * 输出对齐、缩进文本
     * 它在输出当前文档链接之前调用
     * @param {*} nowDepth 当前文档所在层级，层级号从1开始
     * @returns 
     */
    align(nowDepth) {
        let spaces = "";
        spaces += "  ".repeat(nowDepth - 1);
        return spaces;
    }
    /**
     * 输出子文档列表格式文本
     * 在下一层级子文档列出之前被调用
     * @param {*} nowDepth 
     * @returns 
     */
    beforeChildDocs(nowDepth) { return ""; }
    /**
     * 在下一层级子文档列出之后被调用
     * @param {*} nowDepth 
     * @returns
     * */
    afterChildDocs(nowDepth) { return ""; }
    /**输出当前文档链接
     * @param {doc} doc为listDocsByPath伪API输出格式
     * 兼容性警告，目前这个参数也输入大纲对象，大纲对象情况较为复杂，
     * 请只读取doc.id doc.name属性，否则请另外判断属性是否存在、是否合法
     * */
    oneDocLink(doc, rowCountStack) { 
        return `* [${markdownUrlNameFilter(doc.name)}](file://${doc.path})`;
    }
    /**
     * 在所有输出文本写入之前被调用
     * @returns
     * */
    beforeAll() { return ""; }
    /**
     * 在所有输出文本写入之后被调用
     * @returns 
     */
    afterAll() { return ""; }
    /**
     * 如果不存在子文档，将输出错误提示，错误提示可能需要包装以便展示
     * @params {*} emptyText 无子文档时错误信息文本
     * @returns
     */
    noneString(emptyText) { return emptyText; }

    /**
     * 分栏操作
     * 如果不需要实现，请直接返回初始值
     * (挂件内分栏通过css实现，请直接返回初始值)
     * （只在 将块写入文档的默认实现中调用此函数，如果模式自行doUpdate，则Main.js不调用）
     * @params {string} originalText 初始值
     * @params {int} nColumns 列数
     * @params {int} nDepth 文档列出层级/深度
     * @returns 分栏后的初始值
     */
    splitColumns(originalText, nColumns, nDepth, blockAttrData) {
        return generateSuperBlock(originalText, nColumns, nDepth, blockAttrData, this.globalConfig);
    }
    /**
     * （如果必要）模式自行生成待插入的内容块文本
     * （挂件内为html，文档内为markdown(勿在结尾加ial)）
     * @param {*} updateAttr 基本信息参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return 非空字符串【若返回undefined、null、""，将由__main()执行内容文本的生成。
     */
    async doGenerate(updateAttr) {
        this.updateAttr = updateAttr;
        if (!window.top.require) {
            throw new Error(language["mode13_cannot_refresh"]);
        }
        // 路径是点击选择后保存的，其他设置需要重新载入
        this.modeSettings["showWhat"] = $("#mode13_select_show_what").val();
        logPush("showWhat", $("#mode13_select_show_what").val());
        if (!isValidStr(this.modeSettings.targetPath)) {
            throw new Error(language["mode13_not_select_folder_when_refresh"]);
        }
        this.fs = window.top.require("fs");
        this.path = window.top.require("path");
        this.fileCount = 0;
        if (!this.fs || !this.path) {
            throw new Error(language["mode13_cannot_refresh"]);
        }
        // 系统检查
        let currentSysId = window.top.siyuan ? window.top.siyuan.config.system.id : "";
        if (this.modeSettings["sysId"] && this.modeSettings["sysId"].length > 0 && isValidStr(currentSysId) && this.modeSettings["sysId"].indexOf(currentSysId) == -1) {
            if (updateAttr.isAutoUpdate) {
                this.continue = false;
                logPush("自动刷新触发，但系统不匹配，停止");
                return "是自动刷新触发，且系统不匹配，停止操作";
            }
            // 记录当前iframe情况
            let widgetStyle = {
                width: window.frameElement.style.width,
                height: window.frameElement.style.height
            };
            window.frameElement.style.width = this.globalConfig.width_2file_setting;
            window.frameElement.style.height = this.globalConfig.height_2file_setting;
            let waitForApprove = new Promise((resolve, reject)=>{
                layui.layer.open({
                    type: 0,
                    content: language["mode13_another_sys_warn"],
                    icon: 3, 
                    btn: [language["dialog_confirm"], language["dialog_cancel"], language["mode13_trust_sysid"]], 
                    title: language["confirmTitle"],
                    btn1: function(){
                        layer.closeLast("dialog");
                        resolve(true);
                    },
                    btn2: function() {
                        layui.layer.msg(language["dialog_cancel"]);
                        resolve(false);
                    },
                    btn3: () => {
                        layer.closeLast("dialog");
                        this.modeSettings["sysId"].push(currentSysId);
                        resolve(true);
                    }
                });
            });
            let confireResult = await waitForApprove;
            window.frameElement.style.width = widgetStyle.width;
            window.frameElement.style.height = widgetStyle.height;
            if (!confireResult) {
                // 拒绝继续，由doUpdate处理但并不执行刷新
                this.continue = false;
                return "用户拒绝继续";
            }
            
        }
        let result = await this.getOneLevelDirectory(this.modeSettings.targetPath, 1);
        if (isValidStr(result)) {
            this.continue = true;
        } else {
            this.continue = false;
        }
        return [result, this.fileCount];
    }
    async getOneLevelDirectory(basicPath, depth) {
        if (depth > this.updateAttr["widgetSetting"].listDepth && this.updateAttr["widgetSetting"].listDepth) {
            return "";
        }
        // 防止遍历到超长目录
        if (this.fileCount >= this.maxFileCount) {
            return ""
        }
        let result = "";
        const dirents = this.fs.readdirSync(basicPath, {withFileTypes: true});
        const folders = new Array();
        const files = new Array();
        // 遍历过滤addr
        for (let dirent of dirents) {
            if (dirent.isDirectory()) {
                folders.push(dirent);
            } else {
                files.push(dirent);
            }
        }
        if (this.modeSettings["showWhat"] == "folder") {
            for (let folder of folders) {
                result += this.align(depth);
                result += this.oneDocLink({
                    name: folder.name,
                    path: this.path.join(basicPath, folder.name)
                });
                result += "\n";
                this.fileCount++;
                if (folder.isDirectory() && this.fileCount < this.maxFileCount) {
                    result += await this.getOneLevelDirectory(this.path.join(basicPath, folder.name), depth + 1);
                } 
            }
        } else if (this.modeSettings["showWhat"] == "file") {
            if (depth < this.updateAttr["widgetSetting"].listDepth) {
                for (let dirent of folders) {
                    result += this.align(depth);
                    result += this.oneDocLink({
                        name: dirent.name,
                        path: this.path.join(basicPath, dirent.name)
                    });
                    result += "\n";
                    this.fileCount++;
                    if (dirent.isDirectory() && this.fileCount < this.maxFileCount) {
                        result += await this.getOneLevelDirectory(this.path.join(basicPath, dirent.name), depth + 1);
                    } 
                }
            }
            for (let dirent of files) {
                result += this.align(depth);
                result += this.oneDocLink({
                    name: dirent.name,
                    path: this.path.join(basicPath, dirent.name)
                });
                result += "\n";
                this.fileCount++;
            }
        } else {
            for (let dirent of folders) {
                result += this.align(depth);
                result += this.oneDocLink({
                    name: dirent.name,
                    path: this.path.join(basicPath, dirent.name)
                });
                result += "\n";
                this.fileCount++;
                if (dirent.isDirectory() && this.fileCount < this.maxFileCount) {
                    result += await this.getOneLevelDirectory(this.path.join(basicPath, dirent.name), depth + 1);
                } 
            }
            for (let dirent of files) {
                result += this.align(depth);
                result += this.oneDocLink({
                    name: dirent.name,
                    path: this.path.join(basicPath, dirent.name)
                });
                result += "\n";
                this.fileCount++;
            }
        }
        // TODO: 可考虑的：排序，对是目录的统统迁移到新列表，靠前展示，或者加个设置，用户选择显示文件或文件夹或全部hhh
        // for (let dirent of dirents) {
        //     result += this.align(depth);
        //     result += this.oneDocLink({
        //         name: dirent.name,
        //         path: this.path.join(basicPath, dirent.name)
        //     });
        //     result += "\n";
        //     this.fileCount++;
        //     if (dirent.isDirectory() && this.fileCount < this.maxFileCount) {
        //         result += await this.getOneLevelDirectory(this.path.join(basicPath, dirent.name), depth + 1);
        //     } 
        // }
        return result;
    }
    /**
     * （如果必要）模式自行处理内容块写入（更新）操作
     * @param {*} textString 待写入的内容
     * @param {*} updateAttr 基本参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return 1: 由模式自行处理写入；0: 由挂件统一执行写入和更新； -1模式请求停止；
     * 不应在此方法中执行耗时的子文档获取操作，此方法仅用于将textString写入到文档中或挂件中
     */
    async doUpdate(textString, updateAttr) {
        // 根据doGenerate判断是否需要继续，1则Printer处理（但实际上未执行）等价于未执行
        if (this.continue) {
            return 0;
        }else {
            return -1;
        }
        
    }
    /**
     * 对于文档中列表块的方式，这里返回需要作为列表块（分列时为外层超级块）的块属性
     * （只在 将块写入文档的默认实现中调用此函数，如果模式自行doUpdate，则Main.js不调用）
     * @return
     */
    getAttributes() {
        return null;
    }
    /**
     * 模式初始化操作
     * @return 
     */
    init(custom_attr) {
        $("#targetId, #endDocOutline, #sortBy, #maxListCount, [name='outlineStartAt'], [name='outlineEndAt']").prop("disabled", "true");
        $("#modeSetting").append(`
        <button class="layui-btn layui-btn-primary layui-border-green" mode13-on="mode13_select_folder">${language["mode13_select_folder"]}</button><span id="mode13_selected_path">${language["mode13_display_path_here"]}</span><br/><span>${language["mode13_show_what"]}</span>
        <select name="mode13_select_show_what" id="mode13_select_show_what">
            <option value="folder">${language["mode13_only_folder"]}</option>
            <option value="file">${language["mode13_only_file"]}</option>
            <option value="all" selected>${language["mode13_show_all"]}</option>
        </select>
        `);
        layui.util.on("mode13-on", {
            "mode13_select_folder": async (event) => {
                if (!window.top.require) {
                    layui.layer.msg(language["mode13_cannot_select_folder"], {time: 3000, icon: 0});
                    return;
                }
                const remote = await window.top.require("@electron/remote");
                if (remote && remote.dialog) {
                    let path = remote.dialog.showOpenDialog({
                        title: language["mode13_select_folder"],
                        properties: ["createDirectory", "openDirectory"],
                    }).then((path)=>{
                        if (path && path.filePaths.length > 0) {
                            that.modeSettings["targetPath"] = path.filePaths[0];
                            // 记录选择路径时的系统id，系统id不匹配时，刷新弹出提示确认
                            that.modeSettings["sysId"] = window.top.siyuan ? [window.top.siyuan.config.system.id] : [];
                            $("#mode13_selected_path").text(this.modeSettings["targetPath"]);
                        } else {
                            layui.layer.msg(language["mode13_not_select_folder"], {time: 3000, icon: 0});
                        }
                    }).catch((err)=>{
                        errorPush("选文件夹时错误", err);
                        layui.layer.open({title: "ERROR", icon: 3, btn: [language["dialog_confirm"]], btn1: function(index, layero, that){return layui.layer.close(index);}, content: language["mode13_error_while_select_folder"]});
                    })
                    
                    
                } else {
                    layui.layer.msg(language["mode13_cannot_select_folder"], {time: 3000, icon: 0});
                }
            }
        });
        const that = this;
        // 通过修改custom_attr并返回修改后的值实现强制指定某个设置项，建议只在禁止用户更改时强制指定设置项的值
        return custom_attr;
    }
    /**
     * 模式退出时操作
     */
    destory(custom_attr) {
        // 取消常规设置的禁用样式
        $("#targetId, #endDocOutline, #sortBy, #maxListCount, [name='outlineStartAt'], [name='outlineEndAt']").prop("disabled", "");
        // 如果部分通用设定过于不合理，通过修改custom_attr并返回修改后的以重置。
        return custom_attr;
    }
    /**
     * 载入配置
     * 注意，可能不存在相应设置
     */
    load(savedAttrs) {
        if (savedAttrs) {
            Object.assign(this.modeSettings, savedAttrs);
            if (this.modeSettings["targetPath"]) {
                $("#mode13_selected_path").text(this.modeSettings["targetPath"]);
            }
            if (this.modeSettings["showWhat"]) {
                $("#mode13_select_show_what").val(this.modeSettings["showWhat"]);
            }
        }
    }
    /**
     * 保存配置
     * @return 请返回一个对象
     */
    save() {
        return Object.assign({}, this.modeSettings);
    }
}

/* *****共用方法***** */

/**
 * 用于根据nColumns分列数拆分无序列表生成超级块（单行！）
 * @param {string} originalText 原始文本
 * @param {int} nColumns 文档分列数
 * @param {int} nDepth 文档列出深度
 * @param {*} blockAttrData 应用于分列后列表的属性
 * @returns 超级块Markdown文本
 */
function generateSuperBlock(originalText, nColumns, nDepth, blockAttrData, globalConfig = null) {
    if (nColumns <= 1) return originalText;
    // logPush(originalText);
    //定位合适的划分点
    let regex = /^\* .*/gm;//首层级
    let allBulletsRegex = /^ *\* .*/gm;//所有行
    let firstBullets = originalText.match(regex);//一层级
    let allBullets = originalText.match(allBulletsRegex);//所有行
    //无序列表无匹配，换用有序列表匹配
    if (firstBullets == null || allBullets == null) {
        regex = /^[0-9]+\. .*/gm;//首层级
        allBulletsRegex = /^ *[0-9]+\. .*/gm;//所有行
        firstBullets = originalText.match(regex);//一层级
        allBullets = originalText.match(allBulletsRegex);//所有行
        if (firstBullets == null || allBullets == null) {//有序列表、无序列表均匹配失败
            console.error("未能在文本中找到有/无序列表，超级块分列失败");
            return originalText;
        }
    }
    let result = originalText;
    //分列间隔计算
    let splitInterval = Math.floor(firstBullets.length / nColumns);//仅计算首行，分列间隔
    let splitIntervalRef = Math.floor(allBullets.length / nColumns);//算上所有行，分列间隔
    if ((allBullets.length / nColumns) % 1 > 0) {//均匀排布
        splitIntervalRef++;
    }
    if ((firstBullets.length / nColumns) % 1 > 0) {//均匀排布
        splitInterval++;
    }
    if (splitInterval <= 0) splitInterval = 1;
    //缩进中折列 Mode1
    if (globalConfig.divideColumnAtIndent) {
        let divideIndex = new Array(firstBullets.length);//list划分位置（仅首层行）
        let divideAllIndex = new Array(allBullets.length);//list划分位置（所有行）
        let firstBulletIndex = new Array(firstBullets.length);//所有行中，是首层行下标
        let cIsFirstBullet = 0;
        //1层级无序列表下标
        for (let i = 0; i < divideIndex.length; i++) {
            divideIndex[i] = originalText.indexOf(firstBullets[i]);
        }
        //所有层级无序列表下标
        for (let i = 0; i < divideAllIndex.length; i++) {
            divideAllIndex[i] = originalText.indexOf(allBullets[i]);
            if (firstBullets.indexOf(allBullets[i]) != -1) {
                firstBulletIndex[cIsFirstBullet++] = i;
            }
        }
        // for (let i = allBullets.length - splitIntervalRef, cColumn = 0; i > 0 && cColumn < nColumns - 1;
        //     i -= splitIntervalRef, cColumn++){
        for (let i = splitIntervalRef, cColumn = 0; i < allBullets.length && cColumn < nColumns - 1;
            i += splitIntervalRef, cColumn++) {
                // logPush(`列count:${cColumn} 列总数: ${nColumns}`);
            // if (i == splitIntervalRef) i+= Math.floor(splitIntervalRef * 0.1 + 1);
            let splitAtIndex = result.indexOf(allBullets[i]);
            if (firstBulletIndex.indexOf(i) == -1) {//在缩进中截断折列
                //logPush("判定层级数",result.slice(splitAtIndex).match(/ */)[0].length);
                let continueIndentStr = "";//补偿缩进
                for (let j = 0; j < result.slice(splitAtIndex).match(/ */)[0].length / 2; j++) {
                    continueIndentStr += "  ".repeat(j) + `* ${globalConfig.divideIndentWord}\n`;
                }
                //可以尝试加入原文档
                result = result.slice(0, splitAtIndex) + `${getDivider()}${continueIndentStr}` + result.slice(splitAtIndex);
            } else {
                result = result.slice(0, splitAtIndex) + `${getDivider()}` + result.slice(splitAtIndex);
            }
        }
    } else {//禁用缩进中截断Mode2（依据首层折断）
        //分列方式尽可能均匀
        let splitAtFirstIndex = new Array();
        debugPush("分列总行数", allBullets.length);
        // 重复计算，分列数递增3次，直到结束，或分列数量达到要求
        for (let cRetry = 0; cRetry < 3; cRetry++) {
            splitAtFirstIndex = new Array();
            let nColumnsRetryOnly = nColumns + cRetry;
            let splitInterval = Math.floor(firstBullets.length / nColumnsRetryOnly);//仅计算首行，分列间隔
            let splitIntervalRef = Math.floor(allBullets.length / nColumnsRetryOnly);//算上所有行，分列间隔
            
            if ((allBullets.length / nColumnsRetryOnly) % 1 > 0) {//均匀排布
                splitIntervalRef++;
            }
            if ((firstBullets.length / nColumnsRetryOnly) % 1 > 0) {//均匀排布
                splitInterval++;
            }
            debugPush("分列行计算值", splitIntervalRef);
            //先按行分，从理应换行位置向后找不截断的换行位置，但在文档数超长时仍可能不均分
            for (let i = splitIntervalRef, cColumn = 0; i < allBullets.length && cColumn < nColumns - 1;
                i += splitIntervalRef, cColumn++) {
                for (let j = i; j < allBullets.length; j++) {//寻找合适的不截断换行位置（首层级）
                    let index = firstBullets.indexOf(allBullets[j]);
                    // debugPush("分列行位置推断", allBullets[j]);
                    if (index != -1) {
                        // 去重
                        if (splitAtFirstIndex.indexOf(index) == -1) {
                            splitAtFirstIndex.push(index);
                        }
                        // 遇到了重复的再往后找也没意义，退出
                        break;
                    }
                }
            }
            debugPush("后推分列尝试结果", splitAtFirstIndex);
            // 判断，分列数量足够则跳出
            if (splitAtFirstIndex.length >= nColumns - 1) {
                debugPush("分列结果", splitAtFirstIndex);
                break;
            } else {
                debugPush("分列尝试", splitAtFirstIndex.length);
            }
            // 后推不能满足要求的，前推寻找匹配的分列点
            let splitAtFirstIndexForwardPredict = new Array();
            // 前推判断
            for (let i = splitIntervalRef, cColumn = 0; i < allBullets.length && cColumn < nColumns - 1;
                i += splitIntervalRef, cColumn++) {
                for (let j = i; j >= 0; j--) {//寻找合适的不截断换行位置（首层级）
                    let index = firstBullets.indexOf(allBullets[j]);
                    // debugPush("分列行位置推断", allBullets[j]);
                    if (index != -1) {
                        // 去重
                        if (splitAtFirstIndexForwardPredict.indexOf(index) == -1) {
                            splitAtFirstIndexForwardPredict.push(index);   
                        }
                        // 遇到了重复的再往前找也没意义，退出
                        break;
                    }
                }
            }
            debugPush("前推分列尝试结果", splitAtFirstIndexForwardPredict);
            if (splitAtFirstIndexForwardPredict.length == nColumns - 1) {
                splitAtFirstIndex = splitAtFirstIndexForwardPredict;
                debugPush("使用前推分列结果");
                break;
            }
        }
        
        // logPush(splitAtFirstIndex);
        for (let index of splitAtFirstIndex) {
            let splitAtIndex = result.indexOf(firstBullets[index]);
            result = result.slice(0, splitAtIndex) + `${getDivider()}` + result.slice(splitAtIndex);
        }
        //旧方法
        // for (let i = splitInterval, cColumn = 0;
        //     i < firstBullets.length && cColumn < nColumns - 1;
        //     i += splitInterval, cColumn++){
        //     let splitAtIndex = result.indexOf(firstBullets[i]);
        //     // result = result.slice(0, splitAtIndex) + "}}}\n{{{row\n" + result.slice(splitAtIndex);
        //     result = result.slice(0, splitAtIndex) + `${getDivider()}` + result.slice(splitAtIndex);
        // }
    }
    if (globalConfig.superBlockBeta) {
        result = "{{{col\n" + result + getDivider() + "}}}\n";//超级块写入测试模式
    } else {
        result = "{{{col\n{{{row\n" + result + "}}}\n}}}\n";
    }

    // logPush(result);
    return result;
    //生成kramdown类型的块分隔（？）
    function getDivider() {
        if (globalConfig.superBlockBeta) {
            blockAttrData["id"] = generateBlockId();
            blockAttrData["updated"] = getUpdateString()
            let attrIAL = transfromAttrToIAL(blockAttrData);
            return `  \n${attrIAL}\n\n`;
        } else {
            return "}}}\n{{{row\n";
        }

    }
}


/**
 * 在html中显示文档icon
 * @param {*} iconString files[x].icon
 * @param {*} hasChild 
 * @returns 
 */
function getEmojiHtmlStr(iconString, hasChild) {
    if (iconString == undefined || iconString == null) return "";//没有icon属性，不是文档类型，不返回emoji
    if (iconString == "") return hasChild ? `<span class="emojitext">📑</span>` : 
        `<span class="emojitext">📄</span>`;//无icon默认值
    let result = iconString;
    // emoji地址判断逻辑为出现.，但请注意之后的补全
    if (iconString.indexOf(".") != -1) {
        // if (!setting.customEmojiEnable) return hasChild ? "📑" : "📄";//禁用自定义emoji时
        // emoji为网络地址时，不再补全/emojis路径
        if (iconString.indexOf("http://") != -1 || iconString.indexOf("https://") != -1) {
            // if (!setting.webEmojiEnable) return hasChild ? "📑" : "📄";//禁用网络emoji时
            result = `<img class="iconpic" src="${iconString}"/>`;
        }else {
            result = `<img class="iconpic" src="/emojis/${iconString}"/>`;
        }
        
    } else {
        result = `<span class="emojitext">${emojiIconHandler(iconString, hasChild)}</span>`;
    }
    return result;
}

/**
 * 在markdown中显示文档icon
 * @param {*} iconString files[x].icon
 * @param {*} hasChild 
 * @returns 
 */
function getEmojiMarkdownStr(iconString, hasChild) {
    if (iconString == undefined || iconString == null) return "";//没有icon属性，不是文档类型，不返回emoji
    if (iconString == "") return hasChild ? "📑" : "📄";//无icon默认值
    let result = iconString;
    if (iconString.indexOf(".") != -1) {
        // if (!setting.customEmojiEnable) return hasChild ? "📑" : "📄";//禁用自定义emoji时
        // emoji为网络地址时，不再补全/emojis路径
        if (iconString.indexOf("http://") != -1 || iconString.indexOf("https://") != -1) {
            console.warn("暂不支持网络emoji，请@开发者进行适配");
            return hasChild ? "📑" : "📄";
        }else{
            // 移除扩展名
            let removeFileFormat = iconString.substring(0, iconString.lastIndexOf("."));
            result = `:${removeFileFormat}:`;
        }
    } else {
        result = emojiIconHandler(iconString, hasChild);
    }
    return result;
}

/**
 * 接受并处理icon16进制字符串为Unicode字符串
 * 不再处理（为空等）例外情况
 * @param {*} iconString 形如ffff-ffff-ffff-ffff
 * @param {*} hasChild 有无子文档
 * @returns 
 */
let emojiIconHandler = function (iconString, hasChild = false) {
    //确定是emojiIcon 再调用，printer自己加判断
    try {
        let result = "";
        iconString.split("-").forEach(element => {
            result += String.fromCodePoint("0x" + element);
        });
        return result;
    } catch (err) {
        console.error("emoji处理时发生错误", iconString, err);
        return hasChild ? "📑" : "📄";
    }

}

/**
 * html字符转义
 * 目前仅emoji使用
 * 对常见的html字符实体换回原符号
 * @param {*} inputStr 
 * @returns 
 */
function htmlTransferParser(inputStr) {
    if (inputStr == null || inputStr == "") return "";
    let transfer = ["&lt;", "&gt;", "&nbsp;", "&quot;", "&amp;"];
    let original = ["<", ">", " ", `"`, "&"];
    for (let i = 0; i < transfer.length; i++) {
        inputStr = inputStr.replace(new RegExp(transfer[i], "g"), original[i]);
    }
    return inputStr;
}

/**
 * Markdown 字符转义
 * 仅emoji使用，将emoji路径中的保留符进行转换
 * @param {*} inputStr 
 */
function markdownEmojiPathEncoder(inputStr) {
    if (inputStr == null || inputStr == "") return "";
    let original = ["(", ")", " "];
    let transfer = ["%28", "%29", "&#32;"];
    for (let i = 0; i < original.length; i++) {
        inputStr = inputStr.replace(new RegExp(original[i], "g"), transfer[i]);
    }
    return inputStr;
}

/**
 * Markdown字符转义
 * 仅文档名&静态锚文本使用
 */
function markdownRefBlockDocNameEncoder(inputStr) {
    if (inputStr == null || inputStr == "") return "";
    let original = ["'"];
    let transfer = ["&apos;"];
    for (let i = 0; i < original.length; i++) {
        inputStr = inputStr.replace(new RegExp(original[i], "g"), transfer[i]);
    }
    return inputStr;
}

/**
 * Markdown 字符转义
 * 仅文档名&URL类型使用
 * @param {*} inputStr 
 * @returns 
 */
function markdownUrlNameFilter(inputStr) {
    if (inputStr == null || inputStr == "") return "";
    // original里，由于$是正则标记，需要转义，别看着很离谱，但就是这样
    let original = [`\\$`];
    let transfer = [`\\$`];
    for (let i = 0; i < original.length; i++) {
        inputStr = inputStr.replace(new RegExp(original[i], "g"), transfer[i]);
    }
    return inputStr;
    return result;
}

export let printerList = [
    DefaultPrinter,//0默认：出错时将重置到此模式 // 可以调换顺序，但请不要移除默认模式
    HtmlReflinkPrinter,//1挂件内，伪引用块
    MarkdownUrlUnorderListPrinter,//2在文档中写入无序列表 siyuanUrl
    MarkdownDChainUnorderListPrinter,//3在文档中写入无序列表 引用块 
    MarkdownUrlOrderListPrinter,//6在文档中写入有序列表 siyuanUrl
    MarkdownDChainOrderListPrinter,//7在文档中写入有序列表 引用块
    MarkdownUrlStandardOrderListPrinter,//8文档中1.2.2.类型有序列表
    HtmlReflinkOrderPrinter, //4挂件内，有序列表伪引用块
    HtmlDefaultOrderPrinter, //5挂件内，有序列表<a>
    MarkdownTodoListPrinter, //9todo列表 存在问题：刷新导致任务打钩丢失
    MarkmapPrinter, //10挂件内思维导图
    ContentBlockPrinter, //11内容预览块
    OrderByTimePrinter, //12按时间分组
    PCFileDirectoryPrinter, //13文件夹目录
];
export { Printer, DefaultPrinter };
/** 附录：doc对象（由文档树api获得），示例如下
 * "path": "/20220807110638-uv5bqv8/20220810155329-xnskr8a.sy",//文档路径
    "name": "test.sy",//文档名，包含.sy
    "icon": "",
    "name1": "",
    "alias": "",
    "memo": "",
    "bookmark": "",
    "id": "20220810155329-xnskr8a",
    "count": 0,
    "size": 0,
    "hSize": "0 B",
    "mtime": 1660118012,
    "ctime": 1660118009,
    "hMtime": "7 秒以前",
    "hCtime": "2022-08-10 15:53:29",
    "sort": 0,
    "subFileCount": 0//其下子文档数
 * 
 */