<?php

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides the OOH Game Generator Block.
 *
 * @Block(
 *   id = "ooh_game_generator_block",
 *   admin_label = @Translation("OOH Game Generator Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
class OohGameGeneratorBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    $playlists = [
      [
        'id' => 'rap_war',
        'label' => 'War Bangaz',
        'description' => 'Late-00s to modern combat-heavy rap soundtrack.',
        'tier' => 'free',
      ],
      [
        'id' => 'techno_war',
        'label' => 'Signal Blitz',
        'description' => 'Electro-Industrial Battle Fusion.',
        'tier' => 'founder',
      ],
      [
        'id' => 'country_war',
        'label' => 'Dust March',
        'description' => 'Road-raging Americana for frontier warfare.',
        'tier' => 'founder',
      ],
      [
        'id' => 'classical_war',
        'label' => 'Black Banner Orchestra',
        'description' => 'Operatic dread and command-scale tension.',
        'tier' => 'founder',
      ],
      [
        'id' => 'rock_war',
        'label' => 'Steel Wreckoning',
        'description' => 'Hard rock and battlefield adrenaline.',
        'tier' => 'free',
      ],
    ];

    $paths = [
      [
        'id' => 'doomed',
        'label' => 'Doomed',
        'description' => 'Ancient practice. Human will. Ritual survival.',
        'tier' => 'free',
      ],
      [
        'id' => 'merged',
        'label' => 'Merged',
        'description' => 'Synthetic precision. Engineered evolution.',
        'tier' => 'founder',
      ],
    ];

    $missions = [
      [
        'id' => 'recon',
        'label' => 'Recon',
        'description' => 'Observe, map, survive, report.',
        'tier' => 'free',
      ],
      [
        'id' => 'survival',
        'label' => 'Survival',
        'description' => 'Hold together under collapse conditions.',
        'tier' => 'free',
      ],
      [
        'id' => 'purge',
        'label' => 'Purge',
        'description' => 'Direct hostile reduction with maximum force.',
        'tier' => 'founder',
      ],
      [
        'id' => 'extraction',
        'label' => 'Extraction',
        'description' => 'Recover asset and exit under pressure.',
        'tier' => 'founder',
      ],
      [
        'id' => 'sabotage',
        'label' => 'Sabotage',
        'description' => 'Disrupt hostile infrastructure and vanish.',
        'tier' => 'founder',
      ],
      [
        'id' => 'artifact_recovery',
        'label' => 'Artifact Recovery',
        'description' => 'Secure relic-class matter before enemy contact.',
        'tier' => 'founder',
      ],
    ];

    $paywall_url = '/clearance';
    $enter_target = '/play';

    $build = [];

    $build['#attached']['library'][] = 'ooh_outskirts/game_generator';
    $build['#attached']['drupalSettings']['ooh_outskirts']['gameGenerator'] = [
      'playlists' => $playlists,
      'paths' => $paths,
      'missions' => $missions,
      'access' => [
        'currentTier' => 'free',
        'foundersUnlocked' => FALSE,
      ],
      'urls' => [
        'paywall' => $paywall_url,
        'enterTarget' => $enter_target,
      ],
      'labels' => [
        'lockedTitle' => 'ACCESS RESTRICTED',
        'lockedBody' => 'Authorization required for this system package.',
        'enterIncomplete' => 'Select playlist, path, and mission.',
        'enterLocked' => 'Upgrade required for selected package.',
      ],
      'storage' => [
        'stateKey' => 'ooh_game_generator_state_v1',
        'accessKey' => 'ooh_founders_access_v1',
      ],
      'marker' => 'ooh_game_generator_block_v1',
    ];

    $build['content'] = [
      '#markup' => '
<section class="ooh-generator" data-ooh-generator>
  <div class="ooh-generator__bg"></div>
  <div class="ooh-generator__inner">
    <div class="ooh-generator__header">
      <h2 class="ooh-generator__title">Game Generator</h2>
      <p class="ooh-generator__intro">
        Assemble your soundtrack, path, and mission package. Restricted systems require Founders clearance.
      </p>
    </div>

    <div class="ooh-generator__status" data-ooh-status-panel>
      <div class="ooh-generator__status-line">
        <span class="ooh-generator__status-label">Playlist</span>
        <span class="ooh-generator__status-value" data-ooh-summary="playlist">Unselected</span>
      </div>
      <div class="ooh-generator__status-line">
        <span class="ooh-generator__status-label">Recruit Path</span>
        <span class="ooh-generator__status-value" data-ooh-summary="path">Unselected</span>
      </div>
      <div class="ooh-generator__status-line">
        <span class="ooh-generator__status-label">Mission Type</span>
        <span class="ooh-generator__status-value" data-ooh-summary="mission">Unselected</span>
      </div>
      <div class="ooh-generator__status-line ooh-generator__status-line--tier">
        <span class="ooh-generator__status-label">Access Tier</span>
        <span class="ooh-generator__status-value" data-ooh-summary="tier">Visitor</span>
      </div>
    </div>

    <div class="ooh-generator__grid">
      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-playlist">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">01</div>
          <h3 id="ooh-panel-playlist" class="ooh-generator__panel-title">Playlist Selector</h3>
        </div>
        <div class="ooh-generator__options" data-ooh-group="playlist"></div>
      </section>

      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-path">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">02</div>
          <h3 id="ooh-panel-path" class="ooh-generator__panel-title">Recruiter Station</h3>
        </div>
        <div class="ooh-generator__options" data-ooh-group="path"></div>
      </section>

      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-mission">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">03</div>
          <h3 id="ooh-panel-mission" class="ooh-generator__panel-title">Mission Type</h3>
        </div>
        <div class="ooh-generator__options" data-ooh-group="mission"></div>
      </section>

      <section class="ooh-generator__panel ooh-generator__panel--enter">
        <div class="ooh-generator__enter-wrap">
          <a href="/play" class="ooh-generator__enter" data-ooh-enter>PLAY</a>
        </div>
      </section>
    </div>

    <div class="ooh-generator__overlay" data-ooh-locked-overlay hidden>
      <div class="ooh-generator__overlay-card">
        <div class="ooh-generator__overlay-kicker">ACCESS RESTRICTED</div>
        <h3 class="ooh-generator__overlay-title">Authorization Required</h3>
        <p class="ooh-generator__overlay-copy">
          This package is reserved for operators with Founders clearance.
        </p>
        <div class="ooh-generator__overlay-actions">
          <a class="ooh-generator__overlay-btn" id="unlock-clearance-link" href="' . $paywall_url . '">UNLOCK CLEARANCE</a>
        </div>
      </div>
    </div>
  </div>
</section>
',
    ];

    return $build;
  }

}