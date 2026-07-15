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
   * Creates a Stripe Checkout session for an Operation Alpha credit package.
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
    $package = $this->resolveCreditPackage($payload);

    if ($package === NULL) {
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Invalid Operation Alpha credit package.',
      ], 400);
    }

    $secret_key = $this->stripeSecretKey();
    if ($secret_key === '') {
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Stripe test mode is not configured for Operation Alpha.',
      ], 503);
    }

    $uid = (int) $this->currentUser()->id();
    $this->ensureCreditTable();
    $this->ensureCreditBalanceRow($uid);
    $this->ensureStripeTables();

    try {
      $session = $this->createStripeCheckoutSession($secret_key, $uid, $package, $request);
      $this->recordStripeCheckoutSession($uid, $package, $session);
    }
    catch (\Exception $exception) {
      \Drupal::logger('ooh_outskirts')->error('Operation Alpha Stripe Checkout session failed: @message', ['@message' => $exception->getMessage()]);
      return new JsonResponse([
        'success' => FALSE,
        'message' => 'Stripe Checkout session could not be created.',
      ], 500);
    }

    return new JsonResponse([
      'success' => TRUE,
      'authenticated' => TRUE,
      'checkoutUrl' => $session['url'] ?? '',
      'sessionId' => $session['id'] ?? '',
      'creditsPending' => $package['credits'],
    ]);
  }

  /**
   * Builds the Stripe Checkout return page.
   */
  public function creditSuccess(Request $request): array {
    $credits_url = Url::fromRoute('ooh_outskirts.operation_alpha_credits')->toString();
    $operation_url = Url::fromRoute('ooh_outskirts.operation_alpha')->toString();

    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-operation-alpha ooh-operation-alpha--credits" data-ooh-operation-alpha-credits>
          <div class="ooh-operation-alpha__shell ooh-operation-alpha__shell--credits">
            <p class="ooh-operation-alpha__eyebrow">STRIPE TEST CHECKOUT</p>
            <h1 class="ooh-operation-alpha__title">PAYMENT RECEIVED</h1>
            <div class="ooh-operation-alpha__copy ooh-operation-alpha__credits-copy">
              <p>Stripe is confirming this test payment by webhook.</p>
              <p>Current balance: <strong><span data-ooh-alpha-credit-balance>SYNCING</span> CREDIT(S)</strong></p>
            </div>
            <p class="ooh-operation-alpha__credit-confirmation" data-ooh-alpha-credit-confirmation aria-live="polite">Refreshing account-backed balance.</p>
            <div class="ooh-operation-alpha__runtime-actions">
              <a class="ooh-operation-alpha__runtime-button" href="' . $credits_url . '">RETURN TO CREDITS</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $operation_url . '">RETURN TO OPERATION ALPHA</a>
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
   * Processes signed Stripe webhooks and grants paid Operation Alpha credits.
   */
  public function stripeWebhook(Request $request): JsonResponse {
    $checkpoint = 'controller_entered';
    $this->logStripeWebhookCheckpoint($checkpoint);

    $this->ensureCreditTable();
    $this->ensureStripeTables();

    $webhook_secret = $this->stripeWebhookSecret();
    if ($webhook_secret === '') {
      \Drupal::logger('ooh_outskirts')->error('Operation Alpha Stripe webhook rejected because no webhook signing secret is configured.');
      return new JsonResponse(['success' => FALSE, 'message' => 'Webhook not configured.'], 503);
    }

    $payload = $request->getContent();
    $signature = (string) $request->headers->get('Stripe-Signature', '');
    if (!$this->verifyStripeWebhookSignature($payload, $signature, $webhook_secret)) {
      \Drupal::logger('ooh_outskirts')->warning('Operation Alpha Stripe webhook rejected because signature verification failed.');
      return new JsonResponse(['success' => FALSE, 'message' => 'Invalid signature.'], 400);
    }
    $checkpoint = 'signature_verified';
    $this->logStripeWebhookCheckpoint($checkpoint);

    $event = json_decode($payload, TRUE);
    if (!is_array($event) || empty($event['id']) || empty($event['type'])) {
      \Drupal::logger('ooh_outskirts')->warning('Operation Alpha Stripe webhook rejected because payload was invalid JSON.');
      return new JsonResponse(['success' => FALSE, 'message' => 'Invalid payload.'], 400);
    }

    $event_id = (string) $event['id'];
    $event_type = (string) $event['type'];
    if ($this->stripeEventAlreadyProcessed($event_id)) {
      return new JsonResponse(['success' => TRUE, 'duplicate' => TRUE]);
    }

    $credited = 0;

    try {
      $checkpoint = 'event_type_accepted';
      $this->logStripeWebhookCheckpoint($checkpoint, ['@event_type' => $event_type]);

      $this->recordStripeEvent($event_id, $event_type);
      $checkpoint = 'event_row_recorded';
      $this->logStripeWebhookCheckpoint($checkpoint, ['@event_type' => $event_type]);

      if ($event_type === 'checkout.session.completed') {
        $session = $event['data']['object'] ?? [];
        if (is_array($session)) {
          $credited = $this->grantStripeCheckoutCredits($session, $event_id, $checkpoint);
        }
      }
      elseif (in_array($event_type, ['checkout.session.async_payment_failed', 'payment_intent.payment_failed'], TRUE)) {
        $this->markStripePaymentFailed($event);
      }

      $this->markStripeEventProcessed($event_id);
      $checkpoint = 'event_marked_processed';
      $this->logStripeWebhookCheckpoint($checkpoint, ['@event_type' => $event_type]);
    }
    catch (\Throwable $exception) {
      $message = preg_replace('/\b(?:cs|evt|pi|ch)_(?:test|live)?_[A-Za-z0-9_]+\b/', 'stripe_id_REDACTED', $exception->getMessage());
      \Drupal::logger('ooh_outskirts')->error('Operation Alpha Stripe webhook failed at @checkpoint for @event: @class: @message in @file:@line', [
        '@checkpoint' => $checkpoint,
        '@event' => preg_replace('/\bevt_[A-Za-z0-9_]+\b/', 'evt_REDACTED', $event_id),
        '@class' => get_class($exception),
        '@message' => $message,
        '@file' => $exception->getFile(),
        '@line' => $exception->getLine(),
      ]);
      return new JsonResponse(['success' => FALSE, 'message' => 'Webhook processing failed.'], 500);
    }
    $checkpoint = 'successful_response_returned';
    $this->logStripeWebhookCheckpoint($checkpoint, ['@event_type' => $event_type]);

    return new JsonResponse([
      'success' => TRUE,
      'eventType' => $event_type,
      'creditsGranted' => $credited,
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
              <a class="ooh-operation-alpha__channel-link" href="' . $runtime_url . '" data-ooh-alpha-playlist-channel-link>OPEN CHANNEL</a>
              <a class="ooh-operation-alpha__runtime-button" href="' . $home_url . '" data-ooh-alpha-runtime-proceed>RETURN TO INTRO</a>
            </div>
            <p class="ooh-operation-alpha__playlist-note">Select a signal, then return to intro.</p>
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
   * Returns the supported Operation Alpha Stripe credit packages.
   */
  private function creditPackages(): array {
    return [
      'single' => [
        'id' => 'single',
        'credits' => 1,
        'amount_cents' => 100,
        'currency' => 'usd',
        'label' => 'Operation Alpha Credit',
      ],
      'field_pack' => [
        'id' => 'field_pack',
        'credits' => 30,
        'amount_cents' => 2500,
        'currency' => 'usd',
        'label' => 'Operation Alpha Field Pack',
      ],
      'deep_runtime' => [
        'id' => 'deep_runtime',
        'credits' => 100,
        'amount_cents' => 7500,
        'currency' => 'usd',
        'label' => 'Operation Alpha Deep Runtime',
      ],
    ];
  }

  /**
   * Resolves an incoming purchase payload to an approved package.
   */
  private function resolveCreditPackage(array $payload): ?array {
    $packages = $this->creditPackages();
    $package_id = (string) ($payload['package'] ?? $payload['packageId'] ?? '');
    if ($package_id !== '' && isset($packages[$package_id])) {
      return $packages[$package_id];
    }

    $credits = (int) ($payload['credits'] ?? 0);
    foreach ($packages as $package) {
      if ($credits === (int) $package['credits']) {
        return $package;
      }
    }

    return NULL;
  }

  /**
   * Reads a Stripe secret from environment/settings and refuses live keys.
   */
  private function stripeSecretKey(): string {
    $secret = $this->stripeConfigValue('OOH_STRIPE_SECRET_KEY', 'ooh_stripe_secret_key');
    if ($secret === '' || strpos($secret, 'sk_live_') === 0 || strpos($secret, 'sk_test_') !== 0) {
      if ($secret !== '') {
        \Drupal::logger('ooh_outskirts')->error('Operation Alpha Stripe secret key is not a test-mode key.');
      }
      return '';
    }
    return $secret;
  }

  /**
   * Reads the Stripe webhook signing secret from environment/settings.
   */
  private function stripeWebhookSecret(): string {
    $secret = $this->stripeConfigValue('OOH_STRIPE_WEBHOOK_SECRET', 'ooh_stripe_webhook_secret');
    return strpos($secret, 'whsec_') === 0 ? $secret : '';
  }

  /**
   * Reads a local secret value without storing it in module code.
   */
  private function stripeConfigValue(string $env_name, string $settings_name): string {
    $value = getenv($env_name);
    if ($value === FALSE || trim((string) $value) === '') {
      $value = \Drupal::service('settings')->get($settings_name, '');
    }
    return trim((string) $value);
  }

  /**
   * Creates a Stripe Checkout Session through Drupal's HTTP client.
   */
  private function createStripeCheckoutSession(string $secret_key, int $uid, array $package, Request $request): array {
    $success_url = $this->absoluteRouteUrlFromRequest($request, 'ooh_outskirts.operation_alpha_credit_success') . '?session_id={CHECKOUT_SESSION_ID}';
    $cancel_url = $this->absoluteRouteUrlFromRequest($request, 'ooh_outskirts.operation_alpha_credits');
    $response = \Drupal::httpClient()->request('POST', 'https://api.stripe.com/v1/checkout/sessions', [
      'auth' => [$secret_key, ''],
      'form_params' => [
        'mode' => 'payment',
        'success_url' => $success_url,
        'cancel_url' => $cancel_url,
        'client_reference_id' => (string) $uid,
        'metadata[uid]' => (string) $uid,
        'metadata[package_id]' => $package['id'],
        'metadata[credits]' => (string) $package['credits'],
        'metadata[amount_cents]' => (string) $package['amount_cents'],
        'line_items[0][price_data][currency]' => $package['currency'],
        'line_items[0][price_data][product_data][name]' => $package['label'],
        'line_items[0][price_data][unit_amount]' => (string) $package['amount_cents'],
        'line_items[0][quantity]' => '1',
      ],
      'timeout' => 20,
    ]);

    $session = json_decode((string) $response->getBody(), TRUE);
    if (!is_array($session) || empty($session['id']) || empty($session['url'])) {
      throw new \RuntimeException('Stripe returned an invalid Checkout Session response.');
    }

    return $session;
  }

  /**
   * Builds an absolute route URL from the active browser request origin.
   */
  private function absoluteRouteUrlFromRequest(Request $request, string $route_name): string {
    $path = Url::fromRoute($route_name, [], ['absolute' => FALSE])->toString();
    if (strpos($path, '/') !== 0) {
      $path = '/' . $path;
    }
    return rtrim($request->getSchemeAndHttpHost(), '/') . $path;
  }
  /**
   * Records the created Checkout Session before Stripe redirects the browser.
   */
  private function recordStripeCheckoutSession(int $uid, array $package, array $session): void {
    $now = \Drupal::time()->getRequestTime();
    \Drupal::database()->merge('ooh_outskirts_oa_credit_purchase')
      ->key(['stripe_session_id' => (string) $session['id']])
      ->fields([
        'uid' => $uid,
        'stripe_payment_intent_id' => $session['payment_intent'] ?? NULL,
        'package_id' => $package['id'],
        'credits' => $package['credits'],
        'amount_cents' => $package['amount_cents'],
        'currency' => $package['currency'],
        'status' => 'checkout_created',
        'credited' => 0,
        'created' => $now,
        'updated' => $now,
      ])
      ->execute();
  }

  /**
   * Verifies a Stripe-Signature header for the raw webhook body.
   */
  private function verifyStripeWebhookSignature(string $payload, string $signature_header, string $secret): bool {
    $timestamp = '';
    $signatures = [];
    foreach (explode(',', $signature_header) as $part) {
      [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
      if ($key === 't') {
        $timestamp = $value;
      }
      elseif ($key === 'v1') {
        $signatures[] = $value;
      }
    }

    if ($timestamp === '' || empty($signatures)) {
      return FALSE;
    }

    if (abs(\Drupal::time()->getRequestTime() - (int) $timestamp) > 300) {
      return FALSE;
    }

    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($signatures as $signature) {
      if (hash_equals($expected, $signature)) {
        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * Checks whether a Stripe webhook event ID has already been processed.
   */
  private function stripeEventAlreadyProcessed(string $event_id): bool {
    return (bool) \Drupal::database()->select('ooh_outskirts_oa_stripe_event', 'e')
      ->fields('e', ['id'])
      ->condition('event_id', $event_id)
      ->condition('processed', 1)
      ->range(0, 1)
      ->execute()
      ->fetchField();
  }
  /**
   * Records a Stripe webhook event ID before processing side effects.
   */
  private function recordStripeEvent(string $event_id, string $event_type): void {
    $existing_processed = \Drupal::database()->select('ooh_outskirts_oa_stripe_event', 'e')
      ->fields('e', ['processed'])
      ->condition('event_id', $event_id)
      ->range(0, 1)
      ->execute()
      ->fetchField();

    if ((int) $existing_processed === 1) {
      return;
    }

    \Drupal::database()->merge('ooh_outskirts_oa_stripe_event')
      ->key(['event_id' => $event_id])
      ->fields([
        'event_type' => $event_type,
        'processed' => 0,
        'created' => \Drupal::time()->getRequestTime(),
      ])
      ->execute();
  }
  /**
   * Marks a Stripe webhook event as processed.
   */
  private function markStripeEventProcessed(string $event_id): void {
    \Drupal::database()->update('ooh_outskirts_oa_stripe_event')
      ->fields(['processed' => 1])
      ->condition('event_id', $event_id)
      ->execute();
  }

  /**
   * Logs redacted webhook processing checkpoints for local validation.
   */
  private function logStripeWebhookCheckpoint(string $checkpoint, array $context = []): void {
    \Drupal::logger('ooh_outskirts')->notice('Operation Alpha Stripe webhook checkpoint: @checkpoint @event_type', [
      '@checkpoint' => $checkpoint,
      '@event_type' => $context['@event_type'] ?? '',
    ]);
  }

  /**
   * Grants paid Checkout credits once, from a verified Stripe webhook only.
   */
  private function grantStripeCheckoutCredits(array $session, string $event_id, ?string &$checkpoint = NULL): int {
    if (($session['payment_status'] ?? '') !== 'paid') {
      return 0;
    }

    if (!$this->isOperationAlphaCheckoutSession($session)) {
      $checkpoint = 'non_operation_alpha_checkout_ignored';
      $this->logStripeWebhookCheckpoint($checkpoint);
      return 0;
    }

    $session_id = (string) ($session['id'] ?? '');
    if ($session_id === '') {
      throw new \RuntimeException('Stripe Checkout Session webhook omitted the session ID.');
    }

    $database = \Drupal::database();
    $transaction = $database->startTransaction();
    $checkpoint = 'credit_transaction_started';
    $this->logStripeWebhookCheckpoint($checkpoint);

    try {
      $query = $database->select('ooh_outskirts_oa_credit_purchase', 'p')
        ->fields('p')
        ->condition('stripe_session_id', $session_id)
        ->range(0, 1);
      if (method_exists($query, 'forUpdate')) {
        $query->forUpdate();
      }
      $purchase = $query->execute()->fetchAssoc();

      if (!$purchase) {
        throw new \RuntimeException('No Operation Alpha purchase record matched Stripe session ' . $session_id . '.');
      }
      $checkpoint = 'matching_purchase_found';
      $this->logStripeWebhookCheckpoint($checkpoint);

      if ((int) $purchase['credited'] === 1) {
        unset($transaction);
        return 0;
      }

      $amount_total = (int) ($session['amount_total'] ?? 0);
      $currency = strtolower((string) ($session['currency'] ?? ''));
      if ($amount_total !== (int) $purchase['amount_cents'] || $currency !== strtolower((string) $purchase['currency'])) {
        throw new \RuntimeException('Stripe Checkout Session amount or currency did not match the recorded package.');
      }
      $metadata = $session['metadata'] ?? [];
      $metadata_credits = (int) ($metadata['credits'] ?? 0);
      $metadata_amount = (int) ($metadata['amount_cents'] ?? 0);
      $metadata_package = (string) ($metadata['package_id'] ?? '');
      if ($metadata_credits !== (int) $purchase['credits'] || $metadata_amount !== (int) $purchase['amount_cents'] || $metadata_package !== (string) $purchase['package_id']) {
        throw new \RuntimeException('Stripe Checkout Session metadata did not match the recorded Operation Alpha package.');
      }
      $checkpoint = 'paid_amount_currency_credit_validation_passed';
      $this->logStripeWebhookCheckpoint($checkpoint);

      $uid = (int) $purchase['uid'];
      $credits = (int) $purchase['credits'];
      $payment_intent = (string) ($session['payment_intent'] ?? '');
      $this->ensureCreditBalanceRow($uid);
      $balance = $this->readCreditBalance($uid, TRUE);
      $new_balance = $balance + $credits;
      $now = \Drupal::time()->getRequestTime();

      $database->update('ooh_outskirts_oa_credit_balance')
        ->fields([
          'balance' => $new_balance,
          'updated' => $now,
        ])
        ->condition('uid', $uid)
        ->execute();

      $database->update('ooh_outskirts_oa_credit_purchase')
        ->fields([
          'stripe_payment_intent_id' => $payment_intent !== '' ? $payment_intent : NULL,
          'stripe_event_id' => $event_id,
          'status' => 'credited',
          'credited' => 1,
          'updated' => $now,
          'credited_at' => $now,
        ])
        ->condition('stripe_session_id', $session_id)
        ->execute();
      $checkpoint = 'purchase_marked_credited';
      $this->logStripeWebhookCheckpoint($checkpoint);

      unset($transaction);
      return $credits;
    }
    catch (\Throwable $exception) {
      if (isset($transaction)) {
        $transaction->rollBack();
      }
      throw $exception;
    }
  }

  /**
   * Checks whether a paid Checkout Session belongs to Operation Alpha credits.
   */
  private function isOperationAlphaCheckoutSession(array $session): bool {
    $metadata = $session['metadata'] ?? [];
    if (!is_array($metadata)) {
      return FALSE;
    }

    foreach (['package_id', 'credits', 'amount_cents'] as $key) {
      if (!array_key_exists($key, $metadata) || trim((string) $metadata[$key]) === '') {
        return FALSE;
      }
    }

    $package = $this->resolveCreditPackage([
      'package' => (string) $metadata['package_id'],
    ]);
    if ($package === NULL) {
      return FALSE;
    }

    return (int) $metadata['credits'] === (int) $package['credits']
      && (int) $metadata['amount_cents'] === (int) $package['amount_cents'];
  }
  /**
   * Marks a failed Stripe payment object without granting credits.
   */
  private function markStripePaymentFailed(array $event): void {
    $object = $event['data']['object'] ?? [];
    if (!is_array($object)) {
      return;
    }

    $session_id = (string) ($object['id'] ?? '');
    $payment_intent = (string) ($object['payment_intent'] ?? $object['id'] ?? '');
    $database = \Drupal::database();
    $fields = [
      'status' => 'failed',
      'updated' => \Drupal::time()->getRequestTime(),
    ];

    if ($session_id !== '' && strpos($session_id, 'cs_') === 0) {
      $database->update('ooh_outskirts_oa_credit_purchase')
        ->fields($fields)
        ->condition('stripe_session_id', $session_id)
        ->execute();
    }
    elseif ($payment_intent !== '') {
      $database->update('ooh_outskirts_oa_credit_purchase')
        ->fields($fields)
        ->condition('stripe_payment_intent_id', $payment_intent)
        ->execute();
    }
  }

  /**
   * Ensures the Operation Alpha Stripe purchase tables exist locally.
   */
  private function ensureStripeTables(): void {
    $schema = \Drupal::database()->schema();
    $tables = $this->stripeTableSchemas();
    foreach ($tables as $table => $definition) {
      if (!$schema->tableExists($table)) {
        $schema->createTable($table, $definition);
      }
    }
  }

  /**
   * Returns local table definitions for Stripe purchase tracking.
   */
  private function stripeTableSchemas(): array {
    return [
      'ooh_outskirts_oa_credit_purchase' => [
        'description' => 'Stores Operation Alpha Stripe Checkout purchase records and credit grant status.',
        'fields' => [
          'id' => ['type' => 'serial', 'unsigned' => TRUE, 'not null' => TRUE],
          'uid' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
          'stripe_session_id' => ['type' => 'varchar', 'length' => 255, 'not null' => TRUE],
          'stripe_payment_intent_id' => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
          'stripe_event_id' => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
          'package_id' => ['type' => 'varchar', 'length' => 32, 'not null' => TRUE],
          'credits' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
          'amount_cents' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
          'currency' => ['type' => 'varchar', 'length' => 8, 'not null' => TRUE, 'default' => 'usd'],
          'status' => ['type' => 'varchar', 'length' => 32, 'not null' => TRUE],
          'credited' => ['type' => 'int', 'size' => 'tiny', 'unsigned' => TRUE, 'not null' => TRUE, 'default' => 0],
          'created' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
          'updated' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
          'credited_at' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => FALSE],
        ],
        'primary key' => ['id'],
        'unique keys' => ['stripe_session_id' => ['stripe_session_id']],
        'indexes' => [
          'uid_created' => ['uid', 'created'],
          'payment_intent' => ['stripe_payment_intent_id'],
          'event' => ['stripe_event_id'],
          'credited' => ['credited'],
        ],
      ],
      'ooh_outskirts_oa_stripe_event' => [
        'description' => 'Stores processed Operation Alpha Stripe webhook event IDs for dedupe.',
        'fields' => [
          'id' => ['type' => 'serial', 'unsigned' => TRUE, 'not null' => TRUE],
          'event_id' => ['type' => 'varchar', 'length' => 255, 'not null' => TRUE],
          'event_type' => ['type' => 'varchar', 'length' => 128, 'not null' => TRUE],
          'processed' => ['type' => 'int', 'size' => 'tiny', 'unsigned' => TRUE, 'not null' => TRUE, 'default' => 0],
          'created' => ['type' => 'int', 'unsigned' => TRUE, 'not null' => TRUE],
        ],
        'primary key' => ['id'],
        'unique keys' => ['event_id' => ['event_id']],
        'indexes' => [
          'event_type' => ['event_type'],
          'processed' => ['processed'],
        ],
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





