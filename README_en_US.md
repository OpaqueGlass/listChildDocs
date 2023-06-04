> [Translating...] This document was translated by Google Translate.

> A widget for creating and updating sub-document directory lists in Siyuan Notes.

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

- Double-click the refresh button to save the settings;
- When the mouse hovers over the input area of the button or setting item, a prompt will be displayed;
- About the mode: You can switch to the corresponding mode and click Refresh to try it out;
- It is recommended to read the `Attention` section below;
- common problem:
   - The directory list in the document cannot be refreshed automatically?
     The safe mode is enabled by default, please confirm that you do not use the synchronization, you can turn off the safe mode;