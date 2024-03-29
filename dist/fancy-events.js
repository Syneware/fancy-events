/*!
 * Fancy Events
 * https://github.com/Syneware/fancy-events
 *
 * Copyright (c) 2022 Syneware
 * Licensed under the MIT license. https://raw.githubusercontent.com/Syneware/fancy-events/master/LICENSE
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.EventEmitter = factory());
})(this, (function () { 'use strict';

    class EventEmitter {
        constructor({ mode = "wildcard", includeStack = false, delimiter = "." } = {}) {
            this._listeners = {};
            this._wildcardsRegex = {};
            this._listenerRegex = {};
            this.mode = "wildcard";
            this.includeStack = false;
            this.delimiter = ".";
            this.addListener = (event, cb, options = {}) => {
                if (Array.isArray(event)) {
                    event.forEach((e) => this._addListener(e, cb, options));
                }
                else {
                    this._addListener(event, cb, options);
                }
                return this;
            };
            this._addListener = (event, cb, options = {}) => {
                if (!hasOwnProperty(this._listeners, event)) {
                    defineProperty(this._listeners, event, []);
                }
                this.emit("newListener", event, cb);
                if (this.mode === "wildcard" && !hasOwnProperty(this._wildcardsRegex, event)) {
                    const parts = event.split(this.delimiter).map((p) => (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
                    const regex = new RegExp(`^${parts.join("\\" + this.delimiter)}$`);
                    defineProperty(this._wildcardsRegex, event, regex);
                }
                if (this.mode === "regex" && !hasOwnProperty(this._listenerRegex, event)) {
                    defineProperty(this._listenerRegex, event, new RegExp(event));
                }
                this._listeners[event].push({ callback: cb, once: !!options?.once });
            };
            this.on = this.addListener;
            this.once = (event, cb, options = {}) => {
                return this.addListener(event, cb, { ...options, once: true });
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
                return this;
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
                return this;
            };
            this.eventNames = () => Object.keys(this._listeners);
            this.listenerCount = (event) => {
                if (event && hasOwnProperty(this._listeners, event)) {
                    return this._listeners[event].length;
                }
                return 0;
            };
            this.listeners = (event) => {
                if (event && hasOwnProperty(this._listeners, event)) {
                    return this._listeners[event].map(l => l.callback);
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
            this._callListeners = (e, eventObject, params) => {
                if (e && hasOwnProperty(this._listeners, e)) {
                    for (const callback of this._listeners[e]) {
                        if (callback.once) {
                            this._removeListener(e, callback?.callback);
                        }
                        callback?.callback?.(eventObject, ...params);
                    }
                }
            };
            this._callAsyncListeners = (e, eventObject, params) => {
                const promises = [];
                if (e && hasOwnProperty(this._listeners, e)) {
                    for (const callback of this._listeners[e]) {
                        if (callback.once) {
                            this._removeListener(e, callback?.callback);
                        }
                        promises.push(callback?.callback?.(eventObject, ...params));
                    }
                }
                return promises;
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
                let listenerFound = false;
                if (this.mode === "wildcard") {
                    for (const ev in this._listeners) {
                        if (this._wildcardsRegex[ev]?.test?.(event)) {
                            this._callListeners(ev, eventObject, params);
                            listenerFound = true;
                        }
                    }
                }
                else if (this.mode === "regex") {
                    for (const ev in this._listeners) {
                        if (this._listenerRegex[ev]?.test?.(event)) {
                            this._callListeners(ev, eventObject, params);
                            listenerFound = true;
                        }
                    }
                }
                else if (hasOwnProperty(this._listeners, event)) {
                    this._callListeners(event, eventObject, params);
                    listenerFound = true;
                }
                return listenerFound;
            };
            this.emitAsync = async (event, ...params) => {
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
                let promises = [];
                if (this.mode === "wildcard") {
                    for (const ev in this._listeners) {
                        if (this._wildcardsRegex[ev]?.test?.(event)) {
                            promises.push(...this._callAsyncListeners(ev, eventObject, params));
                        }
                    }
                }
                else if (this.mode === "regex") {
                    for (const ev in this._listeners) {
                        if (this._listenerRegex[ev]?.test?.(event)) {
                            promises.push(...this._callAsyncListeners(ev, eventObject, params));
                        }
                    }
                }
                else if (hasOwnProperty(this._listeners, event)) {
                    promises = this._callAsyncListeners(event, eventObject, params);
                }
                if (promises?.length) {
                    await Promise.allSettled(promises);
                    return true;
                }
                return false;
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

    return EventEmitter;

}));
