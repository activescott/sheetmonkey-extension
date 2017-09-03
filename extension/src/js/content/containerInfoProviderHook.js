'use strict' /* global MouseEvent */
import Promise from 'bluebird'
import $ from 'jquery'
import SheetHook from './SheetHook.js'
import Constants from '../modules/Constants.js'
import Diag from '../modules/diag.js'
import DomUtil from '../modules/DomUtil.js'

const D = new Diag('ContainerInfoProviderHook')

/**
 * Listens for messages from sheetMonkeyHost (plugins) and provides information about the current container (e.g. SheetID, SightID, Report ID etc.) to the plugins.
 */
class ContainerInfoProviderHook extends SheetHook {
  onSmartsheetLoaded () {
    window.addEventListener('message', this.receiveMessage.bind(this), false)
  }

  receiveMessage (event) {
    // D.log('receiveMessage! eventType:', event.data && event.data.hasOwnProperty('eventType') ? event.data.eventType : '<none>', 'event:', event)
    let msg = event.data
    if (msg.eventType === Constants.messageGetContainerID) {
      D.assert(msg.pluginId, 'Expected pluginId on message!')
      if (msg.pluginId) {
        this.getContainerInfo().then(containerInfo => {
          containerInfo.eventType = Constants.messageGetContainerIDResponse
          this.pluginHost.postMessageToPlugin(msg.pluginId, containerInfo)
        })
      }
    } else if (msg.eventType === Constants.messageGetSelectionInfo) {
      D.assert(msg.pluginId, 'Expected pluginId on message!')
      if (msg.pluginId) {
        this.getSelectionInfo().then(selectionInfo => {
          selectionInfo.eventType = Constants.messageGetSelectionInfoResponse
          this.pluginHost.postMessageToPlugin(msg.pluginId, selectionInfo)
        })
      }
    } else {
      D.log('Unrecognized command: ', msg.eventType)
    }
  }

  getContainerInfo () {
    return DomUtil.lazyQuerySelector('span.clsDesktopTabActive span.clsDesktopTabMenuIcon').then(tabElement => {
      // open menu:
      tabElement.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      // wait on the properties menu item and then click properties to open the dialog:
      let propertiesMenuItemQueries = [
        'tr[data-client-id="13511"]', // <- Sheets
        'tr[data-client-id="10625"]' //  <- Reports? Sights?
      ]
      return DomUtil.lazyQuerySelector(propertiesMenuItemQueries).then(propertiesMenuItem => {
        propertiesMenuItem.click()
        // wait for the dialog to appear and immediately make it invisible (the dialog div seems to appear before its contents):
        return DomUtil.lazyQuerySelector('div[data-client-id="7130"]').then(form => {
          let style = form.getAttribute('style')
          style += '; visibility:hidden'
          form.setAttribute('style', style)
          // wait for the Sheet ID/Report ID/Sight ID: textbox to appear:
          return DomUtil.lazyQuerySelector('div[data-client-id="7130"] input[tabindex="2"]').then(containerIDInput => {
            let containerID = containerIDInput.value
            var containerType = containerIDInput.parentElement.previousSibling.textContent
            // containerType should be one of 'Sheet ID', 'Sight ID', or 'Report ID':
            containerType = containerType.split(' ')[0].toLowerCase()
            // close dialog (by clicking in an innocuous spot)
            document.querySelector('div.clsDesktopHome').dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
            return {
              containerType: containerType,
              containerID: containerID
            }
          })
        })
      })
    })
  }

  getSelectionInfo () {
    return Promise.try(() => {
      let selectionBounds = this.getSelectionBounds()
      return this.getRowIDFromSelectionBounds(selectionBounds).then(rowID => {
        // restore selection:
        this.selectCellFromBounds(selectionBounds)
        // now get selected column name (because column ID not readily accessible in DOM):
        let columnName = this.getColumnNameFromSelectionBounds(selectionBounds)
        return { rowID, columnName }
      })
    })
  }

  getColumnNameFromSelectionBounds (selectionBounds) {
    let expectedColLeft = selectionBounds.left + 1
    let cols = Array.from(document.querySelectorAll('div.clsTableHeading div.clsTableHeadingText')).map(e => Object.assign({left: e.parentElement.style.left, name: e.innerText}))
    // remove 'px' suffix:
    cols = cols.map(c => {
      let left = c.left.endsWith('px') ? parseInt(c.left.slice(0, c.left.length - 2)) : null
      return { left: left, name: c.name }
    })
    let foundCol = cols.find(c => c.left === expectedColLeft)
    return foundCol ? foundCol.name : null
  }

  selectCellFromBounds (selectionBounds) {
    let expectedLeft = selectionBounds.left + 1
    let expectedTop = selectionBounds.top + 1
    let cells = Array.from(document.querySelectorAll('.clsDesktopContainer table.clsGridTable')[1].querySelectorAll('td.clsTD1'))
    cells = cells.filter(td => td.offsetLeft === expectedLeft && td.offsetTop === expectedTop)
    if (cells.length === 1) {
      // NO worky! How does the grid determine selection? based on mouse coordinates??
      D.log('selectCellFromBounds clicking:', cells[0])
      $(cells[0].children[0]).click()
    } else {
      D.error(`selectCellFromBounds expected to find exactly 1 cell but found ${cells.length}.`)
    }
  }

  getRowIDFromSelectionBounds (selectionBounds) {
    let target = this.getRowElemFromSelectionBounds(selectionBounds).children[2].children[0]
    // right-click on the row to show the row context menu:
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 3, buttons: 2 }))
    // wait on the menu and click on "Properties...": <tr data-client-id="10176" class="">
    return DomUtil.lazyQuerySelector('tr[data-client-id="10176"]').then(rowProperitesMenuItem => {
      $(rowProperitesMenuItem).click()
      // now find the form that pops up (note it appears 7130 is used as a generic popup form):
      return DomUtil.lazyQuerySelector('div[data-client-id="7130"]').then(form => {
        let style = form.getAttribute('style')
        style += '; visibility:hidden'
        form.setAttribute('style', style)
        return DomUtil.lazyQuerySelector('div[data-client-id="7130"] input[tabindex="2"]').then(rowIDInput => {
          let rowID = rowIDInput.value
          // close dialog (by clicking "Close" button); close button == 101
          $('div[data-client-id="7130"] div[data-client-id="101"]').click()
          return rowID
        })
      })
    })
  }

  getSelectionBounds () {
    let l = Array.from(document.querySelectorAll('div.clsGAW'))
    // now find the one with two div.clsGMOs that have 2px height and two that have 2px width
    l = l.filter(e => {
      let kids = Array.from(e.childNodes)
      const selectionColors = {
        'rgb(41, 81, 119)': 'default color',
        'rgb(170, 170, 170)': 'read-only column color'
      }
      let widths = kids.filter(e => e.classList.contains('clsGMO') && e.style.width === '2px' && e.style.backgroundColor in selectionColors).length
      let heights = kids.filter(e => e.classList.contains('clsGMO') && e.style.height === '2px' && e.style.backgroundColor in selectionColors).length
      return kids.length >= 4 &&
            widths === 2 &&
            heights === 2
    })
    if (l.length !== 1) {
      throw new Error(`couldn't find selection element. Expected length 1, but was ${l.length}`)
    }
    const elem = l[0]
    const top = elem.children[0].offsetTop
    const left = elem.children[3].offsetLeft
    return { left, top }
  }

  getRowElemFromSelectionBounds (selectionBounds) {
    let expectedRowTop = selectionBounds.top + 1
    // now find the row:
    //  we want the first clsGridTable:
    let gridTable = document.querySelector('table.clsGridTable')
    const rows = Array.from(gridTable.querySelectorAll('tbody > tr'))
    const foundRows = rows.filter(r => r.offsetTop === expectedRowTop)
    if (foundRows.length !== 1) {
      throw new Error(`Failed to find row corresponding to selection. Expected exactly 1 but found ${foundRows.length}. expectedRowTop: ${expectedRowTop}.`)
    }
    return foundRows[0]
  }
}

export default ContainerInfoProviderHook
