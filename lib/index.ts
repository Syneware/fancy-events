interface Listener {
    callback: Function;
    once: boolean;
}

interface Listeners {
    [key: string]: Listener[];
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

    addListener = (event: string, cb: Function, options: { once?: boolean } = {}) => {
        if (!Object.prototype.hasOwnProperty.call(this._listeners, event)) {
            Object.defineProperty(this._listeners, event, {
                value: [],
                configurable: true,
                writable: true,
                enumerable: true
            });
        }
        this.emit("newListener", event, cb);

        this._listeners[event].push({callback: cb, once: !!options?.once});
    };

    on = this.addListener;

    once = (event: string, cb: Function, options = {}) => {
        this.addListener(event, cb, {...options, once: true});
    };

    removeListener = (event: string, listener: Function) => {
        if (this.listeners(event).length) {
            let listenerIndex = this._listeners[event].findIndex((l) => l?.callback !== listener);
            if (listenerIndex > -1) {
                this._listeners[event].splice(listenerIndex, 1);
                this.emit("removeListener", event, listener);
            }
        }
    };

    off = this.removeListener;

    removeAllListeners = (event: string) => {
        if (event && this.listeners(event).length) {
            const callbacks = this.listeners(event);
            delete this._listeners[event];

            for (const callback of callbacks) {
                this.emit("removeListener", event, callback);
            }
        }
    };

    eventNames = () => Object.keys(this._listeners);

    listenerCount = (event: string): number => {
        if (event) {
            return this.listeners(event).length;
        }
        return 0;
    };

    listeners = (event: string) => {
        if (event && Object.prototype.hasOwnProperty.call(this._listeners, event)) {
            return this._listeners[event];
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

        const callListeners = (e: string, callbacks: Listener[] = []) => {
            for (const callback of callbacks) {
                if (callback.once) {
                    this.removeListener(e, callback?.callback);
                }
                callback?.callback?.(eventObject, ...params);
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
        } else if (this.mode === "regex") {
            for (const ev in this._listeners) {
                if (Object.prototype.hasOwnProperty.call(this._listeners, ev)) {
                    const regex = new RegExp(ev);
                    if (regex.test(event)) {
                        callListeners(ev, this._listeners[ev]);
                    }
                }
            }
        } else if (Object.prototype.hasOwnProperty.call(this._listeners, event)) {
            callListeners(event, this._listeners[event]);
        }
    };
}
