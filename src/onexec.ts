interface Callback {
    resolve: Function,
    reject: Function
}

var immediate: (handler: (...args: any[]) => void) => void =
    (typeof setImmediate == 'function') ? setImmediate
    : function(handler: (...args: any[]) => void) {
        setTimeout(handler, 0)
    }

export default class Onexec<T> {

    private _requestedOn: Date|null;
    get requestedOn(): Date|null {
        return this._requestedOn;
    }

    private _completedOn: Date|null;
    get completedOn(): Date|null {
        return this._completedOn;
    }

    private _executing: boolean;
    get executing(): boolean {
        return this._executing;
    }

    private readonly _execute: (...args: any[]) => T | Promise<T>;
    private _callbacks: Callback[];

    constructor(execute: (...args: any[]) => T | Promise<T>) {
        this._requestedOn = null;
        this._completedOn = null;
        this._execute = execute;
        this._executing = false;
        this._callbacks = [];
    }

    private _resolve(result: T): Promise<T> {
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

    private _reject(error: Error): Promise<T> {
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

    private _doexecute(...args: any[]): Promise<T> {
        this._requestedOn = new Date();

        try {
            var result = this._execute(...args);
            if (typeof result === 'object'
            && typeof (result as any).then === 'function'
            && typeof (result as any).catch === 'function') {
                return (result as Promise<T>)
                .then((result) => {
                    return this._resolve(result)
                }, (error) => {
                    return this._reject(error);
                });
            }
            else {
                return this._resolve(result as T);
            }
        }
        catch (error) {
            return this._reject(error);
        }
    }

    run(...args: any[]): Promise<T> {
        if (this._executing) {
            return new Promise<T>((resolve, reject) => {
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

    wait(): Promise<void> {
        if (this._executing) {
            return new Promise<void>((resolve, reject) => {
                if (this._executing) {
                    this._callbacks.push({
                        resolve: () => {
                            resolve()
                        },
                        reject: () => {
                            resolve()
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
