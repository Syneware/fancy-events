interface Listener {
    callback: Function;
    once: boolean;
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
    private _listeners = new Map<string, Listener[]>();
    private _wildcardsRegex = new Map<string, RegExp>();
    private _listenerRegex = new Map<string, RegExp>();

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
            this._listenerRegex.set(event, new RegExp(event))
        }

        this._getListeners(event).push({callback: cb, once: !!options?.once});
    };

    on = this.addListener;

    once = (event: string, cb: Function, options = {}) => {
        return this.addListener(event, cb, {...options, once: true});
    };

    private _removeListener = (event: string, listener: Function) => {
        if (this.listenerCount(event)) {
            let listenerIndex = this._getListeners(event).findIndex((l) => l?.callback === listener);
            if (listenerIndex > -1) {
                this._getListeners(event).splice(listenerIndex, 1);
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
            this._listeners.delete(event);

            for (const callback of callbacks) {
                this.emit("removeListener", event, callback);
            }
        }
        return this;
    };

    eventNames = () => this._listeners.keys();

    listenerCount = (event: string): number => this._getListeners(event)?.length || 0;

    listeners = (event: string) => this._getListeners(event)?.map?.(l => l.callback) || [];

    _getListeners = (event: string) => this._listeners.get(event) || [];

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

    private _callListeners = (event: string, eventObject: EventObject, params: any[]) => {
        for (const listener of this._getListeners(event)) {
            if (listener.once) {
                this._removeListener(event, listener?.callback);
            }
            listener?.callback?.(eventObject, ...params);
        }

    };

    private _callAsyncListeners = (event: string, eventObject: EventObject, params: any[]) => {
        const promises: Promise<any>[] = [];
        for (const callback of this._getListeners(event)) {
            if (callback.once) {
                this._removeListener(event, callback?.callback);
            }
            promises.push(callback?.callback?.(eventObject, ...params));
        }

        return promises;
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
            for (const ev of this._listeners.keys()) {
                if (this._wildcardsRegex.get(ev)?.test?.(event)) {
                    this._callListeners(ev, eventObject, params);
                    listenerFound = true;
                }
            }
        } else if (this.mode === "regex") {
            for (const ev of this._listeners.keys()) {
                if (this._listenerRegex.get(ev)?.test?.(event)) {
                    this._callListeners(ev, eventObject, params);
                    listenerFound = true;
                }
            }
        } else if (this._listeners.has(event)) {
            this._callListeners(event, eventObject, params);
            listenerFound = true;
        }
        return listenerFound;
    };

    emitAsync = async (event: string, ...params: any[]) => {
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

        let promises: Promise<any>[] = [];
        if (this.mode === "wildcard") {
            for (const ev of this._listeners.keys()) {
                if (this._wildcardsRegex.get(ev)?.test?.(event)) {
                    promises.push(...this._callAsyncListeners(ev, eventObject, params));
                }
            }
        } else if (this.mode === "regex") {
            for (const ev of this._listeners.keys()) {
                if (this._listenerRegex.get(ev)?.test?.(event)) {
                    promises.push(...this._callAsyncListeners(ev, eventObject, params));
                }
            }
        } else if (this._listeners.has(event)) {
            promises = this._callAsyncListeners(event, eventObject, params);
        }

        if (promises?.length) {
            await Promise.allSettled(promises);
            return true;
        }
        return false;
    };
}
