(function (Drupal, once) {
  'use strict';

  function getStoredCredits() {
    const raw = localStorage.getItem('ooh_credits');
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getStoredAccessTier() {
    return localStorage.getItem('ooh_access_tier') || 'Visitor';
  }

  function updateCreditBalance(context) {
    const balanceElements = once('ooh-clearance-credit-balance', '#ooh-credit-balance', context);

    balanceElements.forEach(function (element) {
      element.textContent = getStoredCredits();
    });
  }

  function updateAccessTier(context) {
    const tierElements = once('ooh-clearance-access-tier', '#ooh-access-tier', context);

    tierElements.forEach(function (element) {
      element.textContent = getStoredAccessTier();
    });
  }

  function bindContinueFree(context) {
    const buttons = once('ooh-clearance-continue-free', '[data-ooh-continue-free]', context);

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        localStorage.setItem('ooh_last_clearance_choice', 'free');
        window.location.href = '/dossier';
      });
    });
  }

  function bindBuyCredits(context) {
    const buttons = once('ooh-clearance-buy-credits', '[data-ooh-buy-credits]', context);

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        localStorage.setItem('ooh_last_clearance_choice', 'paid');
        window.location.href = '/credits';
      });
    });
  }

  Drupal.behaviors.oohClearance = {
    attach: function (context) {
      updateCreditBalance(context);
      updateAccessTier(context);
      bindContinueFree(context);
      bindBuyCredits(context);
    }
  };

})(Drupal, once);