(function (Drupal, once) {
  'use strict';

  window.ooh = window.ooh || {};
  window.ooh.state = window.ooh.state || {};
  window.ooh.utils = window.ooh.utils || {};

  window.ooh.utils.qs = function (selector, context) {
    return (context || document).querySelector(selector);
  };

  window.ooh.utils.qsa = function (selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  };

  window.ooh.utils.on = function (target, eventName, handler, options) {
    if (!target || !eventName || !handler) {
      return;
    }
    target.addEventListener(eventName, handler, options || false);
  };

  window.ooh.utils.clamp = function (value, min, max) {
    return Math.min(Math.max(value, min), max);
  };

  Drupal.behaviors.oohBase = {
    attach(context) {
      once('ooh-base', 'body', context).forEach(function () {
        document.body.classList.add('ooh-js-ready');
      });
    }
  };
})(Drupal, once);