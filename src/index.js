"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "AbortError", {
  enumerable: true,
  get: function () {
    return _abortError.AbortError;
  }
});
Object.defineProperty(exports, "Blob", {
  enumerable: true,
  get: function () {
    return _from.Blob;
  }
});
Object.defineProperty(exports, "FetchError", {
  enumerable: true,
  get: function () {
    return _fetchError.FetchError;
  }
});
Object.defineProperty(exports, "File", {
  enumerable: true,
  get: function () {
    return _from.File;
  }
});
Object.defineProperty(exports, "FormData", {
  enumerable: true,
  get: function () {
    return _esmMin.FormData;
  }
});
Object.defineProperty(exports, "Headers", {
  enumerable: true,
  get: function () {
    return _headers.default;
  }
});
Object.defineProperty(exports, "Request", {
  enumerable: true,
  get: function () {
    return _request.default;
  }
});
exports.Response = _response;
Object.defineProperty(exports, "blobFrom", {
  enumerable: true,
  get: function () {
    return _from.blobFrom;
  }
});
Object.defineProperty(exports, "blobFromSync", {
  enumerable: true,
  get: function () {
    return _from.blobFromSync;
  }
});
exports.default = fetch;
Object.defineProperty(exports, "fileFrom", {
  enumerable: true,
  get: function () {
    return _from.fileFrom;
  }
});
Object.defineProperty(exports, "fileFromSync", {
  enumerable: true,
  get: function () {
    return _from.fileFromSync;
  }
});
Object.defineProperty(exports, "isRedirect", {
  enumerable: true,
  get: function () {
    return _isRedirect.isRedirect;
  }
});

var _nodeHttp = require("node:http");

var _nodeHttps = require("node:https");

var _nodeZlib = require("node:zlib");

var _nodeStream = _interopRequireWildcard(require("node:stream"), true);

var _nodeBuffer = require("node:buffer");

var _dataUriToBuffer = require("data-uri-to-buffer");

var _body = require("./body.js");

var _response = require("./response.js");

var _headers = _interopRequireWildcard(require("./headers.js"), true);

var _request = _interopRequireWildcard(require("./request.js"), true);

var _fetchError = require("./errors/fetch-error.js");

var _abortError = require("./errors/abort-error.js");

var _isRedirect = require("./utils/is-redirect.js");

var _esmMin = require("formdata-polyfill/esm.min.js");

var _is = require("./utils/is.js");

var _referrer = require("./utils/referrer.js");

var _from = require("fetch-blob/from.js");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Index.js
 *
 * a request API compatible with window.fetch
 *
 * All spec algorithm step numbers are based on https://fetch.spec.whatwg.org/commit-snapshots/ae716822cb3a61843226cd090eefc6589446c1d2/.
 */
const supportedSchemas = new Set(['data:', 'http:', 'https:']);
/**
 * Fetch function
 *
 * @param   {string | URL | import('./request').default} url - Absolute url or Request instance
 * @param   {*} [options_] - Fetch options
 * @return  {Promise<import('./response').default>}
 */

async function fetch(url, options_) {
  return new Promise((resolve, reject) => {
    // Build request object
    const request = new _request.default(url, options_);
    const {
      parsedURL,
      options
    } = (0, _request.getNodeRequestOptions)(request);

    if (!supportedSchemas.has(parsedURL.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, '')}" is not supported.`);
    }

    if (parsedURL.protocol === 'data:') {
      const data = _dataUriToBuffer(request.url);

      const response = new _response(data, {
        headers: {
          'Content-Type': data.typeFull
        }
      });
      resolve(response);
      return;
    } // Wrap http.request into fetch


    const send = (parsedURL.protocol === 'https:' ? _nodeHttps : _nodeHttp).request;
    const {
      signal
    } = request;
    let response = null;

    const abort = () => {
      const error = new _abortError.AbortError('The operation was aborted.');
      reject(error);

      if (request.body && request.body instanceof _nodeStream.default.Readable) {
        request.body.destroy(error);
      }

      if (!response || !response.body) {
        return;
      }

      response.body.emit('error', error);
    };

    if (signal && signal.aborted) {
      abort();
      return;
    }

    const abortAndFinalize = () => {
      abort();
      finalize();
    }; // Send request


    const request_ = send(parsedURL.toString(), options);

    if (signal) {
      signal.addEventListener('abort', abortAndFinalize);
    }

    const finalize = () => {
      request_.abort();

      if (signal) {
        signal.removeEventListener('abort', abortAndFinalize);
      }
    };

    request_.on('error', error => {
      reject(new _fetchError.FetchError(`request to ${request.url} failed, reason: ${error.message}`, 'system', error));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, error => {
      response.body.destroy(error);
    });
    /* c8 ignore next 18 */

    if (process.version < 'v14') {
      // Before Node.js 14, pipeline() does not fully support async iterators and does not always
      // properly handle when the socket close/end events are out of order.
      request_.on('socket', s => {
        let endedWithEventsCount;
        s.prependListener('end', () => {
          endedWithEventsCount = s._eventsCount;
        });
        s.prependListener('close', hadError => {
          // if end happened before close but the socket didn't emit an error, do it now
          if (response && endedWithEventsCount < s._eventsCount && !hadError) {
            const error = new Error('Premature close');
            error.code = 'ERR_STREAM_PREMATURE_CLOSE';
            response.body.emit('error', error);
          }
        });
      });
    }

    request_.on('response', response_ => {
      request_.setTimeout(0);
      const headers = (0, _headers.fromRawHeaders)(response_.rawHeaders); // HTTP fetch step 5

      if ((0, _isRedirect.isRedirect)(response_.statusCode)) {
        // HTTP fetch step 5.2
        const location = headers.get('Location'); // HTTP fetch step 5.3

        let locationURL = null;

        try {
          locationURL = location === null ? null : new URL(location, request.url);
        } catch {
          // error here can only be invalid URL in Location: header
          // do not throw when options.redirect == manual
          // let the user extract the errorneous redirect URL
          if (request.redirect !== 'manual') {
            reject(new _fetchError.FetchError(`uri requested responds with an invalid redirect URL: ${location}`, 'invalid-redirect'));
            finalize();
            return;
          }
        } // HTTP fetch step 5.5


        switch (request.redirect) {
          case 'error':
            reject(new _fetchError.FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, 'no-redirect'));
            finalize();
            return;

          case 'manual':
            // Nothing to do
            break;

          case 'follow':
            {
              // HTTP-redirect fetch step 2
              if (locationURL === null) {
                break;
              } // HTTP-redirect fetch step 5


              if (request.counter >= request.follow) {
                reject(new _fetchError.FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
                finalize();
                return;
              } // HTTP-redirect fetch step 6 (counter increment)
              // Create a new Request object.


              const requestOptions = {
                headers: new _headers.default(request.headers),
                follow: request.follow,
                counter: request.counter + 1,
                agent: request.agent,
                compress: request.compress,
                method: request.method,
                body: (0, _body.clone)(request),
                signal: request.signal,
                size: request.size,
                referrer: request.referrer,
                referrerPolicy: request.referrerPolicy
              }; // when forwarding sensitive headers like "Authorization",
              // "WWW-Authenticate", and "Cookie" to untrusted targets,
              // headers will be ignored when following a redirect to a domain
              // that is not a subdomain match or exact match of the initial domain.
              // For example, a redirect from "foo.com" to either "foo.com" or "sub.foo.com"
              // will forward the sensitive headers, but a redirect to "bar.com" will not.

              if (!(0, _is.isDomainOrSubdomain)(request.url, locationURL)) {
                for (const name of ['authorization', 'www-authenticate', 'cookie', 'cookie2']) {
                  requestOptions.headers.delete(name);
                }
              } // HTTP-redirect fetch step 9


              if (response_.statusCode !== 303 && request.body && options_.body instanceof _nodeStream.default.Readable) {
                reject(new _fetchError.FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
                finalize();
                return;
              } // HTTP-redirect fetch step 11


              if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === 'POST') {
                requestOptions.method = 'GET';
                requestOptions.body = undefined;
                requestOptions.headers.delete('content-length');
              } // HTTP-redirect fetch step 14


              const responseReferrerPolicy = (0, _referrer.parseReferrerPolicyFromHeader)(headers);

              if (responseReferrerPolicy) {
                requestOptions.referrerPolicy = responseReferrerPolicy;
              } // HTTP-redirect fetch step 15


              resolve(fetch(new _request.default(locationURL, requestOptions)));
              finalize();
              return;
            }

          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      } // Prepare response


      if (signal) {
        response_.once('end', () => {
          signal.removeEventListener('abort', abortAndFinalize);
        });
      }

      let body = (0, _nodeStream.pipeline)(response_, new _nodeStream.PassThrough(), error => {
        if (error) {
          reject(error);
        }
      }); // see https://github.com/nodejs/node/pull/29376

      /* c8 ignore next 3 */

      if (process.version < 'v12.10') {
        response_.on('aborted', abortAndFinalize);
      }

      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      }; // HTTP-network fetch step 12.1.1.3

      const codings = headers.get('Content-Encoding'); // HTTP-network fetch step 12.1.1.4: handle content codings
      // in following scenarios we ignore compression support
      // 1. compression support is disabled
      // 2. HEAD request
      // 3. no Content-Encoding header
      // 4. no content response (204)
      // 5. content not modified response (304)

      if (!request.compress || request.method === 'HEAD' || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new _response(body, responseOptions);
        resolve(response);
        return;
      } // For Node v6+
      // Be less strict when decoding compressed responses, since sometimes
      // servers send slightly invalid responses that are still accepted
      // by common browsers.
      // Always using Z_SYNC_FLUSH is what cURL does.


      const zlibOptions = {
        flush: _nodeZlib.Z_SYNC_FLUSH,
        finishFlush: _nodeZlib.Z_SYNC_FLUSH
      }; // For gzip

      if (codings === 'gzip' || codings === 'x-gzip') {
        body = (0, _nodeStream.pipeline)(body, _nodeZlib.createGunzip(zlibOptions), error => {
          if (error) {
            reject(error);
          }
        });
        response = new _response(body, responseOptions);
        resolve(response);
        return;
      } // For deflate


      if (codings === 'deflate' || codings === 'x-deflate') {
        // Handle the infamous raw deflate response from old servers
        // a hack for old IIS and Apache servers
        const raw = (0, _nodeStream.pipeline)(response_, new _nodeStream.PassThrough(), error => {
          if (error) {
            reject(error);
          }
        });
        raw.once('data', chunk => {
          // See http://stackoverflow.com/questions/37519828
          if ((chunk[0] & 0x0F) === 0x08) {
            body = (0, _nodeStream.pipeline)(body, _nodeZlib.createInflate(), error => {
              if (error) {
                reject(error);
              }
            });
          } else {
            body = (0, _nodeStream.pipeline)(body, _nodeZlib.createInflateRaw(), error => {
              if (error) {
                reject(error);
              }
            });
          }

          response = new _response(body, responseOptions);
          resolve(response);
        });
        raw.once('end', () => {
          // Some old IIS servers return zero-length OK deflate responses, so
          // 'data' is never emitted. See https://github.com/node-fetch/node-fetch/pull/903
          if (!response) {
            response = new _response(body, responseOptions);
            resolve(response);
          }
        });
        return;
      } // For br


      if (codings === 'br') {
        body = (0, _nodeStream.pipeline)(body, _nodeZlib.createBrotliDecompress(), error => {
          if (error) {
            reject(error);
          }
        });
        response = new _response(body, responseOptions);
        resolve(response);
        return;
      } // Otherwise, use response as-is


      response = new _response(body, responseOptions);
      resolve(response);
    }); // eslint-disable-next-line promise/prefer-await-to-then

    (0, _body.writeToStream)(request_, request).catch(reject);
  });
}

function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = _nodeBuffer.Buffer.from('0\r\n\r\n');

  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on('response', response => {
    const {
      headers
    } = response;
    isChunkedTransfer = headers['transfer-encoding'] === 'chunked' && !headers['content-length'];
  });
  request.on('socket', socket => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error = new Error('Premature close');
        error.code = 'ERR_STREAM_PREMATURE_CLOSE';
        errorCallback(error);
      }
    };

    socket.prependListener('close', onSocketClose);
    request.on('abort', () => {
      socket.removeListener('close', onSocketClose);
    });
    socket.on('data', buf => {
      properLastChunkReceived = _nodeBuffer.Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0; // Sometimes final 0-length chunk and end of message code are in separate packets

      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = _nodeBuffer.Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && _nodeBuffer.Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }

      previousChunk = buf;
    });
  });
}