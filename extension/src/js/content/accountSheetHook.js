import Promise from 'bluebird';
import $ from 'jquery';
import SheetHook from './sheetHook.js';
import Constants from '../modules/Constants.js';
import Diag from '../modules/diag.js';

const D = new Diag('AccountSheetHook');

class AccountSheetHook extends SheetHook {
    constructor(pluginHost, plugins, document) {
        super(pluginHost, plugins, document);
    }

    onSmartsheetLoaded() {
        D.log('AccountSheetHook.onSmartsheetLoaded');
        this.initSmartsheetHooks();
    }

    initSmartsheetHooks() {
        $(this.doc).click((e) => {
            // if the click is on a command, it will be dispatched here:
            var handled = this.handleCommandEvent(e);
            if (!handled) {
                // every time something is clicked, we'll attempt to init commands. We have to wait because menus don't exist in dom until a click.
                this.initCommands();
            }
        });
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
        var accountMenu = $('div.clsPopupMenu:has(tr[data-client-id="10727"])');
        return accountMenu;
    }

    /**
     * Returns Promise<Boolean> if the account menu commands should be injected/initialized.
     */
    shouldInitAccountMenuCommands() {
        //TODO: setup a much shorter delay and retry it a few times.
        //delay 500ms to give the account menu a chance to get into the DOM
        return Promise.delay(500).then(() => {
            var shouldInit = false;
            // get the account menu table:
            var accountMenu = this.getAccountMenuElement();
            if (accountMenu.length > 0) {
                // does the account menu already have plugins:
                var foundCommands = accountMenu.has('.' + Constants.commandClassName);
                //if (foundCommands.length > 0) this.log('Account menu already has SheetMonkey commands.');
                shouldInit = foundCommands.length == 0;
            }
            else {
                D.log('Account menu not found.');
                shouldInit = false;
            }
            return shouldInit;
        });
    }

    initAccountMenuCommands() {
        return this.shouldInitAccountMenuCommands().then(shouldInit => {
            if (!shouldInit) {
                return
            }
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
        });
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