<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Provides the Operation Alpha control page.
 */
final class OohOperationAlphaController extends ControllerBase {

  /**
   * Builds the isolated Operation Alpha page.
   */
  public function page(): array {
    return [
      '#theme' => 'ooh_operation_alpha_page',
      '#attached' => [
        'library' => [
          'ooh_outskirts/operation_alpha',
        ],
      ],
    ];
  }

  /**
   * Builds the Operation Alpha playlist-selection shell.
   */
  public function playlists(): array {
    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--playlists" data-ooh-operation-alpha-playlists>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--playlists">
            <p class="ooh-operation-alpha__eyebrow">PLAYLIST SIGNAL</p>
            <h1 class="ooh-operation-alpha__title">OPERATION ALPHA PLAYLISTS</h1>
            <p class="ooh-operation-alpha__copy">Select a staged signal profile before active runtime opens.</p>
            <div class="ooh-operation-alpha__playlist-grid" aria-label="Operation Alpha playlist shell">
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <img src="/sites/default/files/outskirts/Sigils/scrapbroker.webp" alt="" loading="lazy">
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL A</span>
                  <h2 class="ooh-operation-alpha__playlist-title">WAR BANGAZ</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Impact-forward pressure channel for hostile-field entry.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="war-bangaz" data-playlist-title="WAR BANGAZ">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <img src="/sites/default/files/outskirts/portraits/Recruiters/Asset__Portraits__Recruiters__scrapbroker.webp" alt="" loading="lazy">
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL B</span>
                  <h2 class="ooh-operation-alpha__playlist-title">WAR ROCK</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Guitar-driven field pressure for unstable contact zones.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="war-rock" data-playlist-title="WAR ROCK">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <img src="/sites/default/files/outskirts/Sigils/mergedpathfinder.webp" alt="" loading="lazy">
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL C</span>
                  <h2 class="ooh-operation-alpha__playlist-title">DARK AMBIENT TACTICAL SUSPENSE</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Low-visibility atmosphere for uncertain runtime pressure.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="dark-ambient-tactical-suspense" data-playlist-title="DARK AMBIENT TACTICAL SUSPENSE">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <img src="/sites/default/files/outskirts/portraits/Ronins/Asset__Portraits__Ronins__chatgpt_image_dec_26_2025_05_54_31_pm.webp" alt="" loading="lazy">
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL D</span>
                  <h2 class="ooh-operation-alpha__playlist-title">RONIN SIGNAL</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Sparse renegade channel for broken-cell movement.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="ronin-signal" data-playlist-title="RONIN SIGNAL">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <img src="/sites/default/files/outskirts/backgrounds/bg_warlord_enclave_signal_drift.webp" alt="" loading="lazy">
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL E</span>
                  <h2 class="ooh-operation-alpha__playlist-title">OUTER FOG TRANSMISSION</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Distant field residue for unstable reality drift.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="outer-fog-transmission" data-playlist-title="OUTER FOG TRANSMISSION">SELECT SIGNAL</button>
                </div>
              </article>
            </div>
            <p class="ooh-operation-alpha__playlist-confirmation" data-ooh-alpha-playlist-confirmation aria-live="polite">Awaiting signal selection.</p>
            <div class="ooh-operation-alpha__runtime-handoff" data-ooh-alpha-runtime-handoff hidden>
              <span class="ooh-operation-alpha__runtime-kicker">ACTIVE SIGNAL</span>
              <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-runtime-title>Signal pending.</p>
              <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-runtime-copy>Signal selected. Runtime handoff pending.</p>
              <a class="ooh-operation-alpha__runtime-button" href="/oaplay" data-ooh-alpha-runtime-proceed>PROCEED TO RUNTIME</a>
            </div>
            <p class="ooh-operation-alpha__playlist-note">No playback, account link, or runtime launch is active in this shell.</p>
          </div>
        </section>',
      '#attached' => [
        'library' => [
          'ooh_outskirts/operation_alpha',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Builds the contained Operation Alpha runtime shell.
   */
  public function runtime(): array {
    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--runtime" data-ooh-operation-alpha-runtime>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--runtime">
            <p class="ooh-operation-alpha__eyebrow">RUNTIME ACCESS</p>
            <h1 class="ooh-operation-alpha__title">OPERATION ALPHA RUNTIME</h1>
            <p class="ooh-operation-alpha__copy">Contained runtime shell active. Gameplay authority pending.</p>
            <div class="ooh-operation-alpha__runtime-status">
              <span class="ooh-operation-alpha__runtime-kicker">ACTIVE SIGNAL</span>
              <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-runtime-signal>Signal pending.</p>
              <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-runtime-status>Runtime shell standing by. No simulation is active.</p>
            </div>
            <div class="ooh-operation-alpha__runtime-grid" aria-label="Operation Alpha runtime shell status">
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">FIELD STATE</span>
                <p class="ooh-operation-alpha__runtime-copy">Runtime surface isolated.</p>
              </div>
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">AUTHORITY</span>
                <p class="ooh-operation-alpha__runtime-copy">No combat, mission, timer, payment, or account authority active.</p>
              </div>
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">NEXT PHASE</span>
                <p class="ooh-operation-alpha__runtime-copy">Operational systems pending activation.</p>
              </div>
            </div>
            <a class="ooh-operation-alpha__runtime-button" href="oaplaylists">CHANGE SIGNAL</a>
          </div>
        </section>',
      '#attached' => [
        'library' => [
          'ooh_outskirts/operation_alpha',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

}
