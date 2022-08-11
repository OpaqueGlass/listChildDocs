
class Printer{
    //对齐、缩进
    align(nowDepth){
        return text;
    }
    //在下一层级子文档列出之前
    beforeChildDocs(){
        return text;
    }
    //在下一层级子文档列出之后
    afterChildDocs(){
        return text;
    }
    //输出当前文档链接
    oneDocLink(doc){
        return text;
    }
}
class HtmlAlinkPrinter extends Printer{
    align(nowDepth){
        return "";
    }
    beforeChildDocs(){
        return "<ul>";
    }
    afterChildDocs(){
        return "</ul>";
    }
    oneDocLink( doc){
        return `<li class="linksListItem"><a class='childDocLinks' href="siyuan://blocks/${doc.id}">${doc.name.replace(".sy", "")}</a></li>`;
    }
}
class MarkdownUnorderListPrinter extends Printer{
    //对齐、缩进
    align(nowDepth){
        let spaces = "";
        for (let i = 0; i < (nowDepth - 1); i++){
            spaces += "  ";
        }
        return spaces;
    }
    beforeChildDocs(){
        return "";
    }
    afterChildDocs(){
        return "";
    }
    oneDocLink(doc){
        let docName = doc.name;
        if (doc.name.indexOf(".sy") >= 0){
            docName = docName.substring(0, docName.length - 3);
        }
        return `- [${docName}](siyuan://blocks/${doc.id})\n`;
    }
}
export default {Printer, HtmlAlinkPrinter, MarkdownUnorderListPrinter}