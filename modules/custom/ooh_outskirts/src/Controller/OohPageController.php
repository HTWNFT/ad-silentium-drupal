<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;

class OohPageController extends ControllerBase {

  public function landingpage() {
    $media_dir = DRUPAL_ROOT . '/sites/default/files/adsilentium/loops';
    $media_url = base_path() . 'sites/default/files/adsilentium/loops/';

    $files = glob($media_dir . '/*.mp4') ?: [];

    shuffle($files);
    $files = array_slice($files, 0, 8);

    $loops = [];

    foreach ($files as $index => $file) {
      $loops[] = [
        'index' => $index,
        'url' => $media_url . rawurlencode(basename($file)),
        'active' => $index === 0,
        'index0' => $index,
      ];
    }

    return [
      '#theme' => 'ooh_landing_page',
      '#loops' => $loops,
      '#attached' => [
        'library' => [
          'ooh_outskirts/landing',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  public function clearance() {
    return [
      '#markup' => '<section class="ooh-clearance-page"><div class="ooh-clearance-shell"><h1>CLEARANCE</h1><p>Checkpoint active.</p><p><a href="/STIKWALLET11202025/clearance/credits">Buy Credits</a></p><p><a href="/STIKWALLET11202025/dossier">Continue Free</a></p></div></section>',
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  public function credits() {
    $template = <<<'TWIG'
<section class="ooh-credits-page">
  <div class="ooh-credits-shell">
    <div class="ooh-credits-eyebrow">CREDITS</div>

    <h1 class="ooh-credits-title">PURCHASE OPERATIONAL TIME</h1>

    <p class="ooh-credits-copy">
      Credits can be used for premium mission entry, extended sessions, and future restricted gameplay systems.
    </p>

    <div class="ooh-credits-status">
      <div class="ooh-status-card">
        <span class="ooh-status-label">CURRENT BALANCE</span>
        <strong>0</strong>
      </div>

      <div class="ooh-status-card">
        <span class="ooh-status-label">ACCESS TIER</span>
        <strong>Paid Access Available</strong>
      </div>
    </div>

    <div class="ooh-credit-pack-grid">
      <div class="ooh-credit-pack">
        <span class="ooh-pack-tag">ENTRY</span>
        <h2>60 CREDITS</h2>
        <p>Starter access for premium session entry.</p>
        <a class="ooh-pack-button js-ooh-credit-select" href="#checkout-placeholder" data-credit-package="entry" data-credits="60" data-product-code="credits_entry_60">SELECT</a>
      </div>

      <div class="ooh-credit-pack">
        <span class="ooh-pack-tag">STANDARD</span>
        <h2>180 CREDITS</h2>
        <p>Extended operational time.</p>
        <a class="ooh-pack-button js-ooh-credit-select" href="#checkout-placeholder" data-credit-package="standard" data-credits="180" data-product-code="credits_standard_180">SELECT</a>
      </div>

      <div class="ooh-credit-pack">
        <span class="ooh-pack-tag">FOUNDER</span>
        <h2>480 CREDITS</h2>
        <p>Long-session and premium route access.</p>
        <a class="ooh-pack-button js-ooh-credit-select" href="#checkout-placeholder" data-credit-package="founder" data-credits="480" data-product-code="credits_founder_480">SELECT</a>
      </div>
    </div>

    <div id="checkout-placeholder" class="ooh-credits-feedback" aria-live="polite"></div>

    <div class="ooh-credits-return">
      <a class="ooh-return-link" href="/STIKWALLET11202025/clearance">Back to Clearance</a>
    </div>
  </div>
</section>
TWIG;

    return [
      '#type' => 'inline_template',
      '#template' => $template,
      '#attached' => [
        'library' => [
          'ooh_outskirts/credits',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

}