## 更新日志

### v0.2.0

- 新增：导图模式、预览方格模式、按日期分组模式；
- 新增：（大部分挂件中模式）右键子文档显示操作选项；
- 改进：在一些情况下缓存挂件内目录列表；
- 改进：一些显示效果优化；
- 改进：文档中目录列表属性写入方式；
- 新增：（代码片段）自动插入助手；
- 新增：搜索并高亮挂件内文档标题；
- `config.js`全局设置变更：
  - 移除：完全移除`showEndDocOutline`；
  - 新增：挂件设置批量操作（`overwriteIndependentSettings`等）；
  - 新增：导图模式Markmap配置项`markmapConfig`；
  - 新增：目录列表初始属性`blockInitAttrs`；
  - 新增：缓存配置`loadCacheWhileAutoEnable`、`saveCacheWhileAutoEnable`；


### v0.1.0 (2022-12-28)

- 新增：支持为其他文档、笔记本、所有已打开的笔记本创建子文档目录；[#22](https://github.com/OpaqueGlass/listChildDocs/issues/22)
- 改进：改变文档中自定义emoji插入方式；[#23](https://github.com/OpaqueGlass/listChildDocs/issues/23)
- 新增：（beta）支持从`widgets/custom.js`导入部分设置项；[#24](https://github.com/OpaqueGlass/listChildDocs/issues/24)
- 改进：扩大挂件内子文档链接有效点击区域；[#25](https://github.com/OpaqueGlass/listChildDocs/issues/25)
- 改进：叶子文档大纲转移为挂件独立属性；
- 修复：引用块模式下，`'`未转义的问题；
- 修复：文档中部分情况下分列错误的问题；
- 新增：文档中任务列表模式；【！已知问题：刷新将创建新列表导致任务进度勾选丢失】
- `config.js`文件全局设置变更：
  - 新增：`safeModePlus`检测挂件是否在只读模式下，拦截刷新文档内目录的操作；
  - 停用（移除）：`showEndDocOutline`叶子文档大纲全局设定，此项保留用于设置迁移；
  - 新增：`height_2widget_min` `height_2widget_max`自动高度启用时挂件最小、最大高度；
  - 新增：`backToParent`在子文档列表中加入返回父文档的链接`../`；

### v0.0.9 (2022-11-8)

- 新增：文档中支持有序列表模式；[#17](https://github.com/OpaqueGlass/listChildDocs/issues/17)
  - 支持创建（以全角空格缩进的）多级序号的目录；
- 改进：`默认`模式显示方式（采用`<span>`以解决浏览器、iOS设备`默认`模式无法点击的问题）；[#18](https://github.com/OpaqueGlass/listChildDocs/issues/18)
- 改进：`挂件beta`模式浮窗触发方式跟随思源设置；[#19](https://github.com/OpaqueGlass/listChildDocs/issues/19)
- 重构：`挂件beta`模式移除过时的方法；
- 改进：网络emoji的判定，为[siyuan#5897](https://github.com/siyuan-note/siyuan/issues/5897)做准备；
- 改进：放宽插入挂件时自动刷新限制：如果在挂件内显示目录，允许插入挂件后立刻进行自动刷新；

### v0.0.8 (2022-10-5)

- 修复：在思源v2.2.1+版本出现错误提示Failed to execute 'observe'；[#15](https://github.com/OpaqueGlass/listChildDocs/issues/15)
- 外观：更换按钮图标；[#14](https://github.com/OpaqueGlass/listChildDocs/issues/14)
- 改进：挂件内列出时支持自动更改挂件高度；[#13](https://github.com/OpaqueGlass/listChildDocs/issues/13)
- 新增：挂件内支持有序列表模式；[#17](https://github.com/OpaqueGlass/listChildDocs/issues/17)

### v0.0.7 (2022-9-17)

- 修复：v0.0.6引入的普通emoji插入失败问题（[#11](https://github.com/OpaqueGlass/listChildDocs/issues/11)）；

### v0.0.6 (2022-9-15)

- 修复：文档图标为自定义emoji时无法列出子文档的问题（[#10](https://github.com/OpaqueGlass/listChildDocs/issues/10)）；
- 改进：支持写入自定义emoji图片；
- 改进：执行刷新过程中显示提示词；
- 改进：挂件内字号根据思源编辑器字号设定；

### v0.0.5 (2022-9-6)

- 新增：支持列出所在文档大纲内容（[#8](https://github.com/OpaqueGlass/listChildDocs/issues/8)）；
- 改进：刷新无序列表时重写原无序列表的属性（[#6](https://github.com/OpaqueGlass/listChildDocs/issues/6)）；
- 修复：页签切换时自动刷新在v2.1.11+版本失效（[#5](https://github.com/OpaqueGlass/listChildDocs/issues/5)）；
- 修复：`url`模式下，`<>"&`符号未转义的问题（[#9](https://github.com/OpaqueGlass/listChildDocs/issues/9)）；
- 改进：部分sql查询放宽结果条件（[#7](https://github.com/OpaqueGlass/listChildDocs/issues/7)）；
- 改进：超级块按照首层节点分列时分列的分列逻辑；
- 改进：创建的超级块结构逻辑；

### v0.0.4 (2022-8-30)

- 新增：支持目录列表分列（分栏）（写入文档时生成超级块）（[#2](https://github.com/OpaqueGlass/listChildDocs/issues/2)）；
- 修复：安卓端点击链接后返回，显示前一文档目录的问题（[#3](https://github.com/OpaqueGlass/listChildDocs/issues/3)）；
- 改进：设置项显示方式，设置项支持部分隐藏；
- 改进：`config.js`新增全局设置项：(部分)
  - `emojiEnable`关闭/打开文档emoji-icon写入；
  - `floatWindowEnable`挂件beta模式下悬浮窗展示控制；
  - `showSettingOnStartUp`启动时显示设置项；

### v0.0.3

- 修复：切换深色模式`挂件beta`字体颜色不更改的问题；
- 改进：层级下拉选择框改为输入框（by [Zuoqiu-Yingyi](https://github.com/Zuoqiu-Yingyi)  [PR#1](https://github.com/OpaqueGlass/listChildDocs/pull/1)）；
- 改进：更新时间不再显示日期；
- 修复：`挂件beta`下鼠标悬停时的一些显示问题；


### v0.0.2

- 修复：在重新打开文档后，重复创建块的问题；

### v0.0.1

从这里开始。