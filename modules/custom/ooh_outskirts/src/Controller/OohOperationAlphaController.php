<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;

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
   * Builds the Operation Alpha credit purchase staging page.
   */
  public function credits(): array {
    return [
      '#theme' => 'ooh_operation_alpha_credits',
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
   * Builds the Operation Alpha playlist-selection shell.
   */
  public function playlists(): array {
    $home_url = Url::fromRoute('<front>')->toString();
    $runtime_url = Url::fromRoute('ooh_outskirts.operation_alpha_nested_runtime')->toString();
    $credits_url = Url::fromRoute('ooh_outskirts.operation_alpha_credits')->toString();
    $login_url = Url::fromRoute('user.login')->toString();
    $war_bangaz_url = '';
    $signal_blitz_url = '';
    $dust_march_url = '';
    $black_banner_url = '';
    $steel_wreckoning_url = '';
    $system_reset_url = 'https://open.spotify.com/playlist/0cZlbYVRnkxwViBJPw8oDR';

    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--playlists" data-ooh-operation-alpha-playlists>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--playlists">
            <nav class="ooh-operation-alpha__cta-row" aria-label="Operation Alpha account and credits">
              <a class="ooh-operation-alpha__cta-link" href="' . $home_url . '">RETURN TO LAUNCH</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $credits_url . '">PURCHASE CREDITS</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $login_url . '">LOGIN / ACCOUNT</a>
            </nav>
            <p class="ooh-operation-alpha__eyebrow">PLAYLIST SIGNAL</p>
            <h1 class="ooh-operation-alpha__title">OPERATION ALPHA PLAYLISTS</h1>
            <p class="ooh-operation-alpha__copy">Select a staged signal profile before active runtime opens.</p>
            <div class="ooh-operation-alpha__playlist-grid" aria-label="Operation Alpha playlist shell">
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">SIGNAL A</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL A</span>
                  <h2 class="ooh-operation-alpha__playlist-title">War Bangaz</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Impact-forward pressure channel for hostile-field entry.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="war-bangaz" data-playlist-title="War Bangaz" data-playlist-url="' . $war_bangaz_url . '" data-playlist-cadence="Impact-forward pressure">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">SIGNAL B</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL B</span>
                  <h2 class="ooh-operation-alpha__playlist-title">Signal Blitz</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Fast-mark signal pressure for immediate runtime alignment.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="signal-blitz" data-playlist-title="Signal Blitz" data-playlist-url="' . $signal_blitz_url . '" data-playlist-cadence="Fast-mark pressure">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">SIGNAL C</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL C</span>
                  <h2 class="ooh-operation-alpha__playlist-title">Dust March</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Forward field cadence for long-range signal movement.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="dust-march" data-playlist-title="Dust March" data-playlist-url="' . $dust_march_url . '" data-playlist-cadence="Forward field cadence">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">SIGNAL D</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL D</span>
                  <h2 class="ooh-operation-alpha__playlist-title">Black Banner</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Heavy signal channel for hostile threshold pressure.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="black-banner" data-playlist-title="Black Banner" data-playlist-url="' . $black_banner_url . '" data-playlist-cadence="Heavy threshold pressure">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">SIGNAL E</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL E</span>
                  <h2 class="ooh-operation-alpha__playlist-title">Steel Wreckoning</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Industrial impact channel for contained runtime staging.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="steel-wreckoning" data-playlist-title="Steel Wreckoning" data-playlist-url="' . $steel_wreckoning_url . '" data-playlist-cadence="Industrial impact cadence">SELECT SIGNAL</button>
                </div>
              </article>
              <article class="ooh-operation-alpha__playlist-card ooh-operation-alpha__playlist-card--outbound" data-ooh-alpha-playlist-card>
                <div class="ooh-operation-alpha__playlist-visual">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true">RESET</span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL F</span>
                  <h2 class="ooh-operation-alpha__playlist-title">System Reset (Free)</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Outbound static reset signal. No playback or provider connection is active here.</p>
                  <a class="ooh-operation-alpha__playlist-select" href="' . $system_reset_url . '" target="_blank" rel="noopener noreferrer">OPEN CHANNEL</a>
                </div>
              </article>
            </div>
            <p class="ooh-operation-alpha__playlist-confirmation" data-ooh-alpha-playlist-confirmation aria-live="polite">Awaiting signal selection.</p>
            <div class="ooh-operation-alpha__runtime-handoff" data-ooh-alpha-runtime-handoff hidden>
              <span class="ooh-operation-alpha__runtime-kicker">ACTIVE SIGNAL</span>
              <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-runtime-title>Signal pending.</p>
              <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-runtime-copy>Signal selected. Runtime handoff pending.</p>
              <a class="ooh-operation-alpha__channel-link" href="#" target="_blank" rel="noopener noreferrer" data-ooh-alpha-playlist-channel-link hidden>OPEN CHANNEL</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $runtime_url . '" data-ooh-alpha-runtime-proceed>PROCEED TO RUNTIME</a>
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
    $home_url = Url::fromRoute('<front>')->toString();
    $playlists_url = Url::fromRoute('ooh_outskirts.operation_alpha_nested_playlists')->toString();
    $operation_url = Url::fromRoute('ooh_outskirts.operation_alpha_operation')->toString();
    $credits_url = Url::fromRoute('ooh_outskirts.operation_alpha_credits')->toString();
    $login_url = Url::fromRoute('user.login')->toString();

    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--runtime" data-ooh-operation-alpha-runtime>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--runtime">
            <nav class="ooh-operation-alpha__cta-row" aria-label="Operation Alpha account and credits">
              <a class="ooh-operation-alpha__cta-link" href="' . $home_url . '">RETURN TO LAUNCH</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $credits_url . '">PURCHASE CREDITS</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $login_url . '">LOGIN / ACCOUNT</a>
            </nav>
            <p class="ooh-operation-alpha__eyebrow">RUNTIME ACCESS</p>
            <h1 class="ooh-operation-alpha__title">OPERATION ALPHA RUNTIME</h1>
            <p class="ooh-operation-alpha__copy">Contained runtime shell active. Gameplay authority pending.</p>
            <div class="ooh-operation-alpha__runtime-status">
              <span class="ooh-operation-alpha__runtime-kicker">ACTIVE SIGNAL</span>
              <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-runtime-signal>Signal pending.</p>
              <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-runtime-status>Runtime shell standing by. No simulation is active.</p>
              <a class="ooh-operation-alpha__channel-link" href="#" target="_blank" rel="noopener noreferrer" data-ooh-alpha-runtime-channel-link hidden>OPEN CHANNEL</a>
            </div>
            <div class="ooh-operation-alpha__runtime-grid" aria-label="Operation Alpha runtime shell status">
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">FIELD STATE</span>
                <p class="ooh-operation-alpha__runtime-copy">Runtime surface isolated.</p>
              </div>
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">AUTHORITY</span>
                <p class="ooh-operation-alpha__runtime-copy">No combat, timer, payment, account, or progression authority active.</p>
              </div>
              <div class="ooh-operation-alpha__runtime-cell">
                <span class="ooh-operation-alpha__runtime-kicker">NEXT PHASE</span>
                <p class="ooh-operation-alpha__runtime-copy">Operational systems pending activation.</p>
              </div>
            </div>
            <div class="ooh-operation-alpha__runtime-actions">
              <a class="ooh-operation-alpha__runtime-button" href="' . $playlists_url . '">CHANGE SIGNAL</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $operation_url . '" data-ooh-alpha-begin-operation>BEGIN OPERATION</a>
              <a class="ooh-operation-alpha__runtime-button ooh-operation-alpha__runtime-button--home" href="' . $home_url . '">HOME</a>
            </div>
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
   * Builds the contained active Operation Alpha operation surface.
   */
  public function operation(): array {
    $home_url = Url::fromRoute('<front>')->toString();
    $runtime_url = Url::fromRoute('ooh_outskirts.operation_alpha_nested_runtime')->toString();
    $credits_url = Url::fromRoute('ooh_outskirts.operation_alpha_credits')->toString();
    $login_url = Url::fromRoute('user.login')->toString();

    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--operation" data-ooh-operation-alpha-operation>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--operation">
            <nav class="ooh-operation-alpha__cta-row" aria-label="Operation Alpha account and credits">
              <a class="ooh-operation-alpha__cta-link" href="' . $home_url . '">RETURN TO LAUNCH</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $credits_url . '">PURCHASE CREDITS</a>
              <a class="ooh-operation-alpha__cta-link" href="' . $login_url . '">LOGIN / ACCOUNT</a>
            </nav>
            <p class="ooh-operation-alpha__eyebrow">ACTIVE OPERATION</p>
            <h1 class="ooh-operation-alpha__title">OPERATION ACTIVE</h1>
            <p class="ooh-operation-alpha__copy">Operation staging surface active. Gameplay authority remains pending.</p>
            <section class="ooh-operation-alpha__operation-panel" aria-label="Active Operation briefing">
              <div class="ooh-operation-alpha__operation-head">
                <span class="ooh-operation-alpha__runtime-kicker">ACTIVE OPERATION</span>
                <strong class="ooh-operation-alpha__operation-field" data-ooh-alpha-operation-field>FIELD OPEN</strong>
              </div>
              <div class="ooh-operation-alpha__operation-grid">
                <div class="ooh-operation-alpha__runtime-cell">
                  <span class="ooh-operation-alpha__runtime-kicker">MARK</span>
                  <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-operation-mark>Mark pending.</p>
                  <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-operation-mark-status>Signal mark resolving.</p>
                </div>
                <div class="ooh-operation-alpha__runtime-cell">
                  <span class="ooh-operation-alpha__runtime-kicker">MISSION SOURCE</span>
                  <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-operation-source>Mission source pending.</p>
                  <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-operation-atmosphere>Atmosphere pending.</p>
                </div>
              </div>
              <div class="ooh-operation-alpha__mission ooh-operation-alpha__mission--operation">
                <span class="ooh-operation-alpha__mission-kicker">MISSION BRIEF</span>
                <strong class="ooh-operation-alpha__mission-title" data-ooh-alpha-operation-title>Mission seed pending</strong>
                <p class="ooh-operation-alpha__mission-brief" data-ooh-alpha-operation-brief>Awaiting operation seed.</p>
              </div>
            </section>
            <div class="ooh-operation-alpha__runtime-actions">
              <a class="ooh-operation-alpha__runtime-button" href="' . $runtime_url . '">ENTER ACTIVE RUNTIME</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $runtime_url . '">RETURN TO RUNTIME</a>
              <a class="ooh-operation-alpha__runtime-button ooh-operation-alpha__runtime-button--home" href="' . $home_url . '">HOME</a>
            </div>
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
