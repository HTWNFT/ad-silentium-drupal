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
              <article class="ooh-operation-alpha__playlist-card">
                <span class="ooh-operation-alpha__playlist-kicker">SIGNAL A</span>
                <h2 class="ooh-operation-alpha__playlist-title">WAR BANGAZ</h2>
                <p class="ooh-operation-alpha__playlist-copy">Impact-forward pressure channel. Runtime handoff pending.</p>
              </article>
              <article class="ooh-operation-alpha__playlist-card">
                <span class="ooh-operation-alpha__playlist-kicker">SIGNAL B</span>
                <h2 class="ooh-operation-alpha__playlist-title">WAR ROCK</h2>
                <p class="ooh-operation-alpha__playlist-copy">Guitar-driven field pressure. Runtime handoff pending.</p>
              </article>
              <article class="ooh-operation-alpha__playlist-card">
                <span class="ooh-operation-alpha__playlist-kicker">SIGNAL C</span>
                <h2 class="ooh-operation-alpha__playlist-title">DARK AMBIENT TACTICAL SUSPENSE</h2>
                <p class="ooh-operation-alpha__playlist-copy">Low-visibility operational atmosphere. Runtime handoff pending.</p>
              </article>
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

}
