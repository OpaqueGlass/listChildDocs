> [Translating...] This document was translated by Google Translate.

> A widget for creating and updating sub-document directory lists in Siyuan Notes.

> Sorry, this widget has limited support for English.

- Create a subdocument directory listing of the current document;
   - create the current document outline list (level set to `0`);

- Subdocument directory listing form (selected in `mode`):
   - Create a directory in the widget or in the document;
   - ordered or unordered list;
   - (in the document) `siyuan://` URL or quote block;
   - (in the widget) Markmap map;
  
- Automatically refresh subdocument directory listings in several specific cases (do not refresh directory in document in safe mode):\*
   - The widget is loaded (for example: click on the document tree to open the document);
   - Click the document tab; (default only for windows)


### Quick Start

- Double-click refresh button: Save settings；
- Hover over the "i" icon next to buttons or settings items to display tooltips.
- About modes: You can switch to the corresponding mode and then click refresh to give it a try.
- It is recommended to read the "Note" section below.()
- Frequently Asked Questions:
  - Why doesn't the directory list in the document automatically refresh?

    The safe mode is enabled by default. Please make sure that after disabling synchronization, you can also turn off the secure mode.
- Shortcuts (When focus is on widget)
  - `Ctrl+S` Show or hide setting panel.
  - `F5` Refresh
  - `Ctrl+F` Show or hide search dialog.


### Custom Description

After the v0.2.2 version, the way the widget saves the setting items has been modified. The widget will save the data to `${siyuan_workspace}/data/storage/listChildDocs` folder by default.

The data under this folder includes:

- `data` folder, which saves the widget settings for the document. Generally speaking, the listChildDocs inserted by the plugin will create a configuration file for the document;
- `schema` folder, the default template configuration, currently invalid;
   - `default.json` default settings when plug-in is inserted;
- `global.json` is the global configuration file, which needs to be created after manually saving the global settings;
- `custom.css` custom style file, not automatically created;

#### Default and global settings

If it is the first time to upgrade to v0.2.2 and above, please manually save the default settings and global settings in the widget. (Theoretically, the widget will migrate the settings saved in the original `custom.js` once when it is loaded for the first time.)

After saving, you can open `workspace/data/storage/listChildDocs/global.json` to manually make changes to the configuration;

For the allowed configuration items, please refer to `defaultGlobalConfig` in `Pendant location/src/ConfigManager.js`. You can also directly change this file, but if it is different from global.json, global.json will prevail.

#### Custom Styles

If you are not satisfied with the default style of the widget, you can modify it by yourself and save the CSS in the `workspace/data/storage/listChildDocs/custom.css` file.

### Note

> Due to the limited ability of developers, the widget also has the following problems. Must read before use.

- When directly writing a subdocument directory listing **into a document**:`
   - Please avoid refreshing the document list too quickly;
   - If you want to <u>multi-device sync document</u>, and <u>the document where the widget is located needs to write other content</u>, **do not use auto-refresh**[^1];
- Every time you refresh, the list will be fully updated (even if the subdocument has not changed, the entire content of the list will be updated);
- **If the synchronization is not completed, please do not click the refresh button** (refresh on the old document before multi-terminal synchronization may cause synchronization overwrite)[^1]:
   - Clicking the refresh button will update the directory list in the document or update the widget directory list cache, and the document editing time will be updated;
   - Double-clicking the refresh button will save the settings (set widget properties), and the document editing time will be updated;
- The method of automatic refresh when switching tabs is a bit metaphysical, and may not be available in future version updates;
- About rewriting after super block attribute refresh:
   - `superBlockBeta` should be set to `true` (already set it in default);
   - If it is a super block after refreshing, the attribute will be written into the direct unordered list sub-block of the super block and the super block itself;
   - If it is a super block before refreshing, it will randomly inherit the attributes of an unordered list sub-block;
   - If you want to delete the attribute, it is recommended to directly delete the super block and reset it;
- About writing custom emoji pictures:
   - Please avoid including special symbols in the image path, such as `()%&`, if included, the actual effect cannot be determined;
   - Internet emoji is not supported for now;


## Reference & Thanks

This widget uses/references the following projects:

| Developer | Project | Open Source Agreement | Detail |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------- |
| [leolee9086](https://github.com/leolee9086) | [cc-template](https://github.com/leolee9086/cc-template) | [Mulan Permissive License, Version 2](https://github.com/leolee9086/cc-template/blob/main/LICENSE) | Display the "reference block" in the widget |
| [InEase](https://github.com/InEase) | [Note Map](https://github.com/InEase/SiYuan-Xmind) | N/A | API Usage |
| [Zuoqiu-Yingyi](https://github.com/Zuoqiu-Yingyi) | [widget-query](https://github.com/Zuoqiu-Yingyi/widget-query) | AGPL-3.0 | From custom. js import custom settings |
| | [Trilium](https://github.com/zadam/trilium) / note-list-widget | | Preview grid mode css style, and functional design |

The following developer participated in code contributions:

- [Zuoqiu-Yingyi](https://github.com/Zuoqiu-Yingyi);

(For details, see [Contributor (Developer) List](https://github.com/OpaqueGlass/listChildDocs/graphs/contributors))


### Dependencies

1. [jQuery](https://jquery.com/) (In this project, page elements are selected through jQuery);

```
jQuery JavaScript Library v3.6.0 https://jquery.com/
Copyright OpenJS Foundation and other contributors
Released under the MIT license https://jquery.org/license
```

2. [markmap](https://markmap.js.org/);

```
markmap-lib v0.14.3 | MIT License
markmap-view v0.14.3 | MIT License
https://github.com/markmap/markmap
https://markmap.js.org/
```

3. [d3.js](https://d3js.org);

```
BSD-3-Clause https://opensource.org/licenses/BSD-3-Clause
https://d3js.org v6.7.0 Copyright 2021 Mike Bostock
```

4. [day.js](https://day.js.org/);

```
Day.js is licensed under a MIT License.
https://github.com/iamkun/dayjs/
https://day.js.org/
```

5. [artDialog](https://github.com/aui/artDialog);

```
Free and open source, based on the LGPL-3.0 license.
https://github.com/aui/artDialog
aui.github.io/artDialog/
```

6. [layui](https://gitee.com/layui/layui)

```
Layui is released under the MIT license. 
For other relevant agreements, please refer to the "Disclaimer"
https://gitee.com/layui/layui/blob/main/DISCLAIMER.md.
```

7. [Sortable.js](https://github.com/SortableJS/Sortable)

```
https://github.com/SortableJS/Sortable
MIT LICENSE
```

### icon

1. [Refresh button icon](https://www.iconfinder.com/icons/5402417/refresh_rotate_sync_update_reload_repeat_icon), author: [amoghdesign](https://www.iconfinder.com/amoghdesign), license agreement: [CC3.0 BY-NC](http://creativecommons.org/licenses/by-nc/3.0/);

2. [Setting button icon](https://lucide.dev/?search=setting), [Lucide](https://github.com/lucide-icons/lucide), [ISC License](https://lucide.dev/license);

3. [Search button icon](https://lucide.dev/?search=search), [Lucide](https://github.com/lucide-icons/lucide), [ISC License](https://lucide.dev/license).

[^1]: Clicking the refresh button will update the directory list, directory cache or save settings in the widget, and the current device document editing time will also be updated. If the current device is not synced, the current device's "old" documents will overwrite the cloud content, causing edits from other devices to be lost.