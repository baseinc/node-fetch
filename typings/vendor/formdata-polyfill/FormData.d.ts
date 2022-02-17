declare function ensureArgs(args: any, expected: any): void;
/**
 * @param {string} name
 * @param {string | undefined} filename
 * @returns {[string, File|string]}
 */
declare function normalizeArgs(name: string, value: any, filename: string | undefined): [string, File | string];
declare function normalizeLinefeeds(value: any): any;
/**
 * @template T
 * @param {ArrayLike<T>} arr
 * @param {{ (elm: T): void; }} cb
 */
declare function each<T>(arr: ArrayLike<T>, cb: (elm: T) => void): void;
