<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

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
   * Builds Operation Alpha level 1: Fun and Games.
   */
  public function levelOne(): array {
    return $this->buildLevel('ooh_operation_alpha_level_1', 'operation_alpha_level_1');
  }

  /**
   * Builds Operation Alpha level 2: Pressure Net.
   */
  public function levelTwo(): array {
    return $this->buildLevel('ooh_operation_alpha_level_2', 'operation_alpha_level_2');
  }

  /**
   * Builds Operation Alpha level 3: midpoint situation report.
   */
  public function levelThree(): array {
    return $this->buildLevel('ooh_operation_alpha_level_3', 'operation_alpha_level_3');
  }

  /**
   * Builds Operation Alpha level 4: final breach.
   */
  public function levelFour(): array {
    return $this->buildLevel('ooh_operation_alpha_level_4', 'operation_alpha_level_4');
  }

  /**
   * Builds Operation Alpha final debrief.
   */
  public function finale(): array {
    return $this->buildLevel('ooh_operation_alpha_finale', 'operation_alpha_finale');
  }

  /**
   * Builds a themed Operation Alpha level page.
   */
  private function buildLevel(string $theme, string $library): array {
    return [
      '#theme' => $theme,
      '#attached' => [
        'library' => [
          'ooh_outskirts/' . $library,
        ],
      ],
      '#cache' => [
        'max-age' => 0,
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
   * Returns the account-backed Operation Alpha credit balance.
   */
  public function creditBalance(): JsonResponse {
    if ($this->currentUser()->isAnonymous()) {
      return new JsonResponse([
        'authenticated' => FALSE,
        'balance' => 0,
        'cost' => 1,
        'loginRequired' => TRUE,
      ]);
    }

    $uid = (int) $this->currentUser()->id();
    $this->ensureCreditTable();
    $this->ensureCreditBalanceRow($uid);

    return new JsonResponse([
      'authenticated' => TRUE,
      'balance' => $this->readCreditBalance($uid),
      'cost' => 1,
      'loginRequired' => FALSE,
    ]);
  }

  /**
   * Adds credits to the current account from the local/stubbed purchase flow.
   */
  public function purchaseCredits(Request $request): JsonResponse {
    if ($this->currentUser()->isAnonymous()) {
      return new JsonResponse([
        'success' => FALSE,
        'authenticated' => FALSE,
        'balance' => 0,
        'loginRequired' => TRUE,
        'message' => 'Login required to purchase Operation Alpha credits.',
      ], 403);
    }

    $payload = json_decode($request->getContent() ?: '{}', TRUE);
    $credit_amount = (int) ($payload['credits'] ?? 0);
    $allowed_amounts = [1, 30, 100];

    if (!in_array($credit_amount, $allowed_amounts, TRUE)) {
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Invalid Operation Alpha credit package.',
      ], 400);
    }

    $uid = (int) $this->currentUser()->id();
    $this->ensureCreditTable();
    $this->ensureCreditBalanceRow($uid);

    $database = \Drupal::database();
    $transaction = $database->startTransaction();

    try {
      $current_balance = $this->readCreditBalance($uid, TRUE);
      $new_balance = $current_balance + $credit_amount;
      $database->update('ooh_outskirts_oa_credit_balance')
        ->fields([
          'balance' => $new_balance,
          'updated' => \Drupal::time()->getRequestTime(),
        ])
        ->condition('uid', $uid)
        ->execute();
      unset($transaction);
    }
    catch (\Exception $exception) {
      if (isset($transaction)) {
        $transaction->rollBack();
      }
      \Drupal::logger('ooh_outskirts')->error('Operation Alpha credit purchase failed: @message', ['@message' => $exception->getMessage()]);
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Operation Alpha credit purchase failed.',
      ], 500);
    }

    return new JsonResponse([
      'success' => TRUE,
      'authenticated' => TRUE,
      'balance' => $new_balance,
      'creditsAdded' => $credit_amount,
    ]);
  }

  /**
   * Deducts one Operation Alpha credit from the current account.
   */
  public function consumeCredit(Request $request): JsonResponse {
    if ($this->currentUser()->isAnonymous()) {
      return new JsonResponse([
        'success' => FALSE,
        'authenticated' => FALSE,
        'balance' => 0,
        'loginRequired' => TRUE,
        'message' => 'Login required to launch Operation Alpha.',
      ], 403);
    }

    $uid = (int) $this->currentUser()->id();
    $cost = 1;
    $payload = json_decode($request->getContent() ?: '{}', TRUE);
    $purpose = (string) ($payload['purpose'] ?? 'launch');
    $server_paid_key = 'ooh_operation_alpha_active_credit_paid_v1';
    $this->ensureCreditTable();
    $this->ensureCreditBalanceRow($uid);

    if ($purpose === 'activation' && !empty($_SESSION[$server_paid_key])) {
      unset($_SESSION[$server_paid_key]);
      return new JsonResponse([
        'success' => TRUE,
        'authenticated' => TRUE,
        'balance' => $this->readCreditBalance($uid),
        'cost' => $cost,
        'alreadyPaid' => TRUE,
      ]);
    }

    $database = \Drupal::database();
    $transaction = $database->startTransaction();

    try {
      $balance = $this->readCreditBalance($uid, TRUE);
      if ($balance < $cost) {
        unset($transaction);
        return new JsonResponse([
          'success' => FALSE,
          'authenticated' => TRUE,
          'balance' => $balance,
          'cost' => $cost,
          'insufficientCredits' => TRUE,
        ], 402);
      }

      $new_balance = $balance - $cost;
      $database->update('ooh_outskirts_oa_credit_balance')
        ->fields([
          'balance' => $new_balance,
          'updated' => \Drupal::time()->getRequestTime(),
        ])
        ->condition('uid', $uid)
        ->execute();
      $_SESSION[$server_paid_key] = TRUE;
      unset($transaction);
    }
    catch (\Exception $exception) {
      if (isset($transaction)) {
        $transaction->rollBack();
      }
      \Drupal::logger('ooh_outskirts')->error('Operation Alpha credit consume failed: @message', ['@message' => $exception->getMessage()]);
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Operation Alpha credit consume failed.',
      ], 500);
    }

    return new JsonResponse([
      'success' => TRUE,
      'authenticated' => TRUE,
      'balance' => $new_balance,
      'cost' => $cost,
    ]);
  }

  /**
   * Builds the Operation Alpha playlist-selection shell.
   */
  public function playlists(): array {
    $runtime_url = Url::fromRoute('ooh_outskirts.operation_alpha')->toString();
    $home_url = $runtime_url;
    $credits_url = Url::fromRoute('ooh_outskirts.operation_alpha_credits')->toString();
    $login_url = Url::fromRoute('user.login')->toString();
    $war_bangaz_url = 'https://open.spotify.com/playlist/6CaO0WNPwOyB4ZBIwgJF3O?si=46f8eacb11d34816';
    $signal_blitz_url = 'https://open.spotify.com/playlist/5yXFPozHV4eW9Aal5Ys7Mn?si=19228e24361844a7';
    $dust_march_url = 'https://open.spotify.com/playlist/76AhLGUeJhcZbgQYt8oqo8?si=d4de23f690ee433e';
    $black_banner_url = 'https://open.spotify.com/playlist/6aLCJNyLO0zN6qsb3LTZoy?si=f7005bed79194ef0';
    $steel_wreckoning_url = 'https://open.spotify.com/playlist/3wVMs0gb2svMUITiu0PJY4?si=f070819920d640a1';
    $system_reset_url = 'https://open.spotify.com/playlist/0cZlbYVRnkxwViBJPw8oDR?si=d10eef44e3f54078';
    $avatar_base = base_path() . 'modules/custom/ooh_outskirts/operation_alpha/spotify_avatars/';
    $war_bangaz_avatar = $avatar_base . 'warbangaz.png';
    $signal_blitz_avatar = $avatar_base . 'signalblitz.png';
    $dust_march_avatar = $avatar_base . 'dustmarch.png';
    $black_banner_avatar = $avatar_base . 'blackbanner.png';
    $steel_wreckoning_avatar = $avatar_base . 'steelwreckoning.png';
    $system_reset_avatar = $avatar_base . 'systemreset.png';

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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $war_bangaz_avatar . '" alt="War Bangaz signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="war-bangaz" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $signal_blitz_avatar . '" alt="Signal Blitz signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="signal-blitz" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $dust_march_avatar . '" alt="Dust March signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="dust-march" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $black_banner_avatar . '" alt="Black Banner signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="black-banner" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $steel_wreckoning_avatar . '" alt="Steel Wreckoning signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="steel-wreckoning" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
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
                  <img class="ooh-operation-alpha__playlist-avatar" src="' . $system_reset_avatar . '" alt="System Reset signal avatar" loading="lazy" data-ooh-alpha-playlist-avatar data-playlist-slug="system-reset" onerror="this.hidden = true;">
                  <span class="ooh-operation-alpha__playlist-frame" aria-hidden="true"></span>
                </div>
                <div class="ooh-operation-alpha__playlist-body">
                  <span class="ooh-operation-alpha__playlist-kicker">SIGNAL F</span>
                  <h2 class="ooh-operation-alpha__playlist-title">System Reset</h2>
                  <p class="ooh-operation-alpha__playlist-copy">Recovery and recalibration channel for runtime decompression and signal stabilization.</p>
                  <button class="ooh-operation-alpha__playlist-select" type="button" data-ooh-alpha-playlist-select data-playlist-slug="system-reset" data-playlist-title="System Reset" data-playlist-url="' . $system_reset_url . '" data-playlist-cadence="Recovery and recalibration">SELECT SIGNAL</button>
                </div>
              </article>
            </div>
            <p class="ooh-operation-alpha__playlist-confirmation" data-ooh-alpha-playlist-confirmation aria-live="polite">Awaiting signal selection.</p>
            <div class="ooh-operation-alpha__runtime-handoff" data-ooh-alpha-runtime-handoff hidden>
              <span class="ooh-operation-alpha__runtime-kicker">ACTIVE SIGNAL</span>
              <p class="ooh-operation-alpha__runtime-title" data-ooh-alpha-runtime-title>Signal pending.</p>
              <p class="ooh-operation-alpha__runtime-copy" data-ooh-alpha-runtime-copy>Signal selected. Runtime handoff pending.</p>
              <a class="ooh-operation-alpha__channel-link" href="#" target="_blank" rel="noopener noreferrer" data-ooh-alpha-playlist-channel-link hidden>OPEN CHANNEL</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $runtime_url . '" data-ooh-alpha-runtime-proceed>RETURN TO INTRO</a>
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
    $home_url = Url::fromRoute('ooh_outskirts.operation_alpha')->toString();
    $playlists_url = Url::fromRoute('ooh_outskirts.operation_alpha_nested_playlists')->toString();
    $operation_url = Url::fromRoute('ooh_outskirts.operation_alpha_level_1')->toString();
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
              <a class="ooh-operation-alpha__runtime-button" href="' . $playlists_url . '">SELECT SIGNAL</a>
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
    $home_url = Url::fromRoute('ooh_outskirts.operation_alpha')->toString();
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
              <a class="ooh-operation-alpha__runtime-button" href="' . $runtime_url . '">SELECT SIGNAL</a>
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

  /**
   * Ensures the Operation Alpha credit table exists on local installs.
   */
  private function ensureCreditTable(): void {
    $schema = \Drupal::database()->schema();
    if ($schema->tableExists('ooh_outskirts_oa_credit_balance')) {
      return;
    }

    $schema->createTable('ooh_outskirts_oa_credit_balance', [
      'description' => 'Stores account-backed Operation Alpha credit balances.',
      'fields' => [
        'uid' => [
          'description' => 'Drupal user ID that owns this Operation Alpha credit balance.',
          'type' => 'int',
          'unsigned' => TRUE,
          'not null' => TRUE,
        ],
        'balance' => [
          'description' => 'Current Operation Alpha credit balance.',
          'type' => 'int',
          'unsigned' => TRUE,
          'not null' => TRUE,
          'default' => 0,
        ],
        'created' => [
          'description' => 'Unix timestamp when this balance row was created.',
          'type' => 'int',
          'unsigned' => TRUE,
          'not null' => TRUE,
        ],
        'updated' => [
          'description' => 'Unix timestamp when this balance row was last updated.',
          'type' => 'int',
          'unsigned' => TRUE,
          'not null' => TRUE,
        ],
      ],
      'primary key' => ['uid'],
      'indexes' => [
        'balance' => ['balance'],
        'updated' => ['updated'],
      ],
    ]);
  }

  /**
   * Ensures the current account has a credit balance row.
   */
  private function ensureCreditBalanceRow(int $uid): void {
    if ($uid <= 0) {
      return;
    }

    $database = \Drupal::database();
    $exists = (bool) $database->select('ooh_outskirts_oa_credit_balance', 'b')
      ->fields('b', ['uid'])
      ->condition('uid', $uid)
      ->range(0, 1)
      ->execute()
      ->fetchField();

    if ($exists) {
      return;
    }

    $now = \Drupal::time()->getRequestTime();
    $database->insert('ooh_outskirts_oa_credit_balance')
      ->fields([
        'uid' => $uid,
        'balance' => 0,
        'created' => $now,
        'updated' => $now,
      ])
      ->execute();
  }

  /**
   * Reads a user's Operation Alpha credit balance.
   */
  private function readCreditBalance(int $uid, bool $lock = FALSE): int {
    $query = \Drupal::database()->select('ooh_outskirts_oa_credit_balance', 'b')
      ->fields('b', ['balance'])
      ->condition('uid', $uid)
      ->range(0, 1);

    if ($lock && method_exists($query, 'forUpdate')) {
      $query->forUpdate();
    }

    $balance = $query->execute()->fetchField();
    return max(0, (int) $balance);
  }

}



