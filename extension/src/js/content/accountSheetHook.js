import Promise from 'bluebird';
import $ from 'jquery';
import SheetHook from './sheetHook.js';
import Constants from '../modules/Constants.js';
import Diag from '../modules/diag.js';
import DomUtil from '../modules/DomUtil.js';

const D = new Diag('AccountSheetHook');

/**
 * Hooks into the Account menu so that new menu items can be added there.
 */
class AccountSheetHook extends SheetHook {
    constructor(pluginHost, plugins, document) {
        super(pluginHost, plugins, document);
    }

    onSmartsheetLoaded() {
        this.initSmartsheetHooks();
    }

    initSmartsheetHooks() {
        $(this.doc).click((e) => {
            // if the click is on a command, it will be dispatched here:
            var handled = this.handleCommandEvent(e);
            if (!handled) {
                // every time something is clicked, it could have closed the account menu. If there is no account menu present, we'll hookup a new query selector:
                if (this.activeAccountMenuListener == null) {
                    // no current listener...
                    let acctMenu = this.getAccountMenuElement()
                    if (acctMenu.length == 0) {
                        // no account menu in DOM:
                        this.setupAccountMenuListener()
                    }
                }
            }
        });
        this.setupAccountMenuListener()
    }

    setupAccountMenuListener() {
        this.activeAccountMenuListener = DomUtil.lazyQuerySelector(this.accountMenuElementSelectorStandard).then(() => {
            this.activeAccountMenuListener = null
            // account menu appeared:
            this.initAccountMenuCommands()
        })
    }

    get accountMenuElementSelectorStandard() {
        return 'div.clsPopupMenu tr[data-client-id="10727"]'
    }

    get accountMenuElementSelectorJQuery() {
        // NOTE: the has: selector is a jquery extension that doesn't work with lazyQuerySelector.
        return 'div.clsPopupMenu:has(tr[data-client-id="10727"])'
    }

    /**
     * Handles and dispatches a command's events and routes them to plugin accordingly.
     * If it handles the event, returns true;
     */
    handleCommandEvent(e) {
        if (e == null || e.target == null)
            return false;
        var target = $(e.target);
        var parent = target.parent();
        var isCommand = parent.hasClass(Constants.commandClassName);
        var eventType = e.type;
        if (eventType == 'click' && isCommand) {
            var pluginId = parent.attr('data-sheetmonkey-pluginid');
            var commandId = parent.attr('data-sheetmonkey-commandid');
            this.dismissAccountMenu();
            D.log('Routing command click to plugin... PluginID:', pluginId, 'CommandID:', commandId);
            this.pluginHost.notifyCommandClicked(pluginId, commandId);
            return true;
        }
        return false
    }

    dismissAccountMenu() {
        // we have to do this as SS won't dismiss it when a plugin menu item is clicked.
        var menu = this.getAccountMenuElement();
        menu.remove();
    }

    getAccountMenuElement() {
        var accountMenu = $(this.accountMenuElementSelectorJQuery);
        return accountMenu;
    }

    initAccountMenuCommands() {
        var signOutMenuItem = $('tr[data-client-id="10727"]');
        if (signOutMenuItem.length == 0) {
            D.warn('initAccountMenuCommands: Smartsheet "Sign Out" menu item NOT found!');
            return;
        }
        var placeHolderElement = null;
        for (var p of this.plugins) {
            for (var c of p.manifest.commands) {
                if (c.kind == Constants.account_menu) {
                    D.log('initializing command ', c);
                    if (placeHolderElement==null) {
                        // no elements inserted yet...
                        placeHolderElement = this.getMenuDivider();
                        signOutMenuItem.after(placeHolderElement);
                        placeHolderElement = placeHolderElement[1];// hack it returns two elements and we want the second one.
                    }
                    var menuItem = this.getMenuElement(p.manifest.id, c.id, c.label);
                    placeHolderElement.after(menuItem);
                    placeHolderElement = menuItem;
                }
            }
        }
        this.initCommandEvents();
    }

    initCommandEvents() {
        $('.' + Constants.commandClassName).hover(
            function() { $(this).addClass('clsListRowHover'); },
            function() { $(this).removeClass('clsListRowHover'); }
        );
    }

    getMenuDivider() {
        var elements = [
            $('<tr id="sheetMonkey_accountMenu_divider"><td colspan="3" class="clsStandardMenuDivider"><div></div></td></tr>'),
            $('<tr class=""><td colspan="3" class="clsStandardMenuText"><div style="color: grey; padding-left: 8px; font-size: 13px; margin-bottom: -8px; margin-top: -6px;">Plugins:</div></td></tr>'),
        ];
        return elements;
    }

    getMenuElement(pluginId, commandId, label) {
        // building via jquery for proper/safe encoding:
        let tr = $('<tr>');
        tr.addClass(Constants.commandClassName);
        tr.attr('id', `sheetMonkey_${pluginId}_${commandId}`);
        tr.attr('data-sheetmonkey-pluginid', pluginId);
        tr.attr('data-sheetmonkey-commandid', commandId);
        let td1 = $('<td style="margin-top:2px; height:16px; padding-left:15px;"></td>');
        let td2 = $('<td style="padding-right:15px; padding-left:0px; white-space:nowrap;" class="clsStandardMenuText"></td>');
        td2.text(label);
        let td3 = $('<td><div style="width:20px;height:20px;padding-right:5px"></div></td>');
        tr.append(td1);
        tr.append(td2);
        tr.append(td3);
        return tr;
    }

    initCommands() {
        this.initAccountMenuCommands()
            .then(() => D.log('initAccountMenuCommands complete.'))
            .catch(e => D.error('initCommands failed: ', e));
    }
}

export default AccountSheetHook;