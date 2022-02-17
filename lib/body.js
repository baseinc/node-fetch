"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeToStream = exports.getTotalBytes = exports.extractContentType = exports.default = exports.clone = void 0;

var _nodeStream = _interopRequireWildcard(require("node:stream"), true);

var _nodeUtil = require("node:util");

var _nodeBuffer = require("node:buffer");

var _fetchBlob = require("./vendor/fetch-blob");

var _formdataMin = require("formdata-polyfill/formdata.min.js");

var _fetchError = require("./errors/fetch-error.js");

var _base = require("./errors/base.js");

var _is = require("./utils/is.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Body.js
 *
 * Body interface provides common methods for Request and Response
 */
const pipeline = (0, _nodeUtil.promisify)(_nodeStream.default.pipeline);
const INTERNALS = Symbol('Body internals');
/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */

class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;

    if (body === null) {
      // Body is undefined or null
      body = null;
    } else if ((0, _is.isURLSearchParameters)(body)) {
      // Body is a URLSearchParams
      body = _nodeBuffer.Buffer.from(body.toString());
    } else if ((0, _is.isBlob)(body)) {// Body is blob
    } else if (_nodeBuffer.Buffer.isBuffer(body)) {// Body is Buffer
    } else if (_nodeUtil.types.isAnyArrayBuffer(body)) {
      // Body is ArrayBuffer
      body = _nodeBuffer.Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      // Body is ArrayBufferView
      body = _nodeBuffer.Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof _nodeStream.default) {// Body is stream
    } else if (body instanceof _formdataMin.FormData) {
      // Body is FormData
      body = (0, _formdataMin.formDataToBlob)(body);
      boundary = body.type.split('=')[1];
    } else {
      // None of the above
      // coerce to string then buffer
      body = _nodeBuffer.Buffer.from(String(body));
    }

    let stream = body;

    if (_nodeBuffer.Buffer.isBuffer(body)) {
      stream = _nodeStream.default.Readable.from(body);
    } else if ((0, _is.isBlob)(body)) {
      stream = _nodeStream.default.Readable.from(body.stream());
    }

    this[INTERNALS] = {
      body,
      stream,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;

    if (body instanceof _nodeStream.default) {
      body.on('error', error_ => {
        const error = error_ instanceof _base.FetchBaseError ? error_ : new _fetchError.FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, 'system', error_);
        this[INTERNALS].error = error;
      });
    }
  }

  get body() {
    return this[INTERNALS].stream;
  }

  get bodyUsed() {
    return this[INTERNALS].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */


  async arrayBuffer() {
    const {
      buffer,
      byteOffset,
      byteLength
    } = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  async formData() {
    const ct = this.headers.get('content-type');

    if (ct.startsWith('application/x-www-form-urlencoded')) {
      const formData = new _formdataMin.FormData();
      const parameters = new URLSearchParams(await this.text());

      for (const [name, value] of parameters) {
        formData.append(name, value);
      }

      return formData;
    }

    const {
      toFormData
    } = await import('./utils/multipart-parser.js');
    return toFormData(this.body, ct);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */


  async blob() {
    const ct = this.headers && this.headers.get('content-type') || this[INTERNALS].body && this[INTERNALS].body.type || '';
    const buf = await this.arrayBuffer();
    return new _fetchBlob([buf], {
      type: ct
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */


  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */


  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */


  buffer() {
    return consumeBody(this);
  }

}

exports.default = Body;
Body.prototype.buffer = (0, _nodeUtil.deprecate)(Body.prototype.buffer, 'Please use \'response.arrayBuffer()\' instead of \'response.buffer()\'', 'node-fetch#buffer'); // In browsers, all properties are enumerable.

Object.defineProperties(Body.prototype, {
  body: {
    enumerable: true
  },
  bodyUsed: {
    enumerable: true
  },
  arrayBuffer: {
    enumerable: true
  },
  blob: {
    enumerable: true
  },
  json: {
    enumerable: true
  },
  text: {
    enumerable: true
  },
  data: {
    get: (0, _nodeUtil.deprecate)(() => {}, 'data doesn\'t exist, use json(), text(), arrayBuffer(), or body instead', 'https://github.com/node-fetch/node-fetch/issues/1000 (response)')
  }
});
/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return Promise
 */

async function consumeBody(data) {
  if (data[INTERNALS].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }

  data[INTERNALS].disturbed = true;

  if (data[INTERNALS].error) {
    throw data[INTERNALS].error;
  }

  const {
    body
  } = data; // Body is null

  if (body === null) {
    return _nodeBuffer.Buffer.alloc(0);
  }
  /* c8 ignore next 3 */


  if (!(body instanceof _nodeStream.default)) {
    return _nodeBuffer.Buffer.alloc(0);
  } // Body is stream
  // get ready to actually consume the body


  const accum = [];
  let accumBytes = 0;

  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error = new _fetchError.FetchError(`content size at ${data.url} over limit: ${data.size}`, 'max-size');
        body.destroy(error);
        throw error;
      }

      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error) {
    const error_ = error instanceof _base.FetchBaseError ? error : new _fetchError.FetchError(`Invalid response body while trying to fetch ${data.url}: ${error.message}`, 'system', error);
    throw error_;
  }

  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every(c => typeof c === 'string')) {
        return _nodeBuffer.Buffer.from(accum.join(''));
      }

      return _nodeBuffer.Buffer.concat(accum, accumBytes);
    } catch (error) {
      throw new _fetchError.FetchError(`Could not create Buffer from response body for ${data.url}: ${error.message}`, 'system', error);
    }
  } else {
    throw new _fetchError.FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed   instance       Response or Request instance
 * @param   String  highWaterMark  highWaterMark for both PassThrough body streams
 * @return  Mixed
 */


const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {
    body
  } = instance[INTERNALS]; // Don't allow cloning a used body

  if (instance.bodyUsed) {
    throw new Error('cannot clone body after it is used');
  } // Check that body is a stream and not form-data object
  // note: we can't clone the form-data object without having it as a dependency


  if (body instanceof _nodeStream.default && typeof body.getBoundary !== 'function') {
    // Tee instance body
    p1 = new _nodeStream.PassThrough({
      highWaterMark
    });
    p2 = new _nodeStream.PassThrough({
      highWaterMark
    });
    body.pipe(p1);
    body.pipe(p2); // Set instance body to teed body and return the other teed body

    instance[INTERNALS].stream = p1;
    body = p2;
  }

  return body;
};

exports.clone = clone;
const getNonSpecFormDataBoundary = (0, _nodeUtil.deprecate)(body => body.getBoundary(), 'form-data doesn\'t follow the spec and requires special treatment. Use alternative package', 'https://github.com/node-fetch/node-fetch/issues/1167');
/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param {any} body Any options.body input
 * @returns {string | null}
 */

const extractContentType = (body, request) => {
  // Body is null or undefined
  if (body === null) {
    return null;
  } // Body is string


  if (typeof body === 'string') {
    return 'text/plain;charset=UTF-8';
  } // Body is a URLSearchParams


  if ((0, _is.isURLSearchParameters)(body)) {
    return 'application/x-www-form-urlencoded;charset=UTF-8';
  } // Body is blob


  if ((0, _is.isBlob)(body)) {
    return body.type || null;
  } // Body is a Buffer (Buffer, ArrayBuffer or ArrayBufferView)


  if (_nodeBuffer.Buffer.isBuffer(body) || _nodeUtil.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }

  if (body instanceof _formdataMin.FormData) {
    return `multipart/form-data; boundary=${request[INTERNALS].boundary}`;
  } // Detect form data input from form-data module


  if (body && typeof body.getBoundary === 'function') {
    return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`;
  } // Body is stream - can't really do much about this


  if (body instanceof _nodeStream.default) {
    return null;
  } // Body constructor defaults other things to string


  return 'text/plain;charset=UTF-8';
};
/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param {any} obj.body Body object from the Body instance.
 * @returns {number | null}
 */


exports.extractContentType = extractContentType;

const getTotalBytes = request => {
  const {
    body
  } = request[INTERNALS]; // Body is null or undefined

  if (body === null) {
    return 0;
  } // Body is Blob


  if ((0, _is.isBlob)(body)) {
    return body.size;
  } // Body is Buffer


  if (_nodeBuffer.Buffer.isBuffer(body)) {
    return body.length;
  } // Detect form data input from form-data module


  if (body && typeof body.getLengthSync === 'function') {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  } // Body is stream


  return null;
};
/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param {Stream.Writable} dest The stream to write to.
 * @param obj.body Body object from the Body instance.
 * @returns {Promise<void>}
 */


exports.getTotalBytes = getTotalBytes;

const writeToStream = async (dest, {
  body
}) => {
  if (body === null) {
    // Body is null
    dest.end();
  } else {
    // Body is stream
    await pipeline(body, dest);
  }
};

exports.writeToStream = writeToStream;