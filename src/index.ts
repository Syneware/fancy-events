interface Listener {
    callback: Function;
    once: boolean;
}

interface Listeners {
    [key: string]: Listener[];
}

interface ListenersRegex {
    [key: string]: RegExp;
}

interface EventObject {
    event: string;
    stack?: {
        typeName: string,
        methodName: string,
        function: Function,
        functionName: string,
        fileName: string,
        lineNumber: number,
    }[]
}

interface EventEmitterOptions {
    mode?: 'wildcard' | 'regex' | 'simple';
    includeStack?: boolean;
    delimiter?: string;
}

export default class EventEmitter {
    private _listeners: Listeners = {};
    private _wildcardsRegex: ListenersRegex = {};
    private _listenerRegex: ListenersRegex = {};

    mode = "wildcard";
    includeStack = false;
    delimiter = ".";

    constructor({mode = "wildcard", includeStack = false, delimiter = "."}: EventEmitterOptions = {}) {
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

    addListener = (event: string | string[], cb: Function, options: { once?: boolean } = {}): EventEmitter => {
        if (Array.isArray(event)) {
            event.forEach((e) => this._addListener(e, cb, options))
        } else {
            this._addListener(event, cb, options)
        }
        return this;
    }

    private _addListener = (event: string, cb: Function, options: { once?: boolean } = {}) => {
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

        this._listeners[event].push({callback: cb, once: !!options?.once});
    };

    on = this.addListener;

    once = (event: string, cb: Function, options = {}) => {
        return this.addListener(event, cb, {...options, once: true});
    };

    private _removeListener = (event: string, listener: Function) => {
        if (this.listenerCount(event)) {
            let listenerIndex = this._listeners[event].findIndex((l) => l?.callback === listener);
            if (listenerIndex > -1) {
                this._listeners[event].splice(listenerIndex, 1);
                return true;
            }
        }
        return false;
    };

    removeListener = (event: string, listener: Function): EventEmitter => {
        if (this._removeListener(event, listener)) {
            this.emit("removeListener", event, listener);
        }
        return this;
    };

    off = this.removeListener;

    removeAllListeners = (event: string): EventEmitter => {
        if (event && this.listeners(event).length) {
            const callbacks = this.listeners(event);
            delete this._listeners[event];

            for (const callback of callbacks) {
                this.emit("removeListener", event, callback);
            }
        }
        return this;
    };

    eventNames = () => Object.keys(this._listeners);

    listenerCount = (event: string): number => {
        if (event && hasOwnProperty(this._listeners, event)) {
            return this._listeners[event].length;
        }
        return 0;
    };

    listeners = (event: string) => {
        if (event && hasOwnProperty(this._listeners, event)) {
            return this._listeners[event].map(l => l.callback);
        }
        return [];
    };

    private _getStack = () => {
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

    private _callListeners = (e: string, eventObject: EventObject, params: any[]) => {
        if (e && hasOwnProperty(this._listeners, e)) {
            for (const callback of this._listeners[e]) {
                if (callback.once) {
                    this._removeListener(e, callback?.callback);
                }
                callback?.callback?.(eventObject, ...params);
            }
        }
    };

    emit = (event: string, ...params: any[]) => {
        const eventObject: EventObject = {
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
        } else if (this.mode === "regex") {
            for (const ev in this._listeners) {
                if (this._listenerRegex[ev]?.test?.(event)) {
                    this._callListeners(ev, eventObject, params);
                    listenerFound = true;
                }
            }
        } else if (hasOwnProperty(this._listeners, event)) {
            this._callListeners(event, eventObject, params);
            listenerFound = true;
        }
        return listenerFound;
    };
}

function defineProperty(source: Object, key: string, value: any) {
    return Object.defineProperty(source, key, {value, configurable: true, writable: true, enumerable: true});
}

function hasOwnProperty(obj: Object, key: string) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
