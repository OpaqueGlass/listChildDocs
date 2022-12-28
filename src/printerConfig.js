import allPrinter from "./listChildDocsClass.js"
// 模式设置，挂件内将依次显示以下模式：
let printerList = [
    allPrinter.DefaultPrinter,//0默认：出错时将重置到此模式 // 可以调换顺序，但请不要移除默认模式
    allPrinter.HtmlReflinkPrinter,//1挂件内，伪引用块
    allPrinter.MarkdownUrlUnorderListPrinter,//2在文档中写入无序列表 siyuanUrl
    allPrinter.MarkdownDChainUnorderListPrinter,//3在文档中写入无序列表 引用块 
    allPrinter.MarkdownUrlOrderListPrinter,//6在文档中写入有序列表 siyuanUrl
    allPrinter.MarkdownDChainOrderListPrinter,//7在文档中写入有序列表 引用块
    allPrinter.MarkdownUrlStandardOrderListPrinter,//8文档中1.2.2.类型有序列表
    allPrinter.HtmlReflinkOrderPrinter, //4挂件内，有序列表伪引用块
    allPrinter.HtmlDefaultOrderPrinter, //5挂件内，有序列表<a>
    allPrinter.MarkdownTodoListPrinter, //9todo列表 存在问题：刷新导致任务打钩丢失
    
];//您可以在./listChildDocsClass.js中自定义输出格式Printer类，export，然后在此列出，并在config.js中为模式命名

export { printerList };