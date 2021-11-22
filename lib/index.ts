
interface Listener {
    callback: Function,
    once: boolean,
}

interface Listeners {
    [key: string]: Listener[]
}

interface EventObject {
    event: string,
    stack?: object[]
}

export default class EventEmitter {
    _listeners: Listeners = {};

    mode = "wildcard";
    includeStack = false;

    constructor({mode = "wildcard", includeStack = false} = {}) {
        this.mode = mode;
        this.includeStack = includeStack;
    }

    addListener = (event: string, cb: Function, options: {once?: boolean} = {}) => {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this.emit("newListener", event, cb);

        this._listeners[event].push({callback: cb, once: !!options?.once});
    };

    on = this.addListener;

    once = (event: string, cb: Function, options = {}) => {
        this.addListener(event, cb, {...options, once: true});
    };

    removeListener = (event: string, listener: Function) => {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter((l) => l?.callback !== listener);
            this.emit("removeListener", event, listener);
        }
    };

    off = this.removeListener;

    removeAllListeners = (event: string) => {
        if (event && this._listeners[event]) {
            const callbacks = this._listeners[event];
            delete this._listeners[event];

            for (const callback of callbacks) {
                this.emit("removeListener", event, callback);
            }
        }
    };

    eventNames = () => Object.keys(this._listeners);

    listenerCount = (event: string): number => {
        if (event && this._listeners[event]) {
            return this._listeners[event].length;
        }
        return 0;
    };

    listeners = (event:string) => {
        if (event && this._listeners[event]) {
            return this._listeners[event];
        }
        return [];
    };

    _getStack = () => {
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

    emit = (event: string, ...params: any) => {
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
                    const parts = ev.split(".").map((p) => (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
                    const regex = new RegExp(`^${parts.join("\\.")}$`);

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
