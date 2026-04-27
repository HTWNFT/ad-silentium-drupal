(function (Drupal, once) {
  'use strict';

  function getStoredCredits() {
    const raw = localStorage.getItem('ooh_credits');
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function setStoredCredits(amount) {
    localStorage.setItem('ooh_credits', String(amount));
  }

  function setAccessTier(tier) {
    localStorage.setItem('ooh_access_tier', tier);
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

        const packAmount = parseInt(button.getAttribute('data-ooh-credit-pack'), 10);
        const currentCredits = getStoredCredits();
        const newBalance = currentCredits + packAmount;

        if (Number.isNaN(packAmount)) {
          return;
        }

        setStoredCredits(newBalance);
        setAccessTier('Paid');

        const statusMessage = document.querySelector('[data-ooh-credit-status]');
        if (statusMessage) {
          statusMessage.textContent = packAmount + ' credits added. Current balance: ' + newBalance + '.';
        }

        const balanceTargets = document.querySelectorAll('[data-ooh-current-balance]');
        balanceTargets.forEach(function (target) {
          target.textContent = newBalance;
        });

        localStorage.setItem('ooh_last_credit_purchase', String(packAmount));
      });
    });
  }

  function bindReturnToClearance(context) {
    const returnButtons = once('ooh-return-to-clearance', '[data-ooh-return-clearance]', context);

    returnButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        localStorage.setItem('ooh_last_credits_action', 'return_to_clearance');
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
