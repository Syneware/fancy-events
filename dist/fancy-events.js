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
            this._listeners = new Map();
            this._wildcardsRegex = new Map();
            this._listenerRegex = new Map();
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
                if (!this._listeners.has(event)) {
                    this._listeners.set(event, []);
                }
                this.emit("newListener", event, cb);
                if (this.mode === "wildcard" && !this._wildcardsRegex.has(event)) {
                    const parts = event.split(this.delimiter).map((p) => (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
                    const regex = new RegExp(`^${parts.join("\\" + this.delimiter)}$`);
                    this._wildcardsRegex.set(event, regex);
                }
                if (this.mode === "regex" && !this._listenerRegex.has(event)) {
                    this._listenerRegex.set(event, new RegExp(event));
                }
                this._getListeners(event).push({ callback: cb, once: !!options?.once });
            };
            this.on = this.addListener;
            this.once = (event, cb, options = {}) => {
                return this.addListener(event, cb, { ...options, once: true });
            };
            this._removeListener = (event, listener) => {
                if (this.listenerCount(event)) {
                    let listenerIndex = this._getListeners(event).findIndex((l) => l?.callback === listener);
                    if (listenerIndex > -1) {
                        this._getListeners(event).splice(listenerIndex, 1);
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
                    this._listeners.delete(event);
                    for (const callback of callbacks) {
                        this.emit("removeListener", event, callback);
                    }
                }
                return this;
            };
            this.eventNames = () => this._listeners.keys();
            this.listenerCount = (event) => this._getListeners(event)?.length || 0;
            this.listeners = (event) => this._getListeners(event)?.map?.(l => l.callback) || [];
            this._getListeners = (event) => this._listeners.get(event) || [];
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
            this._callListeners = (event, eventObject, params) => {
                for (const listener of this._getListeners(event)) {
                    if (listener.once) {
                        this._removeListener(event, listener?.callback);
                    }
                    listener?.callback?.(eventObject, ...params);
                }
            };
            this._callAsyncListeners = (event, eventObject, params) => {
                const promises = [];
                for (const callback of this._getListeners(event)) {
                    if (callback.once) {
                        this._removeListener(event, callback?.callback);
                    }
                    promises.push(callback?.callback?.(eventObject, ...params));
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
                    for (const ev of this._listeners.keys()) {
                        if (this._wildcardsRegex.get(ev)?.test?.(event)) {
                            this._callListeners(ev, eventObject, params);
                            listenerFound = true;
                        }
                    }
                }
                else if (this.mode === "regex") {
                    for (const ev of this._listeners.keys()) {
                        if (this._listenerRegex.get(ev)?.test?.(event)) {
                            this._callListeners(ev, eventObject, params);
                            listenerFound = true;
                        }
                    }
                }
                else if (this._listeners.has(event)) {
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
                    for (const ev of this._listeners.keys()) {
                        if (this._wildcardsRegex.get(ev)?.test?.(event)) {
                            promises.push(...this._callAsyncListeners(ev, eventObject, params));
                        }
                    }
                }
                else if (this.mode === "regex") {
                    for (const ev of this._listeners.keys()) {
                        if (this._listenerRegex.get(ev)?.test?.(event)) {
                            promises.push(...this._callAsyncListeners(ev, eventObject, params));
                        }
                    }
                }
                else if (this._listeners.has(event)) {
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

    return EventEmitter;

}));
