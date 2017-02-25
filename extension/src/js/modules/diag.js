class Diag {
    constructor(prefix) {
        this._prefix = prefix;
    }

    log(...args) {
        console.log(`${this._prefix}:`, ...args);
    }

    warn(...args) {
        console.warn(`${this._prefix}:`, ...args);
    }

    error(...args) {
        console.warn(`${this._prefix}:`, ...args);
    }

    assert(test, ...args) {
        console.assert(test, ...args);
    }
}

export default Diag;
