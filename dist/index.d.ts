interface Listener {
    callback: Function;
    once: boolean;
}
interface Listeners {
    [key: string]: Listener[];
}
export default class EventEmitter {
    _listeners: Listeners;
    mode: string;
    includeStack: boolean;
    constructor({ mode, includeStack }?: {
        mode?: string | undefined;
        includeStack?: boolean | undefined;
    });
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
    _getStack: () => string | never[];
    emit: (event: string, ...params: any) => void;
}
export {};