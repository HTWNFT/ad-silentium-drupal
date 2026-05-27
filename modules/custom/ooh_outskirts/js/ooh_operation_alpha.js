(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.oohOperationAlpha = {
    attach: function (context) {
      once('ooh-operation-alpha', '[data-ooh-operation-alpha]', context).forEach(function (root) {
        root.setAttribute('data-ooh-operation-alpha-state', 'isolated');
      });
    }
  };
})(Drupal, once);
