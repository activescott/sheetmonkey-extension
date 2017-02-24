import Promise from 'bluebird';
import $ from 'jquery';

class CommandManager {
    constructor(context) {
        this._context = context;
        this._document = context.document;
        this.initDocumentListeners();
    }

    initDocumentListeners() {
        this.log('initDocumentListeners');

        // Should we be doing this via context.doc /this.doc instead? Jquery seems to find the document ok and is more resiliant.
        $(() => {
            this.log('doc load');
            this.onSmartsheetLoaded();
        });
    }

    get doc() {
        return this._document;
    }

    get context() {
        return this._context;
    }

    log(...args) {
        let t = __filename;
        console.log(`${t}:`, ...args);
    }

    warn(...args) {
        let t = __filename;
        console.warn(`${t}:`, ...args);
    }

    error(...args) {
        let t = __filename;
        console.warn(`${t}:`, ...args);
    }

    /**
     * Triggered when the document for Smartsheet is loaded and available.
     */
    onSmartsheetLoaded () {
        console.log('onSmartsheetLoaded');
    }
}

export default CommandManager;