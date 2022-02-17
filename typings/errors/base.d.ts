export class FetchBaseError extends Error {
    constructor(message: any, type: any);
    type: any;
    get [Symbol.toStringTag](): string;
}
