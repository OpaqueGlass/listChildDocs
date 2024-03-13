## 开发指引

### 代码结构

此项目是💩山代码，大体上，挂件整体逻辑位于`listChildDocsMainV2`，`ConfigManager`包括设置项的保存和读取策略，`config.js`为历史遗留；

#### 常见操作说明

##### 添加新的独立设置项

1. 为设置项选择一个新的key，请参考`ConfigManager.js`中的ConfigSaveManager、defaultConfig；并在此处设置默认值；
2. 界面UI使用layUi，因此，要在界面上显示设置项，请仿照index.html中的相关按钮设置复制一个，注意修改其中的name和id（如果有）；
3. 在代码中访问，可使用`g_allData["config"][settingKey]`；


##### 添加新模式

请参考`listChildDocsClass.js`，继承`Printer`类；

### 使用lcd

直接使用iframe嵌入，例：

```
result.innerHTML = `<iframe src="/widgets/listChildDocs" data-subtype="widget" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: ${(window.screen.availWidth - 75) > 350 ? 350 : (window.screen.availWidth - 75)}px;" data-doc-id="${basicInfo.currentDocId}"></iframe>`;
```

#### 引入默认设置

在frameElement上加上属性`data-default-config`，例：（请注意转义，或直接使用`dataset.defaultConfig`
```
data-default-config="{&quot;printMode&quot;:11}"
```

#### 强制指定设置

在src中指定参数，例
```
/widgets/listChildDocs?printMode=11
```