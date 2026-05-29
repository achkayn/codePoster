// polyfills.js
// Polyfill "global" for SockJS
if (typeof global === 'undefined') {
  window.global = window;
}