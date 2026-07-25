/**
 * 判断思源是否启用笔记本文档功能
 * @returns 
 */
export function isNotebookDocEnabled() {
    if (window.top.siyuan.config?.fileTree?.boxDocEnabled === undefined) {
        return false;
    }
    return window.top.siyuan.config.fileTree.boxDocEnabled;
}

/**
 * 判断是否为笔记本文档
 * @param path 
 * @param notebookId 
 * @returns 
 */
export function isNotebookDoc(path, notebookId) {
    if (!isNotebookDocEnabled()) {
        return false;
    }
    if (path == null || notebookId == null) {
        return false;
    }
    if (path.substring(1, path.length - 3) === notebookId) {
        return true;
    }
    return false;
}

/**
 * 获取用于获取子文档的文档路径
 * v3.7.3+版本，在启用笔记本文档的情况下，返回的笔记本文档路径为"/xxx.sy"，但笔记本下直接文档仍然使用"/"参数
 * @param fullPath 
 * @param notebookId 
 * @returns 
 */
export function getListDocsByPathAPIFilePath(fullPath, notebookId) {
    if (fullPath == null) {
        return null;
    }
    if (isNotebookDocEnabled() && isNotebookDoc(fullPath, notebookId)) {
        return "/";
    }
    return fullPath;
}