"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.File = void 0;

var _index = require("./index.js");

const _File = class File extends _index {
  #lastModified = 0;
  #name = '';
  /**
   * @param {*[]} fileBits
   * @param {string} fileName
   * @param {{lastModified?: number, type?: string}} options
   */
  // @ts-ignore

  constructor(fileBits, fileName, options = {}) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
    }

    super(fileBits, options);
    if (options === null) options = {}; // Simulate WebIDL type casting for NaN value in lastModified option.

    const lastModified = options.lastModified === undefined ? Date.now() : Number(options.lastModified);

    if (!Number.isNaN(lastModified)) {
      this.#lastModified = lastModified;
    }

    this.#name = String(fileName);
  }

  get name() {
    return this.#name;
  }

  get lastModified() {
    return this.#lastModified;
  }

  get [Symbol.toStringTag]() {
    return 'File';
  }

  static [Symbol.hasInstance](object) {
    return !!object && object instanceof _index && /^(File)$/.test(object[Symbol.toStringTag]);
  }

};
/** @type {typeof globalThis.File} */
// @ts-ignore


const File = _File;
exports.File = File;
var _default = File;
exports.default = _default;