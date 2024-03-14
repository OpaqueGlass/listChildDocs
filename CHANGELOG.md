## 更新日志

### v0.2.7 (2023-3-14)
- 修复：上一版本引入的字号变小的问题；

### v0.2.6 (2023-3-14)

- 改进：移除部分日志，并减少控制台报错提示；
- 移除：旧设置项迁移功能；
- 新增：从挂件的URL参数中读取设置，并作为启动指定设置；从挂件iframe的`data-default-config`中读取默认设置（可被独立设置覆盖）；
- 新增：移除当前独立设置（并跟随全局）；
- 改进：支持显示文档树隐藏文档；

### v0.2.5 (2023-12-10)

- 移除：自`widget/custom.js`导入自定义设置；
  自v0.2.2起，设置项保存位置迁移，自v0.2.5起，不再支持`custom.js`中旧设置的自动迁移；
- 移除：文档id定位日志；

### v0.2.4 (2023-10-21)

- 新增：配置载入和保存（设置项模板）;
- 修复：修复一些已知问题
  - UI：描述错误，自动高度最小值、最大值应当仅填写数字，单位px；
  - BUG：文档内模式：出现错误提示、再次刷新成功后未调整挂件高度；
  - UI：合并模式独立设置与常规设置选项卡；
  - UI：缩小设置项页面，使得设置项更紧凑；
  - BUG：`$`符号在文档内模式应被转义；（原本`$`是想留着渲染成数学公式的，但确实很少人用，也不太支持点击 [参考](https://ld246.com/article/1695998247916)）
  - ENHANCE：导图模式下，针对首层级情况判断是否加入文档标题（如果只有一个首层级，就不加文档标题）；
  - BUG: 按日期分组模式下，自动分列数较少的问题；
  - BUG：右键子文档菜单中新建子文档失败的问题；
  - FEAT：右键点击`../`部分时，将展开对【当前文档】进行修改操作的右键菜单（并非对父文档进行修改）；
  - BUG: 多次按下`Ctrl+F`出现多个搜索对话框；
  - FEAT：右键新建子文档支持连续创建（使用`Ctrl+Enter`）；
    - 直接点击按钮创建：创建并打开；
    - 使用`Ctrl+Enter`保持对话框，可以继续创建或退出；

### v0.2.2.1 (v0.2.3) (2023-9-4)

- 修复：设置排序方式后无法获取文档的问题；

### v0.2.2 (2023-9-3)

> 此版本包括设置页面和设置保存逻辑的更改，可能出现设置项保存后不生效，界面内设置项显示和实际执行的不同等问题，如遇到相关问题请反馈。

- 重构：设置项保存方式和设置项显示方式；**【因此引入一些问题】**
  - 全局、默认设置保存位置迁移到/data/storage/listChildDocs，原custom.js配置将自动迁移一次；
  - 支持挂件内保存默认设置、全局设置；
  - 新增：删除和重置操作：现在可以一键移除所有其他listChildDocs挂件；
- 新增：新文档内模式：创建本地文件夹目录`file://`URL列表；
- 改进：大纲支持选择开始和结束层级；
- 新增：自动分列；
- 改进：”导图“模式部分设置项转为模式独立设置；
- 新增：额外读取/data/storgae/listChildDocs/custom.css，可自定义挂件内样式；

### v0.2.2-beta2 (2023-8-24)

> 此版本包括设置页面和设置保存逻辑的更改，可能出现设置项保存后不生效，界面内设置项显示和实际执行的不同等问题，如遇到相关问题请反馈。
> 
> 此版本包括全局、默认设置项保存位置的更改，custom.js自动迁移将保留2个版本后被移除；

- 重构：设置项保存方式和设置项显示方式；**【因此引入一些问题】**
  - 全局、默认设置保存位置迁移到/data/storage/listChildDocs，原custom.js配置将自动迁移一次；
  - 支持挂件内保存默认设置、全局设置；
  - 新增：删除和重置操作：现在可以一键移除所有其他listChildDocs挂件；
- 新增：新文档内模式：创建本地文件夹目录`file://`URL列表；
- 改进：大纲支持选择开始和结束层级；
- 新增：自动分列；
- 改进：”导图“模式部分设置项转为模式独立设置；
- 新增：额外读取/data/storgae/listChildDocs/custom.css，可自定义挂件内样式；

### v0.2.2-beta1 (2023-7-29)

- 新增：只在鼠标悬停时显示按钮栏；（默认禁用，需修改config.js `mouseoverButtonArea`）
- 改进：出错时避免更改挂件高度；
- 改进：css中emoji字体匹配顺序（`'Twemoji Mozilla', 'Noto Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Segoe UI', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji'`），如果出现黑白Emoji，[请下载安装Twemoji Mozilla字体](https://github.com/mozilla/twemoji-colr/releases)；

### v0.2.1 (2023-6-4)

- 改进：支持设置最大子文档数量；
- 改进：支持设定排序方式；
- 开发：尝试兼容旧版Webview；
- 修复：移动设备时间错误导致块id生成错误的问题；
- 修复：指定目标文档时，获取文档大纲错误的问题；

### v0.2.0 (2023-3-2)

- 新增：导图模式、预览方格模式、按日期分组模式；[#33](https://github.com/OpaqueGlass/listChildDocs/issues/33) [#34](https://github.com/OpaqueGlass/listChildDocs/issues/34)
- 新增：挂件中右键子文档链接显示菜单项（导图模式除外）；
- 改进：在一些情况下缓存挂件内目录列表；[#35](https://github.com/OpaqueGlass/listChildDocs/issues/35)
- 改进：一些显示效果优化；[#32](https://github.com/OpaqueGlass/listChildDocs/issues/32)
- 改进：文档中目录列表属性写入方式；
- 新增：（代码片段）自动插入助手；
- 新增：搜索并高亮挂件内文档标题；
- 改进：Shift / Alt / Ctrl + Click 子文档链接；
- 新增：（代码片段）快速插入子文档列表；
- 修复：v2.7.6+版本，挂件beta模式未显示浮窗；
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