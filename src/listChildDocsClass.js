import {setting} from './config.js';
import {getUpdateString, generateBlockId} from "./API.js";
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

    /**
     * 分栏操作
     * 如果不需要实现，请直接返回初始值
     * (挂件内分栏通过css实现，请直接返回初始值)
     * @params {string} originalText 初始值
     * @params {int} nColumns 列数
     * @params {int} nDepth 文档列出层级/深度
     * @returns 分栏后的初始值
     */
    splitColumns(originalText, nColumns, nDepth){return originalText;}
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
    splitColumns(originalText, nColumns, nDepth){
        return generateSuperBlock(originalText, nColumns, nDepth);
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
        return `- ${emojiIconHandler(doc.icon, doc.subFileCount != 0)}((${doc.id} '${docName}'))\n`;
    }
    noneString(emptyText){
        return "* " + emptyText;
    }
    splitColumns(originalText, nColumns, nDepth){
        return generateSuperBlock(originalText, nColumns, nDepth);
    }
} 

/**
 * 接受并处理icon16进制字符串为Unicode字符串
 * @param {*} iconString 形如ffff-ffff-ffff-ffff 或 来自 files[x].icon
 * @param {*} hasChild 有无子文档
 * @returns 
 */
let emojiIconHandler = function(iconString, hasChild = false){
    if (!setting.emojiEnable) return "";//禁用emoji时
    if (iconString == "")return hasChild?"📑":"📄";//无icon默认值
    let result = "";
    iconString.split("-").forEach(element => {
        result += String.fromCodePoint("0x"+element);
    });
    return result;
}


/**
 * 用于根据nColumns分列数生成超级块（单行！）
 * @param {string} originalText 原始文本
 * @param {int} nColumns 文档分列数
 * @param {int} nDepth 文档列出深度
 * @returns 超级块Markdown文本
 */
function generateSuperBlock(originalText, nColumns, nDepth){
    if (nColumns <= 1) return originalText;
    //定位合适的划分点
    let regex = /^- .*/gm;//首层级
    let allBulletsRegex = /^ *- .*/gm;//所有行
    let firstBullets = originalText.match(regex);//一层级
    let allBullets = originalText.match(allBulletsRegex);//所有行
    let divideIndex = new Array(firstBullets.length);//list划分位置（仅首层行）
    let divideAllIndex = new Array(allBullets.length);//list划分位置（所有行）
    let firstBulletIndex = new Array(firstBullets.length);//所有行中，是首层行下标
    let cIsFirstBullet = 0;
    //1层级无序列表下标
    for (let i = 0; i < divideIndex.length; i++){
        divideIndex[i] = originalText.indexOf(firstBullets[i]);
    }
    //所有层级无序列表下标
    for (let i = 0; i < divideAllIndex.length; i++){
        divideAllIndex[i] = originalText.indexOf(allBullets[i]);
        if (firstBullets.indexOf(allBullets[i]) != -1){
            firstBulletIndex[cIsFirstBullet++] = i;
        }
    }
    let result = originalText;
    let splitInterval = Math.floor(firstBullets.length / nColumns);//仅计算首行，分列间隔
    let splitIntervalRef = Math.floor(allBullets.length / nColumns);//算上所有行，分列间隔
    if ((allBullets.length / nColumns).toString().match(/\./) != null){//均匀排布
        splitIntervalRef++;
    }
    if ((firstBullets.length / nColumns).toString().match(/\./) != null){//均匀排布
        splitInterval++;
    }
    if (splitInterval <= 0) splitInterval = 1;
    // let newColumnDivideStr = "}}}\n{{{row\n";//分栏字符串
    //TODO: 函数返回随机id，并作为分隔符的一部分
    // if (setting.superBlockBeta){////回来搞成一个函数返回随机数吧
    //     newColumnDivideStr = "{: id=\"20220903164645-opaqueg\" updated=\"20220903164701\"}\n\n";
    // }
    if (setting.divideColumnAtIndent){
        //缩进中折列 Mode1
        // for (let i = allBullets.length - splitIntervalRef, cColumn = 0; i > 0 && cColumn < nColumns - 1;
        //     i -= splitIntervalRef, cColumn++){
        for (let i = splitIntervalRef, cColumn = 0; i < allBullets.length && cColumn < nColumns - 1;
            i += splitIntervalRef, cColumn++){
            // if (i == splitIntervalRef) i+= Math.floor(splitIntervalRef * 0.1 + 1);
            let splitAtIndex = result.indexOf(allBullets[i]);
            if (firstBulletIndex.indexOf(i) == -1){//在缩进中截断折列
                //console.log("判定层级数",result.slice(splitAtIndex).match(/ */)[0].length);
                let continueIndentStr = "";//补偿缩进
                for (let j = 0; j < result.slice(splitAtIndex).match(/ */)[0].length / 2; j++){
                    continueIndentStr += "  ".repeat(j) + `- ${setting.divideIndentWord}\n`;
                }
                //可以尝试加入原文档
                result = result.slice(0, splitAtIndex) + `${getDivider()}${continueIndentStr}` + result.slice(splitAtIndex);
            }else{
                result = result.slice(0, splitAtIndex) + `${getDivider()}` + result.slice(splitAtIndex);
            }
        }
    }else{
        //禁用缩进中截断Mode2（依据首层折断）
        for (let i = splitInterval, cColumn = 0;
            i < firstBullets.length && cColumn < nColumns - 1;
            i += splitInterval, cColumn++){
            let splitAtIndex = result.indexOf(firstBullets[i]);
            // result = result.slice(0, splitAtIndex) + "}}}\n{{{row\n" + result.slice(splitAtIndex);
            result = result.slice(0, splitAtIndex) + `${getDivider()}` + result.slice(splitAtIndex);
        }
    }
    if (setting.superBlockBeta){
        result = "{{{col\n" + result + getDivider() +  "}}}\n";//超级块写入测试模式
    }else{
        result = "{{{col\n{{{row\n" + result + "}}}\n}}}\n";
    }
    
    console.log(result);
    return result;
    //生成kramdown类型的块分隔（？）
    function getDivider(){
        if (setting.superBlockBeta){
            return `{: id=\"${generateBlockId()}\" updated=\"${getUpdateString()}\"}\n\n`;
        }else{
            return "}}}\n{{{row\n";
        }
        
    }
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