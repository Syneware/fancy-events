class EventEmitter {
    constructor({ mode = "wildcard", includeStack = false, delimiter = "." } = {}) {
        this._listeners = {};
        this._wildcardsRegex = {};
        this._listenerRegex = {};
        this.mode = "wildcard";
        this.includeStack = false;
        this.delimiter = ".";
        this.addListener = (event, cb, options = {}) => {
            if (!hasOwnProperty(this._listeners, event)) {
                defineProperty(this._listeners, event, []);
            }
            this.emit("newListener", event, cb);
            if (!hasOwnProperty(this._wildcardsRegex, event)) {
                const parts = event.split(this.delimiter).map((p) => (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
                const regex = new RegExp(`^${parts.join("\\" + this.delimiter)}$`);
                defineProperty(this._wildcardsRegex, event, regex);
            }
            if (!hasOwnProperty(this._listenerRegex, event)) {
                defineProperty(this._listenerRegex, event, new RegExp(event));
            }
            this._listeners[event].push({ callback: cb, once: !!options?.once });
        };
        this.on = this.addListener;
        this.once = (event, cb, options = {}) => {
            this.addListener(event, cb, { ...options, once: true });
        };
        this._removeListener = (event, listener) => {
            if (this.listenerCount(event)) {
                let listenerIndex = this._listeners[event].findIndex((l) => l?.callback === listener);
                if (listenerIndex > -1) {
                    this._listeners[event].splice(listenerIndex, 1);
                    return true;
                }
            }
            return false;
        };
        this.removeListener = (event, listener) => {
            if (this._removeListener(event, listener)) {
                this.emit("removeListener", event, listener);
            }
        };
        this.off = this.removeListener;
        this.removeAllListeners = (event) => {
            if (event && this.listeners(event).length) {
                const callbacks = this.listeners(event);
                delete this._listeners[event];
                for (const callback of callbacks) {
                    this.emit("removeListener", event, callback);
                }
            }
        };
        this.eventNames = () => Object.keys(this._listeners);
        this.listenerCount = (event) => {
            if (event) {
                return this.listeners(event).length;
            }
            return 0;
        };
        this.listeners = (event) => {
            if (event && hasOwnProperty(this._listeners, event)) {
                return this._listeners[event];
            }
            return [];
        };
        this._getStack = () => {
            // @ts-ignore
            const prepareStackTraceOrg = Error.prepareStackTrace;
            const err = new Error();
            // @ts-ignore
            Error.prepareStackTrace = (_, stack) => stack;
            const stacks = err.stack;
            // @ts-ignore
            Error.prepareStackTrace = prepareStackTraceOrg;
            return stacks?.slice(2) || [];
        };
        this.emit = (event, ...params) => {
            const eventObject = {
                event: event,
            };
            if (this.includeStack) {
                // @ts-ignore
                eventObject.stack = this._getStack().map((stack) => ({
                    typeName: stack.getTypeName(),
                    methodName: stack.getMethodName(),
                    function: stack.getFunction(),
                    functionName: stack.getFunctionName(),
                    fileName: stack.getFileName(),
                    lineNumber: stack.getLineNumber(),
                }));
            }
            const callListeners = (e, callbacks = []) => {
                for (const callback of callbacks) {
                    if (callback.once) {
                        this._removeListener(e, callback?.callback);
                    }
                    callback?.callback?.(eventObject, ...params);
                }
            };
            if (this.mode === "wildcard") {
                for (const ev in this._listeners) {
                    if (hasOwnProperty(this._listeners, ev) && this._wildcardsRegex[ev]?.test?.(event)) {
                        callListeners(ev, this._listeners[ev]);
                    }
                }
            }
            else if (this.mode === "regex") {
                for (const ev in this._listeners) {
                    if (hasOwnProperty(this._listeners, ev) && this._listenerRegex[ev]?.test?.(event)) {
                        callListeners(ev, this._listeners[ev]);
                    }
                }
            }
            else if (hasOwnProperty(this._listeners, event)) {
                callListeners(event, this._listeners[event]);
            }
        };
        if (mode) {
            this.mode = mode;
        }
        if (includeStack !== undefined) {
            this.includeStack = includeStack;
        }
        if (delimiter) {
            this.delimiter = delimiter;
        }
    }
}
function defineProperty(source, key, value) {
    return Object.defineProperty(source, key, { value, configurable: true, writable: true, enumerable: true });
}
function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export { EventEmitter as default };
