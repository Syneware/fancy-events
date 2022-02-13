interface EventEmitterOptions {
    mode?: 'wildcard' | 'regex' | 'simple';
    includeStack?: boolean;
    delimiter?: string;
}
export default class EventEmitter {
    private _listeners;
    private _wildcardsRegex;
    private _listenerRegex;
    mode: string;
    includeStack: boolean;
    delimiter: string;
    constructor({ mode, includeStack, delimiter }?: EventEmitterOptions);
    addListener: (event: string | string[], cb: Function, options?: {
        once?: boolean;
    }) => EventEmitter;
    private _addListener;
    on: (event: string | string[], cb: Function, options?: {
        once?: boolean;
    }) => EventEmitter;
    once: (event: string, cb: Function, options?: {}) => EventEmitter;
    private _removeListener;
    removeListener: (event: string, listener: Function) => EventEmitter;
    off: (event: string, listener: Function) => EventEmitter;
    removeAllListeners: (event: string) => EventEmitter;
    eventNames: () => string[];
    listenerCount: (event: string) => number;
    listeners: (event: string) => Function[];
    private _getStack;
    private _callListeners;
    private _callAsyncListeners;
    emit: (event: string, ...params: any[]) => boolean;
    emitAsync: (event: string, ...params: any[]) => Promise<boolean>;
}
export {};
