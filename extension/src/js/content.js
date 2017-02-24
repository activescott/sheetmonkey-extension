import Promise from 'bluebird';
import $ from 'jquery';
import msg from './modules/msg';
import handlers from './modules/contenthandlers.js'

console.log('SheetMonkey content script loaded.'); // eslint-disable-line no-console
const messenger = msg.init('ct', handlers.create('content'));

//FIXME: Use a module and create a singleton
const sheetMonkeyGlobals = {}
const sheetMonkeyPlugins = [
    {
        id: 'ssfj',
        commands: [
            {
                kind: 'account_menu',
                id: 'launchwindow',
                label: 'Smartsheet for JIRA'
            }
        ]
    }
];

function getAccountMenuElement() {
    var accountMenu = $('div.clsPopupMenu:has(tr[data-client-id="10727"])');
    return accountMenu
}

/**
 * Returns (via callback) true if the account menu commands should be injected/initialized.
 */
function shouldInitAccountMenuCommands() {
    //delay 500ms to give the account menu a chance to get into the DOM
    return Promise.delay(500).then(function() {
        var shouldInit = false;
        // get the account menu table:
        var accountMenu = getAccountMenuElement();
        if (accountMenu.length > 0) {
            // does the account menu already have plugins:
            var foundCommands = accountMenu.has('.sheetMonkeyCommand');
            //if (foundCommands.length > 0) console.log('Account menu already has SheetMonkey commands.');
            shouldInit = foundCommands.length == 0;
        }
        else {
            console.log('Account menu not found.');
            shouldInit = false;
        }
        return shouldInit;
    });
}

function initAccountMenuCommands() {
    return shouldInitAccountMenuCommands().then(shouldInit => {
        if (!shouldInit) {
            return
        }
        var signOutMenuItem = $('tr[data-client-id="10727"]');
        if (signOutMenuItem.length == 0) {
            console.warn('initAccountMenuCommands: Smartsheet "Sign Out" menu item NOT found!');
            return;
        }
        var placeHolderElement = null;
        for (var p of sheetMonkeyPlugins) {
            for (var c of p.commands) {
                //FIXME: constants module!
                if (c.kind == 'account_menu') {
                    console.log('initAccountMenuCommands: found command ', c);
                    if (placeHolderElement==null) {
                        // no elements inserted yet...
                        placeHolderElement = getMenuDivider();
                        signOutMenuItem.after(placeHolderElement);
                        placeHolderElement = placeHolderElement[1];// hack it returns two elements and we want the second one.
                    }
                    var menuItem = getMenuElement(p.id, c.id, c.label);
                    placeHolderElement.after(menuItem);
                    placeHolderElement = menuItem;
                }
            }
        }
        initCommandEvents();
    });
}

function initCommandEvents() {
    $('.sheetMonkeyCommand').hover(
        function() { $(this).addClass('clsListRowHover'); },
        function() { $(this).removeClass('clsListRowHover'); }
    );
}

function getMenuDivider() {
    var elements = [
        $('<tr id="sheetMonkey_accountMenu_divider"><td colspan="3" class="clsStandardMenuDivider"><div></div></td></tr>'),
        $('<tr class=""><td colspan="3" class="clsStandardMenuText"><div style="color: grey; padding-left: 8px; font-size: 13px; margin-bottom: -8px; margin-top: -6px;">Plugins:</div></td></tr>'),
    ]
    return elements;
}

function getMenuElement(pluginId, commandId, label) {
    var template = `<tr id="sheetMonkey_${pluginId}_${commandId}" data-sheetmonkey-pluginid="${pluginId}" data-sheetmonkey-commandId="${commandId}" class="sheetMonkeyCommand"><td style="margin-top:2px; height:16px; padding-left:15px;"></td><td style="padding-right:15px; padding-left:0px; white-space:nowrap;" class="clsStandardMenuText">${label}</td><td><div style="width:20px;height:20px;padding-right:5px"></div></td></tr>`
    return $(template);
}

function handleCommandEvents(e) {
    if (e == null || e.target == null)
        return;
    //FIXME: Constants module!
    var target = $(e.target);
    var parent = target.parent();
    var isCommand = parent.hasClass('sheetMonkeyCommand');
    var eventType = e.type;
    if (eventType == 'click' && isCommand) {
        var pluginID = parent.attr('data-sheetmonkey-pluginid');
        var commandID = parent.attr('data-sheetmonkey-commandid');
        console.log('TODO! Route command click to plugin! PluginID:', pluginID, 'CommandID:', commandID);
        dismissAccountMenu();
    }
}

function dismissAccountMenu() {
    // we have to do this as SS won't dismiss it when a plugin menu item is clicked.
    var menu = getAccountMenuElement();
    menu.remove();
}

function initPlugins() {
    var p1 = initAccountMenuCommands();
    Promise.all(p1)
        .then( () => console.log('initPlugins complete.') )
        .catch( e => console.error('initPlugins failed: ', e));
}

function setupHandlers() {
    $(document).click(function(e) {
        // every time something is clicked, we'll init plugins. We have to wait because menus don't exist in dom until a click.
        initPlugins();
        // Watch for command clicks and will route them to plugin accordingly...
        handleCommandEvents(e);
    });
}

function hostPlugin() {
    //http://localhost:8000/ssfjmanifest.json
    /**
     * - load plugin URLs from background task - send a message and get back json
     * - For each plugin:
     *  - Get script urls
     *  - Create a sandboxed iframe element
     *      - Attributes:
     *          - Add SheetMonkeyPluginHost class
     *          - Add data-sheetmonkey-pluginid=...
     *      - inject html/doc into iframe doc that includes:
     *          - SheetMonkeyHost js
     *          - JS module from the manifest's specified script
     *          - 
     *          
     *  - Start posting messages frame to route events to plugin:
     *      - Find frame for plugin.
     *      - postMessage
     * 
     * - SheetMonkeyHost TODO:
     *  - Needs to be able to respond to postmessages coming into the iframe and route them to plugin's handler as specified in manifest.
     *  - Content script needs to know how to 
     */
}

$( () => {
    // FIXME: wait a few seconds for the app to load. We need to find an event or element we can wait for to trigger initializing.
    console.log('dom loaded, now waiting to initialize plugins...');
    setupHandlers();
});


