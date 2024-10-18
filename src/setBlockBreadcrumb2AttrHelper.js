/**
 * @description 将指定块的面包屑信息设置到属性中
 * @date 2024-10-10
 * @version v0.2
 */
(() => {
    async function __main__(userInpuId) {
        const attributeViewId = await judgeAvId(userInpuId);
        const blockIds = await getBlockIdsFromDatabase(attributeViewId);
        const blocksBreadcrumbInfos = await rearrangeBlocksBreadCrumbAndSetToAttr(blockIds);
    }

    async function judgeAvId(userInputId) {
        const sqlResult = await queryAPI(`SELECT markdown FROM blocks WHERE id = '${userInputId}' and type='av'`);
        if (sqlResult && sqlResult.length > 0) {
            const markdown = sqlResult[0].markdown;
            const match = markdown.match(/data-av-id="([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            } else {
                return userInputId;
            }
        } else {
            return userInputId;
        }
    }

    async function getBlockIdsFromDatabase(attributeViewId) {
        let avResponse = { rows: { values: [] } };
        let page = 1;
        const pageSize = Number.MAX_SAFE_INTEGER;
        let allValues = [];
        let tempAvResponse = null;
        do {
            tempAvResponse = await getAttributeViewPrimaryKeyValues(attributeViewId, page, pageSize);
            if (tempAvResponse && tempAvResponse.rows && tempAvResponse.rows.values && tempAvResponse.rows.values.length > 0) {
                allValues = allValues.concat(tempAvResponse.rows.values);
                page++;
            } else {
                break;
            }
        } while (tempAvResponse.rows.values && tempAvResponse.rows.values.length > 0);

        avResponse.rows.values = allValues;
        if (avResponse == null) {
            throw new Error("获取属性视图失败: " + attributeViewId);
        }
        const existKey = avResponse.rows?.values?.map((value) => value.blockID) || [];
        const result = existKey.filter((key) => key !== null && key !== '');
        console.log(">>>>属性视图中包含的关联块id", result);
        return result;
    }

    async function rearrangeBlocksBreadCrumbAndSetToAttr(blockIds) {
        const blocksBreadcrumbInfos = [];
        const attrs = [];
        console.group("面包屑API原始信息");
        for (let blockId of blockIds) {
            const breadcrumb = await getBlockBreadcrumb(blockId);
            console.log(`>>>>${blockId}的块面包屑信息`, breadcrumb);
            blocksBreadcrumbInfos.push({
                id: blockId,
                breadcrumb: breadcrumb
            });
            attrs.push({
                id: blockId,
                attrs: {
                    "custom-block-breadcrumb": breadcrumbInfoPostProcess(breadcrumb),
                }
            });

        }
        console.groupEnd("面包屑API原始信息");
        console.log("blockAttrs", attrs);
        await batchSetBlockAtrs(attrs);
        return blocksBreadcrumbInfos;
    }

    function breadcrumbInfoPostProcess(blocksBreadcrumbInfo) {
        let result = "";
        blocksBreadcrumbInfo.forEach((blockBreadcrumbInfo) => {
            if (blockBreadcrumbInfo.type === "NodeHeading") {
                result += blockBreadcrumbInfo.name + "/";
            }
        });
        return result;
    }

    async function batchSetBlockAtrs(blockAttrs) {
        let url = "/api/attr/batchSetBlockAttrs";
        let postBody = {
            blockAttrs: blockAttrs,
        };
        let response = await postRequest(postBody, url);
        if (response.code == 0 && response.data != null) {
            return response.data;
        }
        return null;
    }

    async function queryAPI(sqlstmt){
        let url = "/api/query/sql";
        let response = await postRequest({stmt: sqlstmt},url);
        if (response.code == 0 && response.data != null){
            return response.data;
        }
        if (response.msg != "") {
            throw new Error(`SQL ERROR: ${response.msg}`);
        }
        
        return [];
    }


    async function getAttributeViewPrimaryKeyValues(id, page=1, pageSize=32) {
        let url = "/api/av/getAttributeViewPrimaryKeyValues";
        let postBody = {
            id: id,
            page: page,
            pageSize: pageSize
        };
        let response = await postRequest(postBody, url);
        if (response.code == 0 && response.data != null) {
            return response.data;
        }
        return null;
    }

    function getBlockBreadcrumb(blockId, excludeTypes = []) {
        let data = {
            "id": blockId,
            "excludeTypes": excludeTypes
        };
        let url = `/api/block/getBlockBreadcrumb`;
        return getResponseData(postRequest(data, url));
    }

    async function postRequest(data, url) {
        let result;
        await fetch(url, {
            body: JSON.stringify(data),
            method: 'POST',
            headers: {
                "Authorization": "Token " + window.siyuan?.config?.api?.token ?? "",
                "Content-Type": "application/json"
            }
        }).then((response) => {
            result = response.json();
        });
        return result;
    }

    async function getResponseData(promiseResponse) {
        const response = await promiseResponse;
        if (response.code != 0 || response.data == null) {
            return null;
        } else {
            return response.data;
        }
    }
    window["og_test_241010"] = __main__;
    console.log("og_test_成功初始化");
})();