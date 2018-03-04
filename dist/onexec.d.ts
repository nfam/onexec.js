export default class Onexec<T> {
    private _requestedOn;
    readonly requestedOn: Date | null;
    private _completedOn;
    readonly completedOn: Date | null;
    private _executing;
    readonly executing: boolean;
    private readonly _execute;
    private _callbacks;
    constructor(execute: (...args: any[]) => T | Promise<T>);
    private _resolve(result);
    private _reject(error);
    private _doexecute(...args);
    run(...args: any[]): Promise<T>;
    wait(): Promise<void>;
}
