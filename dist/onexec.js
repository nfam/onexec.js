(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var immediate = (typeof setImmediate == 'function') ? setImmediate
        : function (handler) {
            setTimeout(handler, 0);
        };
    class Onexec {
        constructor(execute) {
            this._requestedOn = null;
            this._completedOn = null;
            this._execute = execute;
            this._executing = false;
            this._callbacks = [];
        }
        get requestedOn() {
            return this._requestedOn;
        }
        get completedOn() {
            return this._completedOn;
        }
        get executing() {
            return this._executing;
        }
        _resolve(result) {
            this._executing = false;
            this._completedOn = new Date();
            this._callbacks.forEach((callback) => {
                immediate(() => {
                    callback.resolve(result);
                });
            });
            this._callbacks = [];
            return Promise.resolve(result);
        }
        _reject(error) {
            this._executing = false;
            this._completedOn = new Date();
            this._callbacks.forEach((callback) => {
                immediate(() => {
                    callback.reject(error);
                });
            });
            this._callbacks = [];
            return Promise.reject(error);
        }
        _doexecute(...args) {
            this._requestedOn = new Date();
            try {
                var result = this._execute(...args);
                if (typeof result === 'object'
                    && typeof result.then === 'function'
                    && typeof result.catch === 'function') {
                    return result
                        .then((result) => {
                        return this._resolve(result);
                    }, (error) => {
                        return this._reject(error);
                    });
                }
                else {
                    return this._resolve(result);
                }
            }
            catch (error) {
                return this._reject(error);
            }
        }
        run(...args) {
            if (this._executing) {
                return new Promise((resolve, reject) => {
                    if (this._executing) {
                        this._callbacks.push({ resolve, reject });
                    }
                    else {
                        return this._doexecute(...args);
                    }
                });
            }
            else {
                this._executing = true;
                return this._doexecute(...args);
            }
        }
        wait() {
            if (this._executing) {
                return new Promise((resolve, reject) => {
                    if (this._executing) {
                        this._callbacks.push({
                            resolve: () => {
                                resolve();
                            },
                            reject: () => {
                                resolve();
                            }
                        });
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                return Promise.resolve();
            }
        }
    }
    exports.default = Onexec;
});
