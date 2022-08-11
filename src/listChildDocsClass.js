
class Printer{
    //对齐、缩进
    align(text, nowDepth){
        return text;
    }
    beforeChildDocs(text){
        return text;
    }
    afterChildDocs(text){
        return text;
    }
    oneDocLink(text, doc){
        return text;
    }
}
class HtmlAlinkPrinter extends Printer{
    align(text, nowDepth){
        return text;
    }
    beforeChildDocs(text){
        text += "`<ul>`";
        return text;
    }
    afterChildDocs(text){
        text += "`</ul>`";
        return text;
    }
    oneDocLink(text, doc){
        text += `<li class="linksListItem"><a class='childDocLinks' href="siyuan://blocks/${doc.id}">${doc.name.replace(".sy", "")}</a></li>`;
        return text;
    }
}
class MarkdownUnorderListPrinter extends Printer{
    //对齐、缩进
    align(text, nowDepth){
        let spaces = "";
        for (let i = 0; i < (nowDepth - 1); i++){
            spaces += "  ";
        }
        return text + spaces;
    }
    beforeChildDocs(text){
        return text;
    }
    afterChildDocs(text){
        return text;
    }
    oneDocLink(text, doc){
        text += `- [${docName}](siyuan://blocks/${doc.id})\n`;
        return text;
    }
}
export default {Printer, HtmlAlinkPrinter, MarkdownUnorderListPrinter}