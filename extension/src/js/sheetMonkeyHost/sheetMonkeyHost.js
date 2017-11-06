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
    this._pluginID = window.data_sheetmonkey_pluginid
    this._ssOrigin = window.data_sheetmonkey_ssOrigin
    D.log('Found my pluginid as', this._pluginID)
    D.log('Found ss origin as', this._ssOrigin)
    this._commandHandler = options.commandHandler
    this._receiveMessageHandlers = [new CommandClickHandler(this)]
  }

  /**
  * Receives messages from the sheetmonkey content script for communication with the rest of sheetmonkey.
  * @param {*object} event
  */
  receiveMessage (event) {
    // D.log('receiveMessage:', event)
    if (['https://app.smartsheet.com', 'https://mars.lab.smartsheet.com'].indexOf(event.origin) < 0) {
      D.log('Ignoring message from untrusted origin:', event.origin)
      return
    }
    // TODO: Consider requiring extension to sign messages witha private key and to check the signature here.
    for (var handler of this._receiveMessageHandlers) {
      handler.tryReceiveMessage(event)
    }
    // remove any handlers that are no longer listening:
    for (var i = 0; i < this._receiveMessageHandlers.length; i++) {
      let h = this._receiveMessageHandlers[i]
      if (h.stopListening) {
        // D.log('Removing ReceiveMessageHandler:', h)
        this._receiveMessageHandlers.splice(i, 1)
      }
    }
  }

  /**
   * Posts the message to sheetmonkey and returns the promise of a response for the specified responseEventType.
   * @param {*object} message The message to post to sheetmonkey
   * @param {*string} responseEventType The event type that sheetmonkey is expected to respond with.
   */
  postMessageToSheetMonkey (message, responseEventType) {
    // TODO: Consider having extension provide a signed secret to this script to provide back to the extension during communication.
    const targetOrigin = this._ssOrigin
    // Set up the response
    var resolver
    var rejecter
    let responsePromise = new Promise((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })
    this._receiveMessageHandlers.push(new ResolveResponseUponEventTypeHandler(resolver, rejecter, responseEventType))
    // send message
    window.parent.postMessage(message, targetOrigin)
    return responsePromise
  }

  /**
  * Returns a Promise of the active container's ID (SheetID, SightID, etc.).
  */
  getContainerInfo () {
    let msg = {
      eventType: Constants.messageGetContainerID,
      pluginID: this._pluginID
    }
    return this.postMessageToSheetMonkey(msg, Constants.messageGetContainerIDResponse)
  }

  getSelectionInfo () {
    let msg = {
      eventType: Constants.messageGetSelectionInfo,
      pluginID: this._pluginID
    }
    return this.postMessageToSheetMonkey(msg, Constants.messageGetSelectionInfoResponse)
  }

  /**
   * Calls the smartsheet REST api as specified and returns the result.
   */
  apiRequest (method, path, headers, data) {
    let msg = {
      eventType: Constants.messageApiRequest,
      pluginID: this._pluginID,
      method,
      path,
      headers,
      data
    }
    return this.postMessageToSheetMonkey(msg, Constants.messageApiRequestResponse)
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
        pluginID: msg.pluginID,
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

class ResolveResponseUponEventTypeHandler extends ResponseHandler {
  constructor (resolver, rejecter, eventType) {
    super(resolver, rejecter)
    this.eventType = eventType
  }
  tryReceiveMessage (event) {
    let msg = event.data
    if (msg.eventType && msg.eventType === this.eventType) {
      this.resolve(msg)
      return true
    }
    return false
  }
}

window.SheetMonkeyHost = new SheetMonkeyHost()
