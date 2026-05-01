(function (Drupal, once) {
  'use strict';

  function getStoredCredits() {
    const raw = localStorage.getItem('ooh_credits');
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function updateDisplayedBalance(context) {
    const balanceElements = once('ooh-credits-balance', '[data-ooh-current-balance]', context);

    balanceElements.forEach(function (element) {
      element.textContent = getStoredCredits();
    });
  }

  function bindCreditPackButtons(context) {
    const packButtons = once('ooh-credit-pack-button', '[data-ooh-credit-pack]', context);

    packButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();

        const packName = button.getAttribute('data-credit-package');
        const packAmount = button.getAttribute('data-credit-amount');
        const productCode = button.getAttribute('data-product-code');

        if (!packName || !packAmount || !productCode) {
          return;
        }

        const statusMessage = document.querySelector('[data-ooh-credit-status]');
        if (statusMessage) {
          statusMessage.textContent =
            'Checkout coming soon. ' +
            packName.toUpperCase() +
            ' package (' +
            packAmount +
            ' credits, code: ' +
            productCode +
            ') is queued for hosted payment integration.';
        }
      });
    });
  }

  function bindReturnToClearance(context) {
    const returnButtons = once('ooh-return-to-clearance', '[data-ooh-return-clearance]', context);

    returnButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const target = button.getAttribute('href') || button.getAttribute('data-ooh-clearance-url') || '';
        if (target) {
          window.location.href = target;
        }
      });
    });
  }

  Drupal.behaviors.oohCredits = {
    attach: function (context) {
      updateDisplayedBalance(context);
      bindCreditPackButtons(context);
      bindReturnToClearance(context);
    }
  };

})(Drupal, once);
