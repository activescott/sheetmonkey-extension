import Diag from '../modules/diag.js';
const D = new Diag('SheetMonkeyHost');

/**
 * SheetMonkeyHost is the object that plugins interact with in their sandbox to communicate with the app/plugin host.
 */
class SheetMonkeyHost {
    constructor() {
    }
    init(options) {
        D.log('in the hizzouse!');
        window.addEventListener("message", this.receiveMessage.bind(this), false);
        if (!options)
            throw 'options missing';
        if (!options.commandHandler)
            throw 'commandHandler missing';
        if (!options.pluginId)
            throw 'pluginId missing'
        this._pluginId = options.pluginId;
        this._commandHandler = options.commandHandler;
    }

    receiveMessage(event) {
        D.log('receiveMessage');
        if (event.origin != 'https://app.smartsheet.com') {
            D.log('Ignoring message from untrusted origin:', event.origin);
            return;
        }
        let msg = event.data;
        if (msg.pluginId != this._pluginId) {
            D.error('Unexpected pluginId', msg.pluginId, 'Expected', this._pluginId);
            return;
        }
        if (msg.eventType == 'command_click') {
            const cmdInfo = {
                eventType: msg.eventType,
                pluginId: msg.pluginId,
                commandId: msg.commandId
            };
            this._commandHandler(cmdInfo);
        }
    }
}

window.SheetMonkeyHost = new SheetMonkeyHost();