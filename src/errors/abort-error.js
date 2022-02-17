"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AbortError = void 0;

var _base = require("./base.js");

/**
 * AbortError interface for cancelled requests
 */
class AbortError extends _base.FetchBaseError {
  constructor(message, type = 'aborted') {
    super(message, type);
  }

}

exports.AbortError = AbortError;