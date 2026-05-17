(function (Drupal, once) {
  Drupal.behaviors.oohClearance = {
    attach: function (context) {
      once('ooh-clearance', '.ooh-clearance-page', context).forEach(function () {
        // Clearance page initialized.
      });
    }
  };
})(Drupal, once);
