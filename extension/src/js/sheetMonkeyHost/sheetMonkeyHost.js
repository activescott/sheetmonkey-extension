import Promise from 'bluebird'
import Diag from '../modules/diag.js'
import Constants from '../modules/Constants.js'
const D = new Diag('SheetMonkeyHost')

/**
* SheetMonkeyHost is the object that plugins interact with in their sandbox to communicate with the app/plugin host.
*/
class SheetMonkeyHost {
  /**
  * Called by the plugin to initialize the plugin's environment.
  * @param {*object} options Specifies the plugin and other plugin related options.
  */
  init (options) {
    D.log('in the hizzouse!')
    window.addEventListener('message', this.receiveMessage.bind(this), false)
    if (!options) throw new Error('options missing')
    if (!options.commandHandler) throw new Error('commandHandler missing')
    this._pluginId = window.data_sheetmonkey_pluginid
    this._ssOrigin = window.data_sheetmonkey_ssOrigin
    D.log('Found my pluginid as', this._pluginId)
    D.log('Found ss origin as', this._ssOrigin)
    this._commandHandler = options.commandHandler
    this._receiveMessageHandlers = [new CommandClickHandler(this)]
  }

  /**
  * Receives messages from the sheetmonkey content script for communication with the rest of sheetmonkey.
  * @param {*object} event
  */
  receiveMessage (event) {
    D.log('receiveMessage:', event)
    if (['https://app.smartsheet.com', 'https://mars.lab.smartsheet.com'].indexOf(event.origin) < 0) {
      D.log('Ignoring message from untrusted origin:', event.origin)
      return
    }
    // TODO: Consider requiring extension to sign messages witha private key and to check the signature here.
    let msg = event.data
    for (var handler of this._receiveMessageHandlers) {
      handler.tryReceiveMessage(event)
    }
    // remove any handlers that are no longer listening:
    for (var i = 0; i < this._receiveMessageHandlers.length; i++) {
      let h = this._receiveMessageHandlers[i]
      if (h.stopListening) {
        D.log('Removing ReceiveMessageHandler:', h)
        this._receiveMessageHandlers.splice(i, 1)
      }
    }
  }

  postMessageToSheetMonkey (message) {
    // TODO: Consider having extension provide a signed secret to this script to provide back to the extension during communication.
    const targetOrigin = this._ssOrigin
    window.parent.postMessage(message, targetOrigin)
  }

  /**
  * Returns a Promise of the active container's ID (SheetID, SightID, etc.).
  */
  getContainerInfo () {
    var resolver
    var rejecter
    let p = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    this._receiveMessageHandlers.push(new GetContainerIDResponseHandler(resolver, rejecter))
    let msg = {
      eventType: Constants.messageGetContainerID,
      pluginId: this._pluginId
    }
    this.postMessageToSheetMonkey(msg)
    return p
  }

  getSelectionInfo () {
    D.log('getSelectionInfo')
    var resolver
    var rejecter
    let p = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    this._receiveMessageHandlers.push(new GetSelectionInfoResponseHandler(resolver, rejecter))
    let msg = {
      eventType: Constants.messageGetSelectionInfo,
      pluginId: this._pluginId
    }
    this.postMessageToSheetMonkey(msg)
    return p
  }

  launchAuthFlow () {
    D.log('launchAuthFlow')
    var resolver
    var rejecter
    let p = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    this._receiveMessageHandlers.push(new LaunchAuthFlowResponseHandler(resolver, rejecter))
    let msg = {
      eventType: Constants.messageLaunchAuthFlow,
      pluginId: this._pluginId
    }
    this.postMessageToSheetMonkey(msg)
    return p
  }
}

class ReceiveMessageHandler {
  /**
  * Attempts to handle the message.
  * @param {*Object} event An event object passed to window.receiveMessage.
  * @returns True if the message was recognized and handled, otherwise false.
  */
  tryReceiveMessage (event) {
  }
  /**
  * Returns true if the handler is no longer listening and should be removed from the list of handlers.
  */
  get stopListening () {
    return false
  }
}

class CommandClickHandler extends ReceiveMessageHandler {
  constructor (sheetMonkeyHost) {
    super(sheetMonkeyHost)
    if (!sheetMonkeyHost) {
      throw new Error('argument required')
    }
    this._host = sheetMonkeyHost
  }
  tryReceiveMessage (event) {
    let msg = event.data
    if (msg.eventType && msg.eventType === 'command_click') {
      const cmdInfo = {
        eventType: msg.eventType,
        pluginId: msg.pluginId,
        commandId: msg.commandId
      }
      this._host._commandHandler(cmdInfo)
    }
  }
  get stopListening () {
    return false
  }
}

class ResponseHandler extends ReceiveMessageHandler {
  constructor (resolver, rejecter) {
    super()
    this._resolver = resolver
    this._rejecter = rejecter
    this._stopListening = false
  }
  /** Resolves the promise provided when initializing and stops the handler from listening */
  resolve (data) {
    this._resolver(data) // <- Resolves the promise provided in the sheetmonkeyhost method.
    this._stopListening = true
  }
  get stopListening () {
    return this._stopListening
  }
}

class GetContainerIDResponseHandler extends ResponseHandler {
  tryReceiveMessage (event) {
    let msg = event.data
    if (msg.eventType && msg.eventType === Constants.messageGetContainerIDResponse) {
      D.assert(msg.containerType, 'expected containerType to be defined')
      D.assert(msg.containerID, 'expected containerID to be defined')
      this.resolve(msg) // <- Resolves the promise provided in the sheetmonkeyhost method.
      return true
    }
    return false
  }
}

class GetSelectionInfoResponseHandler extends ResponseHandler {
  tryReceiveMessage (event) {
    let msg = event.data
    if (msg.eventType && msg.eventType === Constants.messageGetSelectionInfoResponse) {
      D.assert(msg.hasOwnProperty('rowID'), `Expected msg ${msg.eventType} to have rowID`)
      this.resolve(msg) // <- Resolves the promise provided in the sheetmonkeyhost method.
      return true
    }
    return false
  }
}

class LaunchAuthFlowResponseHandler extends ResponseHandler {
  tryReceiveMessage (event) {
    let msg = event.data
    if (msg.eventType && msg.eventType === Constants.messageLaunchAuthFlowResponse) {
      // TODO: assert something... D.assert(msg.hasOwnProperty('rowID'), `Expected msg ${msg.eventType} to have rowID`)
      this.resolve(msg) // <- Resolves the promise provided in the sheetmonkeyhost method.
      return true
    }
    return false
  }
}

window.SheetMonkeyHost = new SheetMonkeyHost()
