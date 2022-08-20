
//建议：如果不打算更改listChildDocsMain.js，自定义的Printer最好继承自此基类
class Printer{
    //写入到文件or写入到挂件
    //0写入到挂件（以HTML格式），1写入到当前文档（以Markdown格式）
    write2file = 1;

    /**
     * 输出对齐、缩进文本
     * 它在输出当前文档链接之前调用
     * @param {*} nowDepth 当前文档所在层级，层级号从1开始
     * @returns 
     */
    align(nowDepth){return "";}
    /**
     * 输出子文档列表格式文本
     * 在下一层级子文档列出之前被调用
     * @param {*} nowDepth 
     * @returns 
     */
    beforeChildDocs(nowDepth){return "";}
    /**
     * 在下一层级子文档列出之后被调用
     * @param {*} nowDepth 
     * @returns
     * */
    afterChildDocs(nowDepth){return "";}
    /**输出当前文档链接
     * @param {doc} doc为listDocsByPath伪API输出格式
     * */
    oneDocLink(doc){return "";}
    /**
     * 在所有输出文本写入之前被调用
     * @returns
     * */
    beforeAll(){return "";}
    /**
     * 在所有输出文本写入之后被调用
     * @returns 
     */
    afterAll(){return "";}
    /**
     * 如果不存在子文档，将输出错误提示，错误提示可能需要包装以便展示
     * @params {*} emptyText 无子文档时错误信息文本
     * @returns
     */
    noneString(emptyText){return emptyText;}
}
class HtmlAlinkPrinter extends Printer{
    write2file = 0;
    beforeChildDocs(nowDepth){
        return "<ul>";
    }
    afterChildDocs(nowDepth){
        return "</ul>";
    }
    oneDocLink(doc){
        return `<li class="linksListItem"><a class='childDocLinks' href="siyuan://blocks/${doc.id}">${emojiIconHandler(doc.icon, doc.subFileCount != 0)}${doc.name.replace(".sy", "")}</a></li>`;
    }
    //在所有输出文本写入之前
    beforeAll(){
        return `<ul class="linksList" id="linksList">`;
    }
    //在所有输出文本写入之后
    afterAll(){
        return `</ul>`;
    }
}
class HtmlReflinkPrinter extends Printer{
    write2file = 0;
    beforeChildDocs(nowDepth){
        return `<ul>`;
    }
    afterChildDocs(nowDepth){
        return `</ul>`;
    }
    oneDocLink(doc){
        return `<li class="linksListItem"><span class="refLinks childDocLinks" data-type='block-ref' data-subtype="d" data-id="${doc.id}">${emojiIconHandler(doc.icon, doc.subFileCount != 0)}${doc.name.replace(".sy", "")}</span></li>`;
    }
    //在所有输出文本写入之前
    beforeAll(){
        return `<div id="refContainer"> <ul class="linksList" id="linksList">`;
    }
    //在所有输出文本写入之后
    afterAll(){
        return `</ul></div>`;
    }
}
class MarkdownUrlUnorderListPrinter extends Printer{
    write2file = 1;
    align(nowDepth){
        let spaces = "";
        spaces += "  ".repeat(nowDepth - 1);
        return spaces;
    }
    oneDocLink(doc){
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0){
            docName = docName.substring(0, docName.length - 3);
        }
        
        return `- ${emojiIconHandler(doc.icon, doc.subFileCount != 0)}[${docName}](siyuan://blocks/${doc.id})\n`;
    }
    noneString(emptyText){
        return "* " + emptyText;
    }
}
class MarkdownDChainUnorderListPrinter extends Printer{
    write2file = 1;
    //对齐、缩进
    align(nowDepth){
        let spaces = "";
        for (let i = 0; i < (nowDepth - 1); i++){
            spaces += "  ";
        }
        return spaces;
    }
    oneDocLink(doc){
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0){
            docName = docName.substring(0, docName.length - 3);
        }
        return `- ((${doc.id} '${docName}'))\n`;
    }
    noneString(emptyText){
        return "* " + emptyText;
    }
} 

/**
 * 接受并处理icon16进制字符串为Unicode字符串
 * @param {*} iconString 形如ffff-ffff-ffff-ffff 或 来自 files[x].icon
 * @param {*} hasChild 有无子文档
 * @returns 
 */
let emojiIconHandler = function(iconString, hasChild = false){
    if (iconString == "")return hasChild?"📑":"📄";//无icon默认值
    let result = "";
    iconString.split("-").forEach(element => {
        result += String.fromCodePoint("0x"+element);
    });
    return result;
}
export default {Printer, HtmlAlinkPrinter, MarkdownDChainUnorderListPrinter, MarkdownUrlUnorderListPrinter, HtmlReflinkPrinter}//Priter子类在这里列出
export {Printer};
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