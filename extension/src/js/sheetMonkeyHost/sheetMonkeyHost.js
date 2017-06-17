import Promise from 'bluebird';
import Diag from '../modules/diag.js';
import Constants from '../modules/Constants.js'
const D = new Diag('SheetMonkeyHost');

/**
 * SheetMonkeyHost is the object that plugins interact with in their sandbox to communicate with the app/plugin host.
 */
class SheetMonkeyHost {
    constructor() {
    }
    /**
     * Called by the plugin to initialize the plugin's environment.
     * @param {*object} options Specifies the plugin and other plugin related options.
     */
    init(options) {
        D.log('in the hizzouse!');
        window.addEventListener("message", this.receiveMessage.bind(this), false);
        if (!options)
            throw new Error('options missing');
        if (!options.commandHandler)
            throw new Error('commandHandler missing');
        if (!options.pluginId)
            throw new Error('pluginId missing');
        this._pluginId = options.pluginId;
        this._commandHandler = options.commandHandler;
        this._receiveMessageHandlers = [new CommandClickHandler(this)];
    }

    /**
     * Receives messages from the sheetmonkey content script for communication with the rest of sheetmonkey.
     * @param {*object} event 
     */
    receiveMessage(event) {
        D.log('receiveMessage:', event);
        if (event.origin != 'https://app.smartsheet.com') {
            D.log('Ignoring message from untrusted origin:', event.origin);
            return;
        }
        let msg = event.data;
        if (msg.pluginId != this._pluginId) {
            D.error('Unexpected pluginId', msg.pluginId, 'Expected', this._pluginId);
            return;
        }
        for (var handler of this._receiveMessageHandlers) {
            handler.tryReceiveMessage(event);
        }
        // remove any handlers that are no longer listening:
        for (var i=0; i < this._receiveMessageHandlers.length; i++) {
            let h = this._receiveMessageHandlers[i];
            if (h.stopListening) {
                D.log('Removing ReceiveMessageHandler:', h);
                this._receiveMessageHandlers.splice(i, 1);
            }
        }
    }

    postMessageToSheetMonkey(message) {
        const targetOrigin = 'https://app.smartsheet.com';
        window.parent.postMessage(message, targetOrigin);
    }

    /**
     * Returns a Promise of the active container's ID (SheetID, SightID, etc.).
     */
    getContainerInfo() {
        var resolver;
        var rejecter;
        let p = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });
        this._receiveMessageHandlers.push(new GetContainerIDResponseHandler(resolver, rejecter));

        let msg = {
            eventType: Constants.messageGetContainerID,
            pluginId: this._pluginId
        };
        this.postMessageToSheetMonkey(msg);
        return p;
    }
}

class ReceiveMessageHandler {
    /**
     * Attempts to handle the message.
     * @param {*Object} event An event object passed to window.receiveMessage.
     * @returns True if the message was recognized and handled, otherwise false.
     */
    tryReceiveMessage(event) {
    }
    /**
     * Returns true if the handler is no longer listening and should be removed from the list of handlers.
     */
    get stopListening() {
        return false;
    }
}

class CommandClickHandler extends ReceiveMessageHandler {
    constructor(sheetMonkeyHost) {
        super(sheetMonkeyHost);
        if (!sheetMonkeyHost)
            throw new Error('argument required');
        this._host = sheetMonkeyHost;
    }
    tryReceiveMessage(event) {
        let msg = event.data;
        if (msg.eventType && msg.eventType == 'command_click') {
            const cmdInfo = {
                eventType: msg.eventType,
                pluginId: msg.pluginId,
                commandId: msg.commandId
            };
            this._host._commandHandler(cmdInfo);
        }
    }
    get stopListening() {
        return false;
    }
}

class GetContainerIDResponseHandler extends ReceiveMessageHandler {
    constructor(resolver, rejecter) {
        super();
        this._resolver = resolver;
        this._rejecter = rejecter;
        this._stopListening = false;
    }
    tryReceiveMessage(event) {
        let msg = event.data;
        if (msg.eventType && msg.eventType == Constants.messageGetContainerIDResponse) {
            D.assert(msg.containerType, 'expected containerType to be defined');
            D.assert(msg.containerID, 'expected containerID to be defined');
            this._resolver(msg); // <- Resolves the promise provided in the sheetmonkeyhost method.
            this._stopListening = true;
            return true;
        }
        return false;
    }
    get stopListening() {
        return this._stopListening;
    }
}

window.SheetMonkeyHost = new SheetMonkeyHost();