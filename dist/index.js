(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EventEmitter {
        constructor({ mode = "wildcard", includeStack = false, delimiter = "." } = {}) {
            this._listeners = {};
            this.mode = "wildcard";
            this.includeStack = false;
            this.delimiter = ".";
            this.addListener = (event, cb, options = {}) => {
                if (!Object.prototype.hasOwnProperty.call(this._listeners, event)) {
                    Object.defineProperty(this._listeners, event, {
                        value: [],
                        configurable: true,
                        writable: true,
                        enumerable: true
                    });
                }
                this.emit("newListener", event, cb);
                this._listeners[event].push({ callback: cb, once: !!(options === null || options === void 0 ? void 0 : options.once) });
            };
            this.on = this.addListener;
            this.once = (event, cb, options = {}) => {
                this.addListener(event, cb, Object.assign(Object.assign({}, options), { once: true }));
            };
            this.removeListener = (event, listener) => {
                if (this.listeners(event).length) {
                    let listenerIndex = this._listeners[event].findIndex((l) => (l === null || l === void 0 ? void 0 : l.callback) !== listener);
                    if (listenerIndex > -1) {
                        this._listeners[event].splice(listenerIndex, 1);
                        this.emit("removeListener", event, listener);
                    }
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
                if (event && Object.prototype.hasOwnProperty.call(this._listeners, event)) {
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
                return (stacks === null || stacks === void 0 ? void 0 : stacks.slice(2)) || [];
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
                    var _a;
                    for (const callback of callbacks) {
                        if (callback.once) {
                            this.removeListener(e, callback === null || callback === void 0 ? void 0 : callback.callback);
                        }
                        (_a = callback === null || callback === void 0 ? void 0 : callback.callback) === null || _a === void 0 ? void 0 : _a.call(callback, eventObject, ...params);
                    }
                };
                if (this.mode === "wildcard") {
                    for (const ev in this._listeners) {
                        if (Object.prototype.hasOwnProperty.call(this._listeners, ev)) {
                            const parts = ev.split(this.delimiter).map((p) => (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
                            const regex = new RegExp(`^${parts.join("\\" + this.delimiter)}$`);
                            if (regex.test(event)) {
                                callListeners(ev, this._listeners[ev]);
                            }
                        }
                    }
                }
                else if (this.mode === "regex") {
                    for (const ev in this._listeners) {
                        if (Object.prototype.hasOwnProperty.call(this._listeners, ev)) {
                            const regex = new RegExp(ev);
                            if (regex.test(event)) {
                                callListeners(ev, this._listeners[ev]);
                            }
                        }
                    }
                }
                else if (Object.prototype.hasOwnProperty.call(this._listeners, event)) {
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
    exports.default = EventEmitter;
});
