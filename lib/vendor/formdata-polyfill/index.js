"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormData = void 0;
Object.defineProperty(exports, "formDataToBlob", {
  enumerable: true,
  get: function () {
    return _formdataToBlob.formDataToBlob;
  }
});

require("./FormData");

var _formdataToBlob = require("./formdata-to-blob");

const FormData = global['FormData'];
exports.FormData = FormData;