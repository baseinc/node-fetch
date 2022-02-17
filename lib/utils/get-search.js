"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSearch = void 0;

const getSearch = parsedURL => {
  if (parsedURL.search) {
    return parsedURL.search;
  }

  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === '#' ? '#' : '');
  return parsedURL.href[lastOffset - hash.length] === '?' ? '?' : '';
};

exports.getSearch = getSearch;