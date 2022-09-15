## list Child Docs列出子文档

> 当前版本： v0.0.6 修复：文档图标为自定义emoji时无法刷新的问题（支持插入自定义emoji图片，需要到自定义说明中手动启用，并请阅读注意）；改进：增加“执行中”提示；改进：挂件内字号根据思源编辑器字号设定；
>

> 用于思源笔记创建、更新子文档目录列表的挂件，依靠bugs运行。

- 创建当前文档的子文档目录列表；
  - 创建当前文档大纲列表；

- 子文档目录列表形式：
  - 挂件内——`siyuan://`子文档块超链接（安卓端可能无法打开[^3]）；
  - 挂件内——“引用块”（功能测试中）；
  - 文档中——`siyuan://`子文档块超链接；
  - 文档中——引用块（创建双链）；

- 在几种特定情况下自动刷新子文档目录列表：
  - 挂件被加载（例如：点击文档树打开所在文档）[^1]；
  - 点击所在文档页签[^2]；（仅windows）

## 设置项说明

### 界面

![图片](README.assets/setting.png)

![图片](/widgets/listChildDocs/README.assets/setting.png)

1：刷新按钮：单击将刷新子文档列表 ；双击将保存当前设置 ；

2：显示/隐藏设置

> 以下设置项变更后，需要**双击刷新按钮保存设置**，否则下次启动时将丢失更改。

3：自动刷新选项：勾选则启用自动刷新。 

4：子文档目录列表深度/层级选择：（控制是否展示子文档的子文档，展示几层）为1仅列出直接子文档，为0列出当前文档大纲，请输入数字；（过多的层级将导致性能下降）

5：目录列表分栏数（分列数）控制：为1单列，请输入数字；（过多的分栏可能排版效果不佳）

> 当屏幕宽度过窄时（<=768px），挂件内分栏设定将会被忽略，只允许显示1列；

6： 列表写入模式：

- `默认`： （挂件内）`siyuan://`超链接；

- `挂件beta`：（挂件内）展示“引用块”；

- `url`： （文档中）在挂件下方创建无序列表\*展示`siyuan://`超链接；

- `引用块`：（文档中）在挂件下方创建无序列表\*展示引用块；

7：大纲层级：列出大纲时，设定大纲的显示层级数；

> 层级设置为0、并保存设置后，才会显示大纲层级设定（层级数为实际层级，和h1h2无关）

\*注：文档中分栏使用超级块实现。

### 自定义说明

打开`${思源data目录}\widgets\listChildDocs\src\config.js`，设置项说明请参考各配置项旁边的注释。举例：在此文档可以修改：

- 创建挂件时的默认参数（分列数、层级数、模式）`custom_attr`（不要将auto的默认值设定为true）；
- 点击页签刷新生效系统`includeOs`：默认仅用于windows，不适用于ios和Android。其他平台未测试，如要使用，请手动更改；
- 启用/禁用 安全模式`safeMode`：目录列表写入文档时禁用自动刷新，防止不知情时文档被更新（如果使用同步，请勿将`safeMode`设置为`false`[^4]）；
- 启用/禁用 显示（写入）文档图标`emojiEnable`；
- 启用/禁用 刷新列表后重写属性`inheritAttrs`；
- 刷新后属性写入列表对应HTML元素`includeAttrName`；
- 启用/禁用 新的超级块构成方式beta：`superBlockBeta`；
- 启用/禁用 超级块分列（分栏）时在缩进位置折断：`divideColumnAtIndent`；
- 启用/禁用 列出子文档时一并列出终端页面的大纲：`showEndDocOutline`；（影响体验，刷新极慢）
- 启用/禁用 写入自定义emoji图片：`customEmojiEnable`；
- ....其他设置；

### 使用举例

有些主题支持将文档中的无序列表显示为导图/表格。理论上v0.0.5版本可以在刷新后保留相关属性设定，即刷新后仍然展示为导图/表格。

注：分栏（分列）数>1时，不建议更改无序列表视图样式；

> 在此前的版本，刷新目录列表后将丢失自定义属性，现在相关属性将在刷新后重写，并将`custom-f`属性写入对应元素。

## ⚠️注意

> 由于开发者能力所限，挂件还存在以下问题。

- 直接将子文档目录列表写入文档中（模式为`url`、`引用块`）时：
  - 请避免过快地刷新文档列表；
  - 如果要<u>多设备同步文档</u>、且<u>挂件所在文档要写其他内容</u>时，**请勿使用自动刷新**[^4]；
- 每次刷新时，将完全更新列表（即使子文档没有变化，也将更新列表全部内容）；
- 双击刷新按钮会保存设置（设定挂件属性），文档编辑时间将被更新，**如果当时未完成同步，请勿双击刷新按钮**[^4]；
- 如果调整了挂件大小，请双击刷新按钮重新保存设置；
- 点击页签自动刷新的方法有点玄学，可能在未来的版本更新中无法使用；
- 关于超级块属性刷新后重写：
  - `superBlockBeta`应设为`true`；
  - 若刷新后为超级块，属性将写入超级块的所有无序列表子块；
  - 若刷新前为超级块，将随机选择一个无序列表子块的属性进行重写；
  - 如要删除属性，建议直接删除超级块；
- 关于写入自定义emoji图片：
  - 挂件以图片的方式写入的自定义emoji，有一些边距导致对齐效果不好；
  - 请避免图片路径包括特殊符号，例如`()%& `，如果包括，不能确定实际效果;
  - 自定义emoji不再assets下，不是资源文件，会有网络图片角标（设置-编辑器-是否显示网络图片角标）；



## 反馈bug

请到github仓库[新建issue](https://github.com/OpaqueGlass/listChildDocs/issues/new/choose)。

## 参考&感谢

本挂件使用/参考了以下大佬的项目：

| 开发者                                      | 项目                                                     | 开源协议                                                     | 备注                 |
| ------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | -------------------- |
| [leolee9086](https://github.com/leolee9086) | [cc-template](https://github.com/leolee9086/cc-template) | [木兰宽松许可证， 第2版](https://github.com/leolee9086/cc-template/blob/main/LICENSE) | 在挂件中展示“引用块“ |
| [InEase](https://github.com/InEase)         | [Note Map](https://github.com/InEase/SiYuan-Xmind)       | N/A                                                          | API使用方式          |

以下大佬参与代码贡献：

| 开发者                                            | PR                                                           |
| ------------------------------------------------- | ------------------------------------------------------------ |
| [Zuoqiu-Yingyi](https://github.com/Zuoqiu-Yingyi) | [文档深度下拉框改为输入框PR#1](https://github.com/OpaqueGlass/listChildDocs/pull/1) |



### 依赖

1. jQuery （本项目中通过jQuery选择页面元素）；

```
 * jQuery JavaScript Library v3.6.0
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
```

[^1]: 例外：安全模式下，写入文档时（模式为`url`或`引用块`），将不会自动刷新。
[^2]: 通过监视页签变化获取当前文档是否更新，默认仅在windows启用，不支持ios、android系统。例外：安全模式下，写入文档时（模式为`url`或`引用块`），将不会自动刷新。
[^3]: 请等待[此issue(#3716)](https://github.com/siyuan-note/siyuan/issues/3716)完成。
[^4]: 当挂件更新文档内的目录列表（或保存设置）后，当前设备文档编辑时间将更新。如果当前设备未同步，则新文档会覆盖云端内容，导致其他设备的编辑丢失。目前，在写入挂件时（模式为`默认`或`挂件beta`），自动刷新不更改文档内容，理论上不会影响文档编辑时间。
