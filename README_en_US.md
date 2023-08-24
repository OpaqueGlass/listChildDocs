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