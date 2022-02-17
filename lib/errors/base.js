"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FetchBaseError = void 0;

class FetchBaseError extends Error {
  constructor(message, type) {
    super(message); // Hide custom error implementation details from end-users

    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }

  get name() {
    return this.constructor.name;
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

}

exports.FetchBaseError = FetchBaseError;