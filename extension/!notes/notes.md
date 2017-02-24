Account Menu: 


"Personal Settings..." Menu Item:
    Selector:
        #foid\3a 24 > div > table > tbody > tr:nth-child(5)
    XPath:
        //*[@id="foid:24"]/div/table/tbody/tr[5]
    Full Selector:
        html > body.clsBody > div#SDN.clsDesktopHome > div#foid:24 > div.clsPopupMenu.clsMediumDropShadow > table > tbody > tr
    Outer HTML:
        <tr data-client-id="10723" class=""><td style="margin-top:2px; height:16px; padding-left:15px;"></td><td style="padding-right:15px; padding-left:0px; white-space:nowrap;" class="clsStandardMenuText">Personal Settings...</td><td><div style="width:20px;height:20px;padding-right:5px"></div></td></tr>
    Notes:
        * The "24" in div#foid:24 isn't consistent from instance to instance of the app.
        * The data-client-id="10723" is.
        * Similarly, the Sign Out menu item is "data-client-id="10727" and is also consistent.



=======

# Plugin Manifest #
Every plugin must provide a manifest and one or more JS files that should be loaded.
NOTE: All URLS in manifest and scripts must be relative to the plugin's manifest.

## Manifest ##

    {
        "id": "my_unique_id_for_this_plugin",                // A unique ID for the plugin.
        "scripts": ["scripts/require.js", "scripts/app.js"], // One or more JavaScript files to load. Generally an app and a module loader dependency such as require.js
        "commands": [
            {
                "kind": "account_menu",                      // Puts this one on the "Account" menu. Future: sheet_menu, row_menu, col_menu, etc.
                "id": "launchwindow",                        // A unique ID for this command
                "label": "Smartsheet for JIRA"               // A label to be displayed to the user for the command. (FUTURE: could be refreshed with JS dynamically in the future (based on ))
            }
        ]
    }


## Scripts ##
Scripts will be loaded into the browser along with Smartsheet but will be in a sandboxed iframe. 
Scripts will have access to the global variable `SheetMonkeyHost` that provides an API as described below.

# SheetMonkeyHost API #
* init(pluginInfo) - Must be called to initialize the plugin. See example below.
* openWindow       - Displays a window of html to user. Provide the RELATIVE url.
* toast            - Displays a toast message to the user with text.

# How Plugins Register Client-Side Event Handlers in Client #
* Each plugin registers a single client-side module to be loaded as JS.
* Module Boilerplate/Example:

    // boilerplate:
    SheetMonkeyHost.init(
        {
            commandHandler: myCommandHandler
        }
    );
    function myCommandHandler(cmdInfo) {
        console.log(cmdInfo.eventType);
        console.log(cmdInfo.pluginId);
        console.log(cmdInfo.commandId);
    }

