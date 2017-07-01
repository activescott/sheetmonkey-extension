SheetMonkey
======
**SheetMonkey** is an experimental browser extension for Google Chrome that enables plugins to extend [Smartsheet](https://www.smartsheet.com/) in a modular fashion without DOM hacks.

**Disclaimer:** This project is not endorsed, certified, or supported by [Smartsheet](https://www.smartsheet.com/). This is merely an experiment I'm playing around with.


## Installation ##
For now you have to compile it (see below).

## Usage ##
After you install the plugin, go to the Options page for the plugin (find SheetMonkey in [chrome://extensions/](chrome://extensions/) and click *Options*) and enter the URL for your favorite plugin's manifest (such as http://localhost:8100/ssfjmanifest.json).
Don't have a plugin? See Creating Plugins below!


## Compiling & Debugging ##
1. Go to the root and run `npm install` (or `yarn`) to install dependencies.
2. Run `./extension/dev.sh` to build it in development mode. It will build and put output in `/build/dev` (using webpack watch to keep the js up to date).
3. Visit [chrome://extensions/](chrome://extensions/), ensure *Developer mode* is checked and use *Load unpacked extension* to load the extension from `./build/dev`.


## Creating Plugins ##
Plugins consist of a JSON manifest and JavaScript hosted in the same directory.

### Capabilities ###
Plugins can expose the following capabilities: 

* Account Menu Commands: Allows your plugin to add a menu item to the *Account* menu in Smartsheet and respond to clicks.
* FUTURE:
    * Sheet Menu Commands...
    * Row Menu Commands...
    * Column Menu Commands...
    * Card Menu Commands...
    * Dynamically updating menu commands (their label for localization, visibility, enabled status, etc.)
    * Column Indicators
    * Make it easier for a command to auth & call the Smartsheet API.
    * Custom cell renderers (via formulas functions)
        * Markdown, sparklines, etc.
    * Keyboard shortcuts

### Manifest Format ###
Below is a commented manifest (note comments aren't allowed in the actual JSON though).
All URLS in manifest and scripts must be relative to the plugin's manifest.

    {
        "id": "smartsheetforjira", // A unique ID for the plugin.
        "scripts": ["js/ssfj.js"], // One or more JavaScript files to load. Generally just a script for your plugin or module loader such as require.js and other dependencies such as jQuery.
        "commands": [
            {
                "kind": "account_menu",                      // Puts this one on the "Account" menu. Future: sheet_menu, row_menu, col_menu, etc.
                "id": "launchwindow",                        // A unique ID for this command
                "label": "Smartsheet for JIRA"               // A label to be displayed to the user for the command. (FUTURE: could be refreshed with JS dynamically in the future (based on ))
            }
        ]
    }

### Scripts ###
Your scripts are just plain JavaScript that will run in a sandboxed frame. 
You initialize your plugin by calling `SheetMonkeyHost.init` and passing in the pluginId (must be the same one found in your manifest) and a commandHandler to receive events about your commands.

See [sheetmonkey-plugins](https://github.com/activescott/sheetmonkey-plugins) for examples.

## TODO ##
See TODO.md

## License 
* See [LICENSE](https://github.com/activescott/sheetmonkey/blob/master/LICENSE.md) file.

## Contributors ##
* [Contributors](https://github.com/activescott/sheetmonkey/graphs/contributors)

## Thanks ##
Big thanks to all the modules used (see package.json) and especially to Salsita's [chrome-extension-skeleton project](https://github.com/salsita/chrome-extension-skeleton).