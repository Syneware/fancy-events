"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = /** @class */ (function () {
    function EventEmitter(_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.mode, mode = _c === void 0 ? "wildcard" : _c, _d = _b.includeStack, includeStack = _d === void 0 ? false : _d;
        this._listeners = {};
        this.mode = "wildcard";
        this.includeStack = false;
        this.addListener = function (event, cb, options) {
            if (options === void 0) { options = {}; }
            if (!_this._listeners[event]) {
                _this._listeners[event] = [];
            }
            _this.emit("newListener", event, cb);
            _this._listeners[event].push({ callback: cb, once: !!(options === null || options === void 0 ? void 0 : options.once) });
        };
        this.on = this.addListener;
        this.once = function (event, cb, options) {
            if (options === void 0) { options = {}; }
            _this.addListener(event, cb, __assign(__assign({}, options), { once: true }));
        };
        this.removeListener = function (event, listener) {
            if (_this._listeners[event]) {
                _this._listeners[event] = _this._listeners[event].filter(function (l) { return (l === null || l === void 0 ? void 0 : l.callback) !== listener; });
                _this.emit("removeListener", event, listener);
            }
        };
        this.off = this.removeListener;
        this.removeAllListeners = function (event) {
            if (event && _this._listeners[event]) {
                var callbacks = _this._listeners[event];
                delete _this._listeners[event];
                for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                    var callback = callbacks_1[_i];
                    _this.emit("removeListener", event, callback);
                }
            }
        };
        this.eventNames = function () { return Object.keys(_this._listeners); };
        this.listenerCount = function (event) {
            if (event && _this._listeners[event]) {
                return _this._listeners[event].length;
            }
            return 0;
        };
        this.listeners = function (event) {
            if (event && _this._listeners[event]) {
                return _this._listeners[event];
            }
            return [];
        };
        this._getStack = function () {
            // @ts-ignore
            var prepareStackTraceOrg = Error.prepareStackTrace;
            var err = new Error();
            // @ts-ignore
            Error.prepareStackTrace = function (_, stack) { return stack; };
            var stacks = err.stack;
            // @ts-ignore
            Error.prepareStackTrace = prepareStackTraceOrg;
            return (stacks === null || stacks === void 0 ? void 0 : stacks.slice(2)) || [];
        };
        this.emit = function (event) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            var eventObject = {
                event: event,
            };
            if (_this.includeStack) {
                // @ts-ignore
                eventObject.stack = _this._getStack().map(function (stack) { return ({
                    typeName: stack.getTypeName(),
                    methodName: stack.getMethodName(),
                    function: stack.getFunction(),
                    functionName: stack.getFunctionName(),
                    fileName: stack.getFileName(),
                    lineNumber: stack.getLineNumber(),
                }); });
            }
            var callListeners = function (e, callbacks) {
                var _a;
                if (callbacks === void 0) { callbacks = []; }
                for (var _i = 0, callbacks_2 = callbacks; _i < callbacks_2.length; _i++) {
                    var callback = callbacks_2[_i];
                    if (callback.once) {
                        _this.removeListener(e, callback === null || callback === void 0 ? void 0 : callback.callback);
                    }
                    (_a = callback === null || callback === void 0 ? void 0 : callback.callback) === null || _a === void 0 ? void 0 : _a.call.apply(_a, __spreadArray([callback, eventObject], params, false));
                }
            };
            if (_this.mode === "wildcard") {
                for (var ev in _this._listeners) {
                    if (Object.prototype.hasOwnProperty.call(_this._listeners, ev)) {
                        var parts = ev.split(".").map(function (p) { return (p === "*" ? "\\w*" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); });
                        var regex = new RegExp("^".concat(parts.join("\\."), "$"));
                        if (regex.test(event)) {
                            callListeners(ev, _this._listeners[ev]);
                        }
                    }
                }
            }
            else if (_this.mode === "regex") {
                for (var ev in _this._listeners) {
                    if (Object.prototype.hasOwnProperty.call(_this._listeners, ev)) {
                        var regex = new RegExp(ev);
                        if (regex.test(event)) {
                            callListeners(ev, _this._listeners[ev]);
                        }
                    }
                }
            }
            else if (Object.prototype.hasOwnProperty.call(_this._listeners, event)) {
                callListeners(event, _this._listeners[event]);
            }
        };
        this.mode = mode;
        this.includeStack = includeStack;
    }
    return EventEmitter;
}());
exports.default = EventEmitter;
