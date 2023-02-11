/**
 * listChildDocsClass.js
 * 用于生成子文档目录文本的Printer。
 */
import { setting } from './config.js';
import { getUpdateString, generateBlockId, isValidStr } from "./common.js";
import { openRefLink } from './ref-util.js';
import { getCurrentDocIdF, getDoc, getKramdown, getSubDocsAPI, postRequest, queryAPI } from './API.js';
//建议：如果不打算更改listChildDocsMain.js，自定义的Printer最好继承自Printer类
//警告：doc参数输入目前也输入outline对象，请注意访问范围应当为doc和outline共有属性，例如doc.id doc.name属性
//
//其他情况请做判断
class Printer {
    //写入到文件or写入到挂件
    //0写入到挂件（以HTML格式），1写入到当前文档（以Markdown格式）
    static mode = -1;
    write2file = 1;

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
     * @params {string} originalText 初始值
     * @params {int} nColumns 列数
     * @params {int} nDepth 文档列出层级/深度
     * @returns 分栏后的初始值
     */
    splitColumns(originalText, nColumns, nDepth) { return originalText; }
    /**
     * （如果必要）模式自行生成待插入的内容块文本
     * （挂件内为html，文档内为markdown(勿在结尾加ial)）
     * @param {*} updateAttr 基本信息参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return 非空字符串【若返回undefined、null、""，将由__main()执行内容文本的生成。
     */
    async doGenerate(updateAttr) {
        return undefined;
    }
    /**
     * （如果必要）模式自行处理内容块写入（更新）操作
     * @param {*} textString 待写入的内容
     * @param {*} updateAttr 基本参数，详见listChildDocsMain.js __main()方法下的updateAttr对象
     * @return 1: 由模式自行处理写入；0: 由挂件统一执行写入和更新
     */
    async doUpdate(textString, updateAttr) {
        return 0;
    }
    /**
     * 模式初始化操作
     * @return 
     */
    init(custom_attr) {
        // 通过修改custom_attr实现强制指定某个设置项，建议只在禁止用户更改时强制指定设置项的值
        return custom_attr;
    }
    /**
     * 模式退出时操作
     */
    destory() {
        // 取消常规设置的禁用样式
        $("#listDepth, #listColumn, #targetId, #endDocOutline").prop("disabled", "");
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
    write2file = 0;
    beforeChildDocs(nowDepth) {
        return `<ul>`;
    }
    afterChildDocs(nowDepth) {
        return `</ul>`;
    }
    oneDocLink(doc, rowCountStack) {
        let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
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
    write2file = 0;
    beforeChildDocs(nowDepth) {
        return `<ul>`;
    }
    afterChildDocs(nowDepth) {
        return `</ul>`;
    }
    oneDocLink(doc, rowCountStack) {
        let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
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
        if (!isValidStr(doc.id)) {
            return `* ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        return `* ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
    noneString(emptyText) {
        return "* " + emptyText;
    }
    splitColumns(originalText, nColumns, nDepth) {
        return generateSuperBlock(originalText, nColumns, nDepth);
    }
}
/**
 * 引用块 文档中插入((id引用块)) 无序列表
 */
class MarkdownDChainUnorderListPrinter extends Printer {
    static id = 3;
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
        if (!isValidStr(doc.id)) {
            return `* ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}((${doc.id} '${markdownRefBlockDocNameEncoder(docName)}'))\n`;
    }
    noneString(emptyText) {
        return "* " + emptyText;
    }
    splitColumns(originalText, nColumns, nDepth) {
        return generateSuperBlock(originalText, nColumns, nDepth);
    }
}

/**
 * 【旧版默认】1.默认 挂件内<a>有序列表
 */
// class HtmlAlinkOrderPrinter extends HtmlAlinkPrinter {
//     static id = 5;
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
        let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
        return `<li class="linksListItem" data-id="${doc.id}">　${spaces}　${countStr}<span class="refLinks floatWindow childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
}

/**
 * 1.1 默认
 */
 class HtmlDefaultOrderPrinter extends HtmlReflinkPrinter {
    static id = 5;
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
        let emojiStr = getEmojiHtmlStr(doc.icon, doc.subFileCount != 0);
        return `<li class="linksListItem" data-id="${doc.id}">　${spaces}　${countStr}<span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiStr}${doc.name.replace(".sy", "")}</span></li>`;
    }
}
/**
 * 1. url 文档中创建siyuan://有序列表（Markdown有序列表）
 */
class MarkdownUrlOrderListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 6;
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
        if (!isValidStr(doc.id)) {
            return `${rowCountStack[rowCountStack.length - 1]}. ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        return `${rowCountStack[rowCountStack.length - 1]}. ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
}
/**
 * 1.引用块 文档内有序列表引用块
 */
class MarkdownDChainOrderListPrinter extends MarkdownDChainUnorderListPrinter {
    static id = 7;
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
        if (!isValidStr(doc.id)) {
            return `${rowCountStack[rowCountStack.length - 1]}. ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `${rowCountStack[rowCountStack.length - 1]}. ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}((${doc.id} '${markdownRefBlockDocNameEncoder(docName)}'))\n`;
    }
}
/**
 * 1.1.url 以1.1.的有序列表样式列出
 */
class MarkdownUrlStandardOrderListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 8;
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
        let countStr = "";
        for (let num of rowCountStack) {
            countStr += num + ".";
        }
        if (!isValidStr(doc.id)) {
            return `* ${countStr}　${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* ${countStr}　${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
}

/**
 * todo url 文档中TODO列表
 */
class MarkdownTodoListPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 9;
    oneDocLink(doc, rowCountStack) {
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0) {
            docName = docName.substring(0, docName.length - 3);
        }
        if (!isValidStr(doc.id)) {
            return `* [ ] ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}${docName}\n`;
        }
        // docName = htmlTransferParser(docName);//引用块文本是动态的，不用转义
        return `* [ ] ${getEmojiMarkdownStr(doc.icon, doc.subFileCount != 0)}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
}

/**
 * 挂件内导图 MarkMap
 */
class MarkmapPrinter extends MarkdownUrlUnorderListPrinter {
    static id = 10;
    write2file = 0;
    init(custom_attr) {
        custom_attr.listColumn = 1;
        custom_attr.endDocOutline = false;
        $("#listColumn, #endDocOutline").prop("disabled", "true");
        return custom_attr;
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
    async doUpdate(textString, updateAttr) {
        let widgetAttr = updateAttr.widgetSetting;
        // 匹配移除返回父文档
        textString = textString.replace(new RegExp("\\* \\[../\\][^\\n]*\\n"), "");
        let docName = window.top.document.querySelector(`li[data-type="tab-header"].item.item--focus .item__text`)?.innerText;
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
        if (isValidStr(docName) && !isValidStr(widgetAttr["targetId"])) {
            textString = `# ${docName}\n` + textString;
        }else if (isValidStr(docName) && docNameQuery[0].type == "d"){
            textString = `# [${docName}](siyuan://blocks/${docNameQuery[0].id})\n` + textString;
        }else if (isValidStr(updateAttr.targetDocName)) {
            textString = `# ${updateAttr.targetDocName}\n` + textString;
        }
        // textString = `# ${window.top.document.querySelector(`li[data-type="tab-header"].item.item--focus .item__text`).innerText}\n` + textString;
        document.getElementById("linksContainer").insertAdjacentHTML("beforeend", `<svg id="markmap" style="width: 100%; display: none;"></svg>`);
        let markmapElem = document.getElementById("markmap");
        markmapElem.style.height = "";
        markmapElem.style.display = "";
        markmapElem.innerHTML = "";
        // console.log($(window.frameElement).outerHeight(), $("body").outerHeight());
        markmapElem.style.height = ($(window.frameElement).outerHeight() - $("body").outerHeight() + 125) + "px";
        const transformer = new window.markmap.Transformer();
        const { root, features } = transformer.transform(textString);
        const { styles, scripts } = transformer.getUsedAssets(features);
        if (styles) window.markmap.loadCSS(styles);
        if (scripts) window.markmap.loadJS(scripts, { getMarkmap: () => markmap });
        // 计算层最大宽度
        let markmapConfig = {duration: 0, zoom: false, pan: false, maxWidth: 0};
        if (widgetAttr.listDepth == 0 || widgetAttr.endDocOutline) {
            markmapConfig.maxWidth = $(window.frameElement).innerWidth() / (widgetAttr.listDepth + widgetAttr.outlineDepth);
        }else{
            markmapConfig.maxWidth = $(window.frameElement).innerWidth() / (widgetAttr.listDepth);
        }
        // console.log("导图模式限制层宽", markmapConfig.maxWidth);
        Object.assign(markmapConfig, setting.markmapConfig);
        
        window.markmap.Markmap.create('#markmap', markmapConfig, root);
        $("#markmap a").click((event)=>{
            event.preventDefault();
            event.stopPropagation();
            let url = event.target.getAttribute("href");
            let id = url.match(new RegExp(`(?<=siyuan://blocks/).*`));
            event.target.setAttribute("data-id", id);
            openRefLink(event);
        });
        $("#markmap a").addClass("markmap_a");
        return 1;
    }
}

/**
 * 挂件内：子文档内容预览
 */
class ContentBlockPrinter extends Printer {
    static id = 11;
    write2file = 0;
    init(custom_attr) {
        custom_attr.listDepth = 1;
        custom_attr.listColumn = 1;
        custom_attr.endDocOutline = false;
        $("#listDepth, #listColumn, #endDocOutline").prop("disabled", "true");
        return custom_attr;
    }
    destory() {
       super.destory();
    }
    async doGenerate(updateAttr) {
        let result = `<div class="mode11-box">`;
        // 获取子文档列表
        let directChildDocs = await getSubDocsAPI(updateAttr["targetNotebook"], updateAttr["targetDocPath"]);
        // 获取子文档内容
        for (let oneChildDoc of directChildDocs) {
            let docName = oneChildDoc.name;
            if (docName.indexOf(".sy") >= 0) {
                docName = docName.substring(0, docName.length - 3);
            }
            let tempDocContent = await getKramdown(oneChildDoc.id);
            let tempHtmlContent = await postRequest({id: oneChildDoc.id}, "/api/export/preview");
            let emojiStr = getEmojiHtmlStr(oneChildDoc.icon, oneChildDoc.subFileCount != 0);
            // let tempDocContent = await queryAPI(`SELECT * FROM blocks WHERE 
            // root_id = "${oneChildDoc.id}" AND type in ('p', 's', 'l') ORDER BY sort`);
            console.log(tempHtmlContent.data.html);
            result += `<div class="mode11-note-box handle-ref-click"  data-id="${oneChildDoc.id}">`;
            result += `<h4 class="mode11-title">${emojiStr} ${docName}</h5>`;
            let threshold = 100;
            let cleanDocContent = this.cleanKramdown(tempDocContent);
            // 超长文本截断
            if (cleanDocContent.length > threshold) {
                let temp = cleanDocContent.substring(threshold);
                let crIndex = temp.search("\n");
                if (crIndex != -1) {
                    cleanDocContent = cleanDocContent.substring(0, threshold + crIndex);
                }
            }
            // 用于判定空文档
            let removeSpace = cleanDocContent.replace(new RegExp("\\n| ", "g"), "");
            // 转义显示
            cleanDocContent = cleanDocContent.replace(new RegExp("\n", "g"), "<br/>");
            cleanDocContent = cleanDocContent.replace(new RegExp(" ", "g"), "&nbsp;");
            if (!isValidStr(removeSpace)) {
                result += await this.generateSecond(updateAttr["targetNotebook"], oneChildDoc.path);
            }else{
                result += `<div class="mode11-doc-content">${this.cleanDocHtml(tempHtmlContent.data.html)}</div>`;
            }
            
            result += `</div>`;
        }
        // 生成
        return result;
    }
    /**
     * 生成次级文档目录
     * @param {*} notebook 笔记本boxid 
     * @param {*} docPath 文档路径
     * @returns 
     */
    async generateSecond(notebook, docPath) {
        let result = `<div class="mode11-child-p-container">`;
        let childDocResponse = await getSubDocsAPI(notebook, docPath);
        for (let oneChildDoc of childDocResponse) {
            let docName = oneChildDoc.name;
            if (oneChildDoc.name.indexOf(".sy") >= 0) {
                docName = docName.substring(0, docName.length - 3);
            }
            let emojiStr = getEmojiHtmlStr(oneChildDoc.icon, oneChildDoc.subFileCount != 0);
            result += `<p class="linksListItem" data-id="${oneChildDoc.id}"><span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${oneChildDoc.id}">${emojiStr}${docName}</span></p>`;
        }
        result += `</div>`;
        return result;
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
        parentDocPlainText = parentDocPlainText.replace(new RegExp('(?<=\"){[^\n]*}(?=\")', "gm"), "");
        // 清理ial
        parentDocPlainText = parentDocPlainText.replace(new RegExp('{:[^}]*}\\n*', "gm"), "");
        // console.log("清理ial后", parentDocPlainText);
        // 清理换行（空行并为单行，多个空行除外）
        parentDocPlainText = parentDocPlainText.replace(new RegExp('\\n *\\n', "gm"), "\n");
        // 清理iframe
        parentDocPlainText = parentDocPlainText.replace(new RegExp(`<iframe.*</iframe>`, "gm"), "");
        // console.warn("DEBUG单次清理结果", parentDocPlainText);
        return parentDocPlainText;
    }
    cleanDocHtml(text) {
        let jqElem = $("<div>"+text+"</div>");
        jqElem.find(".iframe").remove();
        if (window.top.siyuan.config.export.addTitle) {
            jqElem.find("h1").get(0).remove();
        }
        return jqElem.html();
    }
}

/* *****共用方法***** */

/**
 * 用于根据nColumns分列数拆分无序列表生成超级块（单行！）
 * @param {string} originalText 原始文本
 * @param {int} nColumns 文档分列数
 * @param {int} nDepth 文档列出深度
 * @returns 超级块Markdown文本
 */
function generateSuperBlock(originalText, nColumns, nDepth) {
    if (nColumns <= 1) return originalText;
    // console.log(originalText);
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
    if ((allBullets.length / nColumns).toString().match(/\./) != null) {//均匀排布
        splitIntervalRef++;
    }
    if ((firstBullets.length / nColumns).toString().match(/\./) != null) {//均匀排布
        splitInterval++;
    }
    if (splitInterval <= 0) splitInterval = 1;
    //缩进中折列 Mode1
    if (setting.divideColumnAtIndent) {
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
                // console.log(`列count:${cColumn} 列总数: ${nColumns}`);
            // if (i == splitIntervalRef) i+= Math.floor(splitIntervalRef * 0.1 + 1);
            let splitAtIndex = result.indexOf(allBullets[i]);
            if (firstBulletIndex.indexOf(i) == -1) {//在缩进中截断折列
                //console.log("判定层级数",result.slice(splitAtIndex).match(/ */)[0].length);
                let continueIndentStr = "";//补偿缩进
                for (let j = 0; j < result.slice(splitAtIndex).match(/ */)[0].length / 2; j++) {
                    continueIndentStr += "  ".repeat(j) + `* ${setting.divideIndentWord}\n`;
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
        //先按行分，从理应换行位置向后找不截断的换行位置，但在文档数超长时仍可能不均分
        for (let i = splitIntervalRef, cColumn = 0; i < allBullets.length && cColumn < nColumns - 1;
            i += splitIntervalRef, cColumn++) {
            for (let j = i; j < allBullets.length; j++) {//寻找合适的不截断换行位置（首层级）
                let index = firstBullets.indexOf(allBullets[j]);
                if (index != -1) {
                    // 去重
                    if (splitAtFirstIndex.indexOf(index) == -1) {
                        splitAtFirstIndex.push(index);
                    }
                    break;
                }
            }
        }
        // console.log(splitAtFirstIndex);
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
    if (setting.superBlockBeta) {
        result = "{{{col\n" + result + getDivider() + "}}}\n";//超级块写入测试模式
    } else {
        result = "{{{col\n{{{row\n" + result + "}}}\n}}}\n";
    }

    // console.log(result);
    return result;
    //生成kramdown类型的块分隔（？）
    function getDivider() {
        if (setting.superBlockBeta) {
            return `  \n{: id=\"${generateBlockId()}\" updated=\"${getUpdateString()}\"}\n\n`;
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
    if (!setting.emojiEnable) return "";//禁用emoji时直接返回
    if (iconString == undefined || iconString == null) return "";//没有icon属性，不是文档类型，不返回emoji
    if (iconString == "") return hasChild ? "📑" : "📄";//无icon默认值
    let result = iconString;
    // emoji地址判断逻辑为出现.，但请注意之后的补全
    if (iconString.indexOf(".") != -1) {
        if (!setting.customEmojiEnable) return hasChild ? "📑" : "📄";//禁用自定义emoji时
        // emoji为网络地址时，不再补全/emojis路径
        if (iconString.indexOf("http://") != -1 || iconString.indexOf("https://") != -1) {
            if (!setting.webEmojiEnable) return hasChild ? "📑" : "📄";//禁用网络emoji时
            result = `<img class="iconpic" src="${iconString}"/>`;
        }else {
            result = `<img class="iconpic" src="/emojis/${iconString}"/>`;
        }
        
    } else {
        result = emojiIconHandler(iconString, hasChild);
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
    if (!setting.emojiEnable) return "";//禁用emoji时直接返回
    if (iconString == undefined || iconString == null) return "";//没有icon属性，不是文档类型，不返回emoji
    if (iconString == "") return hasChild ? "📑" : "📄";//无icon默认值
    let result = iconString;
    if (iconString.indexOf(".") != -1) {
        if (!setting.customEmojiEnable) return hasChild ? "📑" : "📄";//禁用自定义emoji时
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
        inputStr = inputStr.replaceAll(transfer[i], original[i]);
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
        inputStr = inputStr.replaceAll(original[i], transfer[i]);
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
        inputStr = inputStr.replaceAll(original[i], transfer[i]);
    }
    return inputStr;
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