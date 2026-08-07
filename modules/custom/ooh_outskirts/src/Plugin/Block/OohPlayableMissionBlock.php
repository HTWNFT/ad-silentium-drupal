<?php

declare(strict_types=1);

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;

/**
 * Provides the isolated first-person playable mission foundation.
 *
 * @Block(
 *   id = "ooh_playable_mission_block",
 *   admin_label = @Translation("OOH Playable Mission Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
final class OohPlayableMissionBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $request = \Drupal::request();
    $query_mission_uuid = trim((string) $request->query->get('missionUuid', ''));
    if (!preg_match('/^[a-f0-9-]{36}$/i', $query_mission_uuid)) {
      $query_mission_uuid = '';
    }

    $query_level = strtolower(trim((string) $request->query->get('level', '')));
    if (!preg_match('/^[a-z0-9_]+$/', $query_level)) {
      $query_level = '';
    }

    $query_sequence_entry = trim((string) $request->query->get('sequenceEntry', ''));
    if (!preg_match('/^[1-9][0-9]*$/', $query_sequence_entry)) {
      $query_sequence_entry = '';
    }

    $route_url = Url::fromRoute('ooh_outskirts.playable_mission')->toString();
    $dossier_url = Url::fromRoute('ooh_outskirts.dossier')->toString();
    $play_url = Url::fromRoute('ooh_outskirts.play')->toString();

    $markup = <<<HTML
<section class="ooh-playable" data-ooh-playable-mission>
  <div class="ooh-playable__backdrop" aria-hidden="true"></div>
  <div class="ooh-playable__shell">
    <nav class="ooh-playable__nav" aria-label="Playable mission navigation">
      <a class="ooh-playable__nav-link" href="{$dossier_url}">RETURN TO DOSSIER</a>
      <a class="ooh-playable__nav-link" href="{$play_url}">RETURN TO STAGING</a>
    </nav>

    <header class="ooh-playable__header">
      <p class="ooh-playable__eyebrow">FIRST-PERSON MISSION EXPERIENCE // PHASE 3</p>
      <h1 class="ooh-playable__title">COMBAT INTERACTION FOUNDATION</h1>
      <p class="ooh-playable__intro">Dedicated WebGL field surface with first-person movement, pointer lock, grounded detection, static collision, and the first aim-fire-hit interaction loop.</p>
    </header>

    <div class="ooh-playable__grid">
      <section class="ooh-playable__viewport-panel" aria-label="Playable test field">
        <div class="ooh-playable__viewport" data-ooh-playable-viewport>
          <div class="ooh-playable__boot" data-ooh-playable-boot>
            <span class="ooh-playable__boot-label" data-ooh-playable-primary-state>BOOTING</span>
            <span class="ooh-playable__boot-copy" data-ooh-playable-message>Initializing playable mission route.</span>
          </div>
          <span class="ooh-playable__reticle" aria-hidden="true"></span>
        </div>
        <div class="ooh-playable__controls">
          <button class="ooh-playable__enter" type="button" data-ooh-playable-enter disabled aria-disabled="true">ENTER TEST FIELD</button>
          <button class="ooh-playable__pause" type="button" data-ooh-playable-pause disabled aria-disabled="true">PAUSE FIELD</button>
          <button class="ooh-playable__restart" type="button" data-ooh-playable-restart disabled aria-disabled="true">RESTART MISSION</button>
        </div>
      </section>

      <aside class="ooh-playable__hud" aria-label="Playable mission diagnostics">
        <div class="ooh-playable__readout"><span>BOOT</span><strong data-ooh-playable-state="boot">BOOTING</strong></div>
        <div class="ooh-playable__readout"><span>PAYLOAD</span><strong data-ooh-playable-state="payload">CHECKING</strong></div>
        <div class="ooh-playable__readout"><span>RENDERER</span><strong data-ooh-playable-state="renderer">STANDBY</strong></div>
        <div class="ooh-playable__readout"><span>FIELD</span><strong data-ooh-playable-state="field">PAUSED</strong></div>
        <div class="ooh-playable__readout"><span>POINTER</span><strong data-ooh-playable-state="lock">UNLOCKED</strong></div>
        <div class="ooh-playable__readout"><span>STANCE</span><strong data-ooh-playable-state="grounded">GROUNDED</strong></div>
        <div class="ooh-playable__readout"><span>MOVE</span><strong data-ooh-playable-state="speed">WALK</strong></div>
        <div class="ooh-playable__readout"><span>XYZ</span><strong data-ooh-playable-state="coordinates">0.0, 0.0, 6.8</strong></div>
        <div class="ooh-playable__readout"><span>FIRE</span><strong data-ooh-playable-state="fire">READY</strong></div>
        <div class="ooh-playable__readout"><span>HEALTH</span><strong data-ooh-playable-state="health">100</strong></div>
        <div class="ooh-playable__readout"><span>THREAT</span><strong data-ooh-playable-state="threat">INACTIVE</strong></div>
        <div class="ooh-playable__readout"><span>OBJECTIVE</span><strong data-ooh-playable-state="objective">Awaiting objective</strong></div>
        <div class="ooh-playable__readout"><span>MISSION STATE</span><strong data-ooh-playable-state="missionState">IDLE</strong></div>
        <div class="ooh-playable__readout"><span>RESULT</span><strong data-ooh-playable-state="result">Pending</strong></div>
        <div class="ooh-playable__readout"><span>MISSION</span><strong data-ooh-playable-field="missionTitle">Unavailable</strong></div>
        <div class="ooh-playable__readout"><span>ROUTE</span><strong data-ooh-playable-field="campaignRoute">Unknown</strong></div>
        <div class="ooh-playable__readout"><span>RECRUITER</span><strong data-ooh-playable-field="recruiter">Unassigned</strong></div>
        <div class="ooh-playable__readout"><span>PLAYLIST</span><strong data-ooh-playable-field="playlist">Unlinked</strong></div>
        <p class="ooh-playable__diagnostic" data-ooh-playable-diagnostic>Awaiting mission payload.</p>
      </aside>
    </div>
  </div>
</section>
HTML;

    return [
      '#markup' => Markup::create($markup),
      '#attached' => [
        'library' => [
          'ooh_outskirts/playable_mission',
        ],
        'drupalSettings' => [
          'ooh_outskirts' => [
            'playableMission' => [
              'route' => $route_url,
              'queryMissionUuid' => $query_mission_uuid,
              'queryLevelId' => $query_level,
              'querySequenceEntry' => $query_sequence_entry,
              'stateKey' => 'ooh_game_generator_state_v1',
              'schemaVersion' => 'phase-3-combat-interaction-v1',
              'urls' => [
                'dossierTarget' => $dossier_url,
                'playTarget' => $play_url,
                'missionLookup' => 'ooh/mission-lookup',
              ],
            ],
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.query_args:missionUuid', 'url.query_args:level', 'url.query_args:sequenceEntry', 'user.roles:authenticated'],
        'max-age' => 0,
      ],
    ];
  }

}
