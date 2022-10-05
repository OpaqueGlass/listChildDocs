## 更新日志

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