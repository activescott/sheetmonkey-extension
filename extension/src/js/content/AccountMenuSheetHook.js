'use strict'
import $ from 'jquery'
import MenuSheetHook from './MenuSheetHook'
import Constants from '../modules/Constants.js'

/**
* Hooks into the Account menu so that new menu items can be added there.
*/
class AccountMenuSheetHook extends MenuSheetHook {
  /**
   * Should return a css selector that will select a menuitem on the desired menu.
   */
  get menuElementSelector () {
    return 'div.clsPopupMenu tr[data-client-id="10727"]'
  }

  /**
   * Should return the actual clsPopupMenu element (not a menu item, but the menu).
   */
  getMenuElement () {
    // NOTE non-standard jquery ":has" selector here
    var menuElem = $('div.clsPopupMenu:has(tr[data-client-id="10727"])')
    if (menuElem.length > 0) {
      return menuElem.get(0)
    }
    // note callers will check to see if the menu element is in the DOM so null is an acceptable response here:
    return null
  }

  /**
   * Returns alist of commands to insert into the menu.
   */
  * getMenuCommandsToInsert () {
    for (var p of this.plugins) {
      for (let cmd of p.manifest.commands) {
        if (cmd.kind === Constants.account_menu) {
          let menuCmd = {
            pluginID: p.manifest.id,
            id: cmd.id,
            label: cmd.label
          }
          yield menuCmd
        }
      }
    }
  }
}

export default AccountMenuSheetHook
