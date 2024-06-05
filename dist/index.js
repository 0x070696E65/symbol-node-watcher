"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
const hello = (name) => {
    return `Hello, ${name}!`;
};
exports.hello = hello;
console.log((0, exports.hello)('World'));
