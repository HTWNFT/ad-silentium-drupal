<?php

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Component\Utility\Html;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Url;

/**
 * Provides the Ad Silentium landing page block.
 *
 * @Block(
 *   id = "ooh_landing_block",
 *   admin_label = @Translation("OOH Landing Block"),
 *   category = @Translation("Ad Silentium")
 * )
 */
class OohLandingBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    $base_path = rtrim(\Drupal::request()->getBasePath(), '/');
    $dossier_url = Html::escape(Url::fromRoute('ooh_outskirts.dossier')->toString());

    $loops_dir = \Drupal::service('file_system')->realpath('public://adsilentium/loops');
    $loops_web_path = $base_path . '/sites/default/files/adsilentium/loops';

    $loop_files = [];

    if ($loops_dir && is_dir($loops_dir) && is_readable($loops_dir)) {
      $entries = scandir($loops_dir) ?: [];

      foreach ($entries as $entry) {
        $full_path = $loops_dir . DIRECTORY_SEPARATOR . $entry;

        if (
          $entry !== '.' &&
          $entry !== '..' &&
          is_file($full_path) &&
          preg_match('/\.mp4$/i', $entry)
        ) {
          $loop_files[] = $entry;
        }
      }
    }

    $loop_files = array_values(array_unique($loop_files));

    if (!empty($loop_files)) {
      $loop_files = $this->buildDistributedRandomLoopOrder($loop_files);
    }

    $slides_markup = '';

    if (!empty($loop_files)) {
      foreach ($loop_files as $index => $file_name) {
        $is_active = $index === 0 ? ' is-active' : '';
        $aria_hidden = $index === 0 ? 'false' : 'true';
        $file_url = $loops_web_path . '/' . rawurlencode($file_name);
        $file_url_escaped = Html::escape($file_url);

        $slides_markup .= <<<HTML
<div class="ooh-hero__slide ooh-hero__slide--video{$is_active}" aria-hidden="{$aria_hidden}">
  <video class="ooh-hero__video" autoplay muted loop playsinline preload="auto">
    <source src="{$file_url_escaped}" type="video/mp4">
  </video>

     {% endif %}

    <a
      class="ooh-utility-button ooh-system-reset-link"
      href="https://open.spotify.com/playlist/0cZlbYVRnkxwViBJPw8oDR?si=da8354a0326a44c0"
      target="_blank"
      rel="noopener noreferrer"
    >
      SYSTEM RESET
    </a>

</div>

HTML;
      }
    }
    else {
      $slides_markup = <<<HTML
<div class="ooh-hero__slide ooh-hero__slide--fallback is-active" aria-hidden="false">
  <div class="ooh-hero__fallback-message">
    NO LOOP ASSETS FOUND IN /sites/default/files/adsilentium/loops
  </div>
</div>

HTML;
    }

    $template = <<<HTML
<section class="ooh-hero ooh-hero-carousel ooh-hero--random-loops ooh-hero--cinematic" id="ooh-hero" data-ooh-hero>

  <div class="ooh-hero__carousel">
    {$slides_markup}
  </div>

  <div class="ooh-hero__overlay"></div>

  <div class="ooh-hero__inner">
    <p class="ooh-hero__eyebrow">SYSTEM RESET (No Credits Needed)</p>

    <h1 class="ooh-hero__title ooh-game-title">AD SILENTIUM</h1>

    <p class="ooh-hero__subtitle">
      Enter the system. Assemble your dossier. Confirm your signal.
    </p>

    <div class="ooh-hero__actions">
      <a class="ooh-hero__button ooh-hero__button--primary" href="{$dossier_url}">ENTER</a>
      <button class="ooh-hero__button ooh-hero__button--secondary" type="button" data-ooh-prologue-open>
        READ PROLOGUE
      </button>
    </div>
  </div>

  <script>
    (function () {
      var storageKey = 'adSilentiumPrologueSeen';

      function openPrologueOnce() {
        var hasSeen = false;

        try {
          hasSeen = window.localStorage.getItem(storageKey) === '1';
        }
        catch (e) {
          hasSeen = false;
        }

        if (hasSeen) {
          return;
        }

        var opener = document.querySelector('[data-ooh-prologue-open]');

        if (!opener) {
          return;
        }

        try {
          window.localStorage.setItem(storageKey, '1');
        }
        catch (e) {}

        window.setTimeout(function () {
          opener.click();
        }, 700);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', openPrologueOnce, { once: true });
      }
      else {
        openPrologueOnce();
      }
    })();
  </script>

</section>
HTML;

    return [
      '#type' => 'inline_template',
      '#template' => $template,
      '#attached' => [
        'library' => [
          'ooh_outskirts/landing',
          'ooh_outskirts/ooh_hero_modal',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Randomizes loops while reducing repeated adjacent backdrop families.
   *
   * @param array $loop_files
   *   The discovered MP4 filenames.
   *
   * @return array
   *   A randomized, lightly distributed list of MP4 filenames.
   */
  private function buildDistributedRandomLoopOrder(array $loop_files) {
    $groups = [];

    foreach ($loop_files as $file_name) {
      $group_key = preg_replace('/_(core|aftermath|signal_drift|silent_approach)\.mp4$/i', '', $file_name);
      $group_key = $group_key ?: $file_name;
      $groups[$group_key][] = $file_name;
    }

    foreach ($groups as &$group_files) {
      shuffle($group_files);
    }
    unset($group_files);

    $group_keys = array_keys($groups);
    shuffle($group_keys);

    $ordered = [];

    while (!empty($group_keys)) {
      $next_keys = [];

      foreach ($group_keys as $group_key) {
        if (!empty($groups[$group_key])) {
          $ordered[] = array_shift($groups[$group_key]);
        }

        if (!empty($groups[$group_key])) {
          $next_keys[] = $group_key;
        }
      }

      $group_keys = $next_keys;
      shuffle($group_keys);
    }

    return $ordered;
  }

}
