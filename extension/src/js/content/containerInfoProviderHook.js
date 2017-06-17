import Promise from 'bluebird';
import $ from 'jquery';
import SheetHook from './sheetHook.js';
import Constants from '../modules/Constants.js';
import Diag from '../modules/diag.js';
import DomUtil from '../modules/DomUtil.js';

const D = new Diag('ContainerInfoProviderHook');

/**
 * Listens for messages from sheetMonkeyHost (plugins) and provides information about the current container (e.g. SheetID, SightID, Report ID etc.) to the plugins.
 */
class ContainerInfoProviderHook extends SheetHook {
  constructor(pluginHost, plugins, document) {
    super(pluginHost, plugins, document);
  }

  onSmartsheetLoaded() {
      window.addEventListener("message", this.receiveMessage.bind(this), false);
    }

    receiveMessage(event) {
        D.log('receiveMessage:', event);
        let msg = event.data;
        if (msg.eventType == Constants.messageGetContainerID) {
          D.assert(msg.pluginId, 'Expected pluginId on message!');
          if (msg.pluginId) {
            this.getContainerInfo().then(containerInfo => {
              containerInfo.eventType = Constants.messageGetContainerIDResponse;
              this.pluginHost.postMessageToPlugin(msg.pluginId, containerInfo);
            });
          }
        } else {
          D.log('Unrecognized command: ', msg.sheetMonkeyCommandType);
        }
    }

    getContainerInfo() {
      return DomUtil.lazyQuerySelector('span.clsDesktopTabActive span.clsDesktopTabMenuIcon').then(tabElement => {
        //open menu:
        tabElement.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
        // wait on the properties menu item and then click properties to open the dialog:
        let propertiesMenuItemQueries = [
          'tr[data-client-id="13511"]', // <- Sheets
          'tr[data-client-id="10625"]' //  <- Reports? Sights?
        ];
        return DomUtil.lazyQuerySelector(propertiesMenuItemQueries).then(propertiesMenuItem => {
          propertiesMenuItem.click();
          // wait for the Sheet ID/Report ID/Sight ID: textbox to appear:
          return DomUtil.lazyQuerySelector('div[data-client-id="7130"] input[tabindex="2"]').then(containerIDInput => {
            let containerID = containerIDInput.value;
            var containerType = containerIDInput.parentElement.previousSibling.textContent;
            // containerType should be one of 'Sheet ID', 'Sight ID', or 'Report ID':
            containerType = containerType.split(' ')[0].toLowerCase();
            // close dialog (by clicking in an innocuous spot)
            document.querySelector('div.clsDesktopHome').dispatchEvent(new MouseEvent('mousedown', {bubbles:true}))
            return {
              containerType: containerType,
              containerID: containerID
            };
          });
        });
      });
    }
}

export default ContainerInfoProviderHook;