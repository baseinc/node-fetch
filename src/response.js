"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _headers = require("./headers.js");

var _body = _interopRequireWildcard(require("./body.js"), true);

var _isRedirect = require("./utils/is-redirect.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Response.js
 *
 * Response class provides content decoding
 */
const INTERNALS = Symbol('Response internals');
/**
 * Response class
 *
 * Ref: https://fetch.spec.whatwg.org/#response-class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */

class Response extends _body.default {
  constructor(body = null, options = {}) {
    super(body, options); // eslint-disable-next-line no-eq-null, eqeqeq, no-negated-condition

    const status = options.status != null ? options.status : 200;
    const headers = new _headers(options.headers);

    if (body !== null && !headers.has('Content-Type')) {
      const contentType = (0, _body.extractContentType)(body, this);

      if (contentType) {
        headers.append('Content-Type', contentType);
      }
    }

    this[INTERNALS] = {
      type: 'default',
      url: options.url,
      status,
      statusText: options.statusText || '',
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }

  get type() {
    return this[INTERNALS].type;
  }

  get url() {
    return this[INTERNALS].url || '';
  }

  get status() {
    return this[INTERNALS].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */


  get ok() {
    return this[INTERNALS].status >= 200 && this[INTERNALS].status < 300;
  }

  get redirected() {
    return this[INTERNALS].counter > 0;
  }

  get statusText() {
    return this[INTERNALS].statusText;
  }

  get headers() {
    return this[INTERNALS].headers;
  }

  get highWaterMark() {
    return this[INTERNALS].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */


  clone() {
    return new Response((0, _body.clone)(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */


  static redirect(url, status = 302) {
    if (!(0, _isRedirect.isRedirect)(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }

    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }

  static error() {
    const response = new Response(null, {
      status: 0,
      statusText: ''
    });
    response[INTERNALS].type = 'error';
    return response;
  }

  get [Symbol.toStringTag]() {
    return 'Response';
  }

}

exports.default = Response;
Object.defineProperties(Response.prototype, {
  type: {
    enumerable: true
  },
  url: {
    enumerable: true
  },
  status: {
    enumerable: true
  },
  ok: {
    enumerable: true
  },
  redirected: {
    enumerable: true
  },
  statusText: {
    enumerable: true
  },
  headers: {
    enumerable: true
  },
  clone: {
    enumerable: true
  }
});