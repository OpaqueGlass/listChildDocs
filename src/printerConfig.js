import {language} from "./config.js";
import allPrinter from "./listChildDocsClass.js"
let modeName = {//key应为数字，且由0递增。这里设置模式对应的名字
    "0": language["default"],
    "1": language["widgetRefLink"],
    "2": language["inUrl"],
    "3": language["inDulChain"],
    
};
let printerList = {//key应为数字，且由0递增。
    "0": allPrinter.HtmlAlinkPrinter,//出错时将重置到此模式
    "1": allPrinter.HtmlReflinkPrinter,//挂件内，伪引用块
    "2": allPrinter.MarkdownUrlUnorderListPrinter,//在文档中写入无序列表 siyuanUrl
    "3": allPrinter.MarkdownDChainUnorderListPrinter,//在文档中写入无序列表 引用块    
};//您可以在./listChildDocsClass.js中自定义输出格式Printer类，export，然后在此列出，并在modeName中起名
export {modeName, printerList};