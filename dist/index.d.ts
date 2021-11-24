interface Listener {
    callback: Function;
    once: boolean;
}
interface EventEmitterOptions {
    mode?: 'wildcard' | 'regex' | 'simple';
    includeStack?: boolean;
    delimiter?: string;
}
export default class EventEmitter {
    private _listeners;
    mode: string;
    includeStack: boolean;
    delimiter: string;
    constructor({ mode, includeStack, delimiter }?: EventEmitterOptions);
    addListener: (event: string, cb: Function, options?: {
        once?: boolean;
    }) => void;
    on: (event: string, cb: Function, options?: {
        once?: boolean;
    }) => void;
    once: (event: string, cb: Function, options?: {}) => void;
    removeListener: (event: string, listener: Function) => void;
    off: (event: string, listener: Function) => void;
    removeAllListeners: (event: string) => void;
    eventNames: () => string[];
    listenerCount: (event: string) => number;
    listeners: (event: string) => Listener[];
    private _getStack;
    emit: (event: string, ...params: any) => void;
}
export {};
