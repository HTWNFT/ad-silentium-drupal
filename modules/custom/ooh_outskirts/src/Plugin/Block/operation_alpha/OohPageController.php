<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Component\Serialization\Json;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class OohPageController extends ControllerBase {

  public function landingpage() {
    $media_dir = DRUPAL_ROOT . '/sites/default/files/adsilentium/loops';
    $media_url = base_path() . 'sites/default/files/adsilentium/loops/';
    $module_path = \Drupal::service('extension.list.module')->getPath('ooh_outskirts');
    $wind_src = base_path() . $module_path . '/audio/wind-ambient.mp3';

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
      '#wind_src' => $wind_src,
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
      '#theme' => 'ooh_clearance_page',
      '#attached' => [
        'library' => [
          'ooh_outskirts/clearance',
        ],
      ],
    ];
  }

  public function dossier() {
    $block = \Drupal::service('plugin.manager.block')
      ->createInstance('ooh_game_generator_block', []);
    $build = $block->build();

    $build['#cache'] = [
      'max-age' => 0,
    ];

    return $build;
  }

  public function play() {
    $block = \Drupal::service('plugin.manager.block')
      ->createInstance('ooh_play_block', [
        'require_login' => FALSE,
      ]);
    $build = $block->build();

    $build['#cache'] = [
      'max-age' => 0,
    ];

    return $build;
  }

  public function operationAlpha() {
    return [
      '#theme' => 'ooh_operation_alpha_page',
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

  public function credits() {
    return [
      '#theme' => 'ooh_credits_page',
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

  public function creditsCheckout(Request $request) {
    $selection = $this->resolveCreditPack($request);
    $pack = $selection['pack'];
    $selected_pack = $selection['selected_pack'];

    return [
      '#theme' => 'ooh_credits_checkout_page',
      '#selected_pack' => $pack,
      '#pack_label' => $selected_pack['label'],
      '#pack_amount' => $selected_pack['amount'],
      '#product_code' => $selected_pack['product_code'],
      '#checkout_enabled' => TRUE,
      '#invalid_pack' => $selection['invalid_pack'],
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

  public function clearanceCheckoutCard(Request $request) {
    $selection = $this->resolveCreditPack($request);

    // TODO: Create a Stripe Checkout Session here using server-side config
    // only, then redirect to the provider URL. No API keys belong in code.
    return $this->paymentHandoffBuild(
      'CARD HANDOFF STAGED',
      'CREDIT / DEBIT CARD',
      'Stripe Checkout session creation will be connected here after live provider configuration is present.',
      $selection
    );
  }

  public function clearanceCheckoutCrypto(Request $request) {
    $selection = $this->resolveCreditPack($request);

    // TODO: Connect a controlled BTC / ETH provider handoff here. Do not
    // collect wallet addresses or add token ownership logic in Drupal.
    return $this->paymentHandoffBuild(
      'BTC / ETH HANDOFF STAGED',
      'BTC / ETH',
      'A separate crypto provider handoff will be connected here without wallet linkage or Drupal Commerce coupling.',
      $selection
    );
  }

  public function clearanceCheckoutSuccess(Request $request) {
    $selection = $this->resolveCreditPack($request);

    // TODO: Credit balances must be updated server-side only after a verified
    // provider event or webhook confirms payment completion.
    return $this->paymentHandoffBuild(
      'PAYMENT RETURN RECEIVED',
      'Verification Pending',
      'Return received. Credits are not granted here until a server-side provider verification confirms payment.',
      $selection
    );
  }

  public function clearanceCheckoutCancel(Request $request) {
    $selection = $this->resolveCreditPack($request);

    return $this->paymentHandoffBuild(
      'PAYMENT RETURN CANCELED',
      'Checkout Canceled',
      'No credits were granted. You can return to the checkout desk and choose another handoff path.',
      $selection
    );
  }

  public function saveEnterPayload(Request $request) {
    $decoded = Json::decode($request->getContent() ?: '{}');
    if (!is_array($decoded)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'invalid_json',
      ], 400);
    }

    $canonical = $this->canonicalEnterPayload($decoded);
    if (!$canonical['valid']) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'invalid_payload',
        'missingFields' => $canonical['errors'],
      ], 400);
    }

    $payload = $canonical['payload'];
    $uuid = \Drupal::service('uuid')->generate();
    $mission_uuid = \Drupal::service('uuid')->generate();
    $created = \Drupal::time()->getRequestTime();
    $uid = (int) \Drupal::currentUser()->id();

    $payload['server'] = [
      'id' => NULL,
      'uuid' => $uuid,
      'uid' => $uid,
      'created' => $created,
    ];

    try {
      $id = \Drupal::database()->insert('ooh_outskirts_enter_payload')
        ->fields([
          'uuid' => $uuid,
          'uid' => $uid,
          'payload_version' => $payload['payloadVersion'],
          'playlist_id' => $payload['playlistId'],
          'path_id' => $payload['pathId'],
          'campaign_route_id' => $payload['campaignRouteId'],
          'route_id' => $payload['routeId'],
          'mission_route_id' => $payload['missionRouteId'],
          'mission_type' => $payload['missionType'],
          'mission_id' => $payload['missionId'],
          'selected_attributes' => Json::encode($payload['selectedAttributes']),
          'payload_snapshot' => Json::encode($payload),
          'created' => $created,
        ])
        ->execute();

      \Drupal::database()->insert('ooh_outskirts_mission_instance')
        ->fields([
          'uuid' => $mission_uuid,
          'enter_payload_id' => (int) $id,
          'enter_payload_uuid' => $uuid,
          'uid' => $uid,
          'lifecycle_state' => 'created',
          'created' => $created,
          'updated' => $created,
        ])
        ->execute();
    }
    catch (\Exception $e) {
      \Drupal::logger('ooh_outskirts')->error('ENTER payload save failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'save_failed',
      ], 500);
    }

    return new JsonResponse([
      'success' => TRUE,
      'id' => (int) $id,
      'uuid' => $uuid,
      'missionUuid' => $mission_uuid,
    ]);
  }

  public function lookupMission(Request $request) {
    $decoded = Json::decode($request->getContent() ?: '{}');
    if (!is_array($decoded)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'invalid_json',
      ], 400);
    }

    $mission_uuid = trim((string) ($decoded['missionUuid'] ?? ''));
    if ($mission_uuid === '') {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'invalid_mission_uuid',
      ], 400);
    }

    try {
      $query = \Drupal::database()->select('ooh_outskirts_mission_instance', 'mission');
      $query->innerJoin('ooh_outskirts_enter_payload', 'payload', 'mission.enter_payload_id = payload.id AND mission.enter_payload_uuid = payload.uuid');
      $query->addField('mission', 'uuid', 'mission_uuid');
      $query->addField('mission', 'lifecycle_state', 'lifecycle_state');
      $query->addField('payload', 'uuid', 'payload_uuid');
      $query->addField('payload', 'payload_snapshot', 'payload_snapshot');
      $query->condition('mission.uuid', $mission_uuid);
      $query->range(0, 1);
      $record = $query->execute()->fetchAssoc();
    }
    catch (\Exception $e) {
      \Drupal::logger('ooh_outskirts')->error('Mission lookup failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'lookup_failed',
      ], 500);
    }

    if (!$record) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'mission_not_found',
      ], 404);
    }

    $payload = Json::decode($record['payload_snapshot'] ?? '{}');
    if (!is_array($payload)) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => 'lookup_failed',
      ], 500);
    }

    return new JsonResponse([
      'success' => TRUE,
      'missionUuid' => $record['mission_uuid'],
      'payloadUuid' => $record['payload_uuid'],
      'payload' => $payload,
      'lifecycleState' => $record['lifecycle_state'],
    ]);
  }

  protected function canonicalEnterPayload(array $payload) {
    $errors = [];
    $playlist_id = $this->payloadNestedId($payload, 'playlist', 'playlistId');
    $path_id = $this->payloadNestedId($payload, 'path', 'pathId');
    $campaign_route_id = (string) ($payload['campaignRouteId'] ?? $this->payloadNestedId($payload, 'campaignRoute', 'campaignRouteId'));
    $route_id = (string) ($payload['routeId'] ?? $this->payloadNestedId($payload, 'route', 'routeId'));
    $mission_route_id = (string) ($payload['missionRouteId'] ?? (($payload['mission']['campaignRoute'] ?? '') ?: $route_id));
    $mission_type = (string) ($payload['missionType'] ?? $this->payloadNestedId($payload, 'mission', 'missionType'));
    $mission_id = $this->payloadNestedId($payload, 'mission', 'missionId') ?: $mission_type;
    $selected_attributes = $payload['selectedAttributes'] ?? [];

    $allowed_playlists = ['rap_war', 'rock_war', 'country_war', 'classical_war', 'dark_ambient_tactical_suspense'];
    $allowed_paths = ['doomed', 'merged'];
    $allowed_campaign_routes = ['mixed', 'aer', 'mare', 'terra'];
    $allowed_routes = ['aer', 'mare', 'terra'];
    $allowed_missions = ['recon', 'survival', 'purge', 'extraction', 'sabotage', 'artifact_recovery'];

    if (!in_array($playlist_id, $allowed_playlists, TRUE)) {
      $errors[] = 'playlistId';
    }
    if (!in_array($path_id, $allowed_paths, TRUE)) {
      $errors[] = 'pathId';
    }
    if (!in_array($campaign_route_id, $allowed_campaign_routes, TRUE)) {
      $errors[] = 'campaignRouteId';
    }
    if (!in_array($route_id, $allowed_routes, TRUE)) {
      $errors[] = 'routeId';
    }
    if (!in_array($mission_route_id, $allowed_routes, TRUE)) {
      $errors[] = 'missionRouteId';
    }
    if (!in_array($mission_type, $allowed_missions, TRUE)) {
      $errors[] = 'missionType';
    }
    if (!in_array($mission_id, $allowed_missions, TRUE)) {
      $errors[] = 'missionId';
    }
    if (!$this->validSelectedAttributes($selected_attributes)) {
      $errors[] = 'selectedAttributes';
      $selected_attributes = [];
    }

    $canonical = [
      'payloadVersion' => 'v3-z1-2',
      'playlistId' => $playlist_id,
      'pathId' => $path_id,
      'campaignRouteId' => $campaign_route_id,
      'routeId' => $route_id,
      'missionRouteId' => $mission_route_id,
      'missionType' => $mission_type,
      'missionId' => $mission_id,
      'selectedAttributes' => array_values($selected_attributes),
      'snapshot' => [
        'playlist' => $payload['playlist'] ?? NULL,
        'path' => $payload['path'] ?? NULL,
        'recruiter' => $payload['recruiter'] ?? NULL,
        'character' => $payload['character'] ?? NULL,
        'campaignRoute' => $payload['campaignRoute'] ?? NULL,
        'route' => $payload['route'] ?? NULL,
        'mission' => $payload['mission'] ?? NULL,
        'generatedAt' => $payload['generatedAt'] ?? NULL,
      ],
    ];

    return [
      'valid' => $errors === [],
      'errors' => $errors,
      'payload' => $canonical,
    ];
  }

  protected function payloadNestedId(array $payload, $object_key, $fallback_key) {
    if (!empty($payload[$fallback_key]) && is_string($payload[$fallback_key])) {
      return $this->cleanPayloadId($payload[$fallback_key]);
    }

    if (!empty($payload[$object_key]['id']) && is_string($payload[$object_key]['id'])) {
      return $this->cleanPayloadId($payload[$object_key]['id']);
    }

    return '';
  }

  protected function cleanPayloadId($value) {
    $value = strtolower(trim((string) $value));
    return preg_match('/^[a-z0-9_]+$/', $value) ? $value : '';
  }

  protected function validSelectedAttributes($attributes) {
    if (!is_array($attributes) || count($attributes) < 3 || count($attributes) > 12) {
      return FALSE;
    }

    foreach ($attributes as $attribute) {
      if (!is_string($attribute)) {
        return FALSE;
      }
      $attribute = trim($attribute);
      if ($attribute === '' || strlen($attribute) > 80 || !preg_match('/^[A-Za-z0-9 ()\/-]+$/', $attribute)) {
        return FALSE;
      }
    }

    return TRUE;
  }

  protected function resolveCreditPack(Request $request) {
    $requested_pack = $request->query->get('pack');
    $pack = (string) ($requested_pack ?: '60');
    $packs = [
      '60' => [
        'label' => 'Entry',
        'amount' => 60,
        'product_code' => 'credits_entry_60',
      ],
      '180' => [
        'label' => 'Standard',
        'amount' => 180,
        'product_code' => 'credits_standard_180',
      ],
      '480' => [
        'label' => 'Founder',
        'amount' => 480,
        'product_code' => 'credits_founder_480',
      ],
    ];

    $invalid_pack = $requested_pack !== NULL && !isset($packs[$pack]);

    if ($invalid_pack) {
      $pack = '60';
    }

    return [
      'pack' => $pack,
      'selected_pack' => $packs[$pack],
      'invalid_pack' => $invalid_pack,
    ];
  }

  protected function paymentHandoffBuild($eyebrow, $title, $message, array $selection) {
    $pack = $selection['pack'];
    $selected_pack = $selection['selected_pack'];
    $checkout_url = Url::fromRoute('ooh_outskirts.credits_checkout', [], [
      'query' => [
        'pack' => $pack,
      ],
    ])->toString();
    $credits_url = Url::fromRoute('ooh_outskirts.credits')->toString();
    $pack_display = $selected_pack['amount'] . ' Credits';

    return [
      '#type' => 'inline_template',
      '#template' => '
        <section class="ooh-credits-checkout-page">
          <div class="ooh-credits-checkout-shell">
            <div class="ooh-credits-eyebrow">{{ eyebrow }}</div>
            <h1 class="ooh-credits-title">{{ title }}</h1>
            <p class="ooh-credits-copy">{{ message }}</p>
            <div class="ooh-checkout-summary">
              <span class="ooh-status-label">PACKAGE</span>
              <strong>{{ pack_label }} / {{ pack_display }}</strong>
              <span class="ooh-status-label">PRODUCT CODE</span>
              <strong>{{ product_code }}</strong>
              <span class="ooh-status-label">AUTHORITY</span>
              <strong>Server-side verification required</strong>
            </div>
            <div class="ooh-credits-return">
              <a class="ooh-return-link" href="{{ checkout_url }}">Back to Checkout</a>
              <a class="ooh-return-link" href="{{ credits_url }}">Back to Credits</a>
            </div>
          </div>
        </section>',
      '#context' => [
        'eyebrow' => $eyebrow,
        'title' => $title,
        'message' => $message,
        'pack_label' => $selected_pack['label'],
        'pack_display' => $pack_display,
        'product_code' => $selected_pack['product_code'],
        'checkout_url' => $checkout_url,
        'credits_url' => $credits_url,
      ],
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

