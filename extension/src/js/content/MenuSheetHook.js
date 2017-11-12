'use strict'
import $ from 'jquery'
import Diag from '../modules/diag.js'
import SheetHook from './SheetHook.js'
import Constants from '../modules/Constants.js'
import DomUtil from '../modules/DomUtil.js'

/**
* Provides a base class for hooking into smartsheet menus to insert and manage commands.
*/
class MenuSheetHook extends SheetHook {
  constructor (pluginHost, registeredPlugins, document) {
    super(pluginHost, registeredPlugins, document)
    this.D = new Diag(this.constructor.name)
  }

  onSmartsheetLoaded () {
    this.initListeners()
  }

  initListeners () {
    $(this.doc).click((e) => {
      // if the click is on a command, it will be dispatched here:
      this.handleCommandEvent(e)
      this.setupMenuListener()
    })
    this.setupMenuListener()
  }

  setupMenuListener () {
    // Don't start a listener if we already have one active
    if (this.activeMenuListener != null) return
    // Don't start a listener while the menu is open. If it is already open the listener will immediately resolve and cause a loop here.
    if (this.getMenuElement() !== null) return
    // Don't setup a listener if there are no items on the menu anyway:
    let menuItems = this.getMenuCommandsToInsert()
    if (!menuItems || menuItems.length < 1) return
    // PERF: this.D.warn(`init lazyQuerySelector for ${this.constructor.name}`)
    this.activeMenuListener = DomUtil.lazyQuerySelector(this.menuElementSelector).then(items => {
      this.activeMenuListener = null
      if (!items) {
        // then it was cancelled, so ignore
        return
      }
      this.D.log(`menu appeared for ${this.constructor.name}:`, items)
      // menu appeared:
      this.insertMenuCommands()
    })
  }

  /**
   * Should return a css selector that will select a menuitem on the desired menu.
   */
  get menuElementSelector () {
    // NOTE: the has: selector is a jquery extension that doesn't work with lazyQuerySelector.
    //  return 'div.clsPopupMenu:has(tr[data-client-id="10727"])'
    // return 'div.clsPopupMenu tr[data-client-id="10727"]'
    throw new Error('parent class should override menuElementSelector!')
  }

  /**
   * Should return the actual clsPopupMenu element (not a menu item, but the menu).
   */
  getMenuElement () {
    throw new Error('parent class should override getMenuElement!')
  }

  /**
   * Returns alist of commands to insert into the menu.
   */
  * getMenuCommandsToInsert () {
    throw new Error('parent class should override getMenuCommandsToInsert!')
  }

  /**
  * Handles and dispatches a command's events and routes them to plugin accordingly.
  * If it handles the event, returns true;
  */
  handleCommandEvent (e) {
    if (e == null || e.target == null) { return false }
    var target = $(e.target)
    var parent = target.parent()
    var isCommand = parent.hasClass(Constants.commandClassName)
    var eventType = e.type
    if (eventType === 'click' && isCommand) {
      var commandId = parent.attr('data-sheetmonkey-commandid')
      var pluginID = parent.attr('data-sheetmonkey-pluginid')
      let myCommandIDs = Array.from(this.getMenuCommandsToInsert()).map(cmd => cmd.id)

      if (myCommandIDs.indexOf(commandId) >= 0) {
        this.dismissMenu()
        this.D.log('Routing command click to plugin... PluginID:', pluginID, 'CommandID:', commandId)
        this.pluginHost.notifyCommandClicked(pluginID, commandId)
        return true
      } else {
        this.D.log(`Command ${commandId} not mine! myCommandIDs:`, myCommandIDs)
      }
    }
    return false
  }

  dismissMenu () {
    // we have to do this as SS won't dismiss it when a plugin menu item is clicked.
    let menu = this.getMenuElement()
    if (!menu) return
    if (!menu.classList.contains('clsPopupMenu')) {
      throw new Error('expected getMenuElement to return an menu with class getMenuElement.')
    }
    menu.remove()
  }

  insertMenuCommands () {
    let menu = this.getMenuElement()
    if (!menu) return
    let signOutMenuItem = menu.querySelector('tr:last-child[data-client-id]')
    if (signOutMenuItem.length === 0) {
      throw new Error('insertMenuCommands: ":last-child" menu item not found!')
    }
    signOutMenuItem = $(signOutMenuItem) // convert it to jquery
    let placeHolderElement = null
    for (let menuCommand of this.getMenuCommandsToInsert()) {
      this.D.log('initializing command ', menuCommand)
      for (let requiredProp of ['pluginID', 'id', 'label']) {
        if (!(requiredProp in menuCommand)) {
          throw new Error(`menu commands are required to have property "${requiredProp}".`)
        }
      }
      if (placeHolderElement === null) {
        // no elements inserted yet...
        placeHolderElement = this.createMenuDividerElement()
        signOutMenuItem.after(placeHolderElement)
        placeHolderElement = placeHolderElement[1]// hack it returns two elements and we want the second one.
      }
      let menuItem = this.createMenuElement(menuCommand.pluginID, menuCommand.id, menuCommand.label)
      placeHolderElement.after(menuItem)
      placeHolderElement = menuItem
    }
    this.initCommandEvents()
  }

  initCommandEvents () {
    $('.' + Constants.commandClassName).hover(
      function () { $(this).addClass('clsListRowHover') },
      function () { $(this).removeClass('clsListRowHover') }
    )
  }

  createMenuDividerElement () {
    var elements = [
      $('<tr id="sheetMonkey_menu_divider"><td colspan="3" class="clsStandardMenuDivider"><div></div></td></tr>'),
      $('<tr class=""><td colspan="3" class="clsStandardMenuText"><div style="color: grey; padding-left: 8px; font-size: 13px; margin-bottom: -8px; margin-top: -6px;">Plugins:</div></td></tr>')
    ]
    return elements
  }

  createMenuElement (pluginID, commandId, label) {
    // building via jquery for proper/safe encoding:
    let tr = $('<tr>')
    tr.addClass(Constants.commandClassName)
    tr.attr('id', `sheetMonkey_${pluginID}_${commandId}`)
    tr.attr('data-sheetmonkey-pluginid', pluginID)
    tr.attr('data-sheetmonkey-commandid', commandId)
    let td1 = $('<td style="margin-top:2px; height:16px; padding-left:15px;"></td>')
    let td2 = $('<td style="padding-right:15px; padding-left:0px; white-space:nowrap;" class="clsStandardMenuText"></td>')
    td2.text(label)
    let td3 = $('<td><div style="width:20px;height:20px;padding-right:5px"></div></td>')
    tr.append(td1)
    tr.append(td2)
    tr.append(td3)
    return tr
  }
}

export default MenuSheetHook
