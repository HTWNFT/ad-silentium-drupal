<?php

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;

/**
 * Provides the OOH Dossier Assembly Block.
 *
 * @Block(
 *   id = "ooh_game_generator_block",
 *   admin_label = @Translation("OOH Dossier Assembly Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
class OohGameGeneratorBlock extends BlockBase {

  /**
   * Prompt source files keyed by campaign environment.
   */
  private const PROMPT_FILES = [
    'aer' => [
      'paths' => [
        '/sites/default/AERPROMPTS.txt',
        '/sites/default/AERPROMPTSIMAGES.txt',
        '/sites/default/AERPROMPTSVIDEO.txt',
      ],
      'routeCreditType' => 'AIR Route Credit',
    ],
    'mare' => [
      'paths' => ['/sites/default/MAREPROMPTS.txt'],
      'routeCreditType' => 'OCEAN Route Credit',
    ],
    'terra' => [
      'paths' => ['/sites/default/TERRAPROMPTS.txt'],
      'routeCreditType' => 'LAND Route Credit',
    ],
  ];

  /**
   * {@inheritdoc}
   */
  public function build() {
    $file_url_generator = \Drupal::service('file_url_generator');
    $recruiter_asset_base = 'public://adsilentium/portraits/Recruiters/';
    $sigil_asset_base = 'public://adsilentium/Sigils/';

    $playlists = [
      [
        'id' => 'rap_war',
        'label' => 'WAR BANGAZ',
        'description' => 'Late-00s to modern combat-heavy rap soundtrack.',
        'tier' => 'free',
        'spotifyUrl' => 'https://open.spotify.com/playlist/6CaO0WNPwOyB4ZBIwgJF3O',
        'spotifyUri' => 'spotify:playlist:6CaO0WNPwOyB4ZBIwgJF3O',
      ],
      [
        'id' => 'rock_war',
        'label' => 'STEEL WRECKONING',
        'description' => 'Hard rock and battlefield adrenaline.',
        'tier' => 'free',
        'spotifyUrl' => 'https://open.spotify.com/playlist/3wVMs0gb2svMUITiu0PJY4',
        'spotifyUri' => 'spotify:playlist:3wVMs0gb2svMUITiu0PJY4',
      ],
      [
        'id' => 'country_war',
        'label' => 'DUST MARCH',
        'description' => 'Road-raging Americana for frontier warfare.',
        'tier' => 'paid',
        'spotifyUrl' => 'https://open.spotify.com/playlist/76AhLGUeJhcZbgQYt8oqo8',
        'spotifyUri' => 'spotify:playlist:76AhLGUeJhcZbgQYt8oqo8',
      ],
      [
        'id' => 'classical_war',
        'label' => 'BLACK BANNER ORCHESTRA',
        'description' => 'Operatic dread and command-scale tension.',
        'tier' => 'founder',
        'spotifyUrl' => 'https://open.spotify.com/playlist/6aLCJNyLO0zN6qsb3LTZoy',
        'spotifyUri' => 'spotify:playlist:6aLCJNyLO0zN6qsb3LTZoy',
      ],
      [
        'id' => 'dark_ambient_tactical_suspense',
        'label' => 'SIGNAL BLITZ',
        'description' => 'Electro-Industrial Battle Fusion.',
        'tier' => 'paid',
        'spotifyUrl' => 'https://open.spotify.com/playlist/5yXFPozHV4eW9Aal5Ys7Mn',
        'spotifyUri' => 'spotify:playlist:5yXFPozHV4eW9Aal5Ys7Mn',
      ],
    ];

    $paths = [
      [
        'id' => 'doomed',
        'label' => 'DOOMED',
        'description' => 'Organic, kinetic, psychic, berserker, and survival-oriented evolution.',
        'tier' => 'free',
        'attributes' => [
          'Kinetic Force',
          'Psychic Pressure',
          'Berserker Rage',
          'Aerokinesis',
          'Oxygen Retention',
          'Survival Instinct',
        ],
        'recruiter' => [
          'id' => 'genescribe',
          'name' => 'Gene Scribe',
          'title' => 'Organic Path Recruiter',
          'portraitUrl' => $file_url_generator->generateString($recruiter_asset_base . 'Asset__Portraits__Recruiters__genescribe.webp'),
          'sigilUrl' => $file_url_generator->generateString($sigil_asset_base . 'genescribe.webp'),
          'script' => [
            'You are not upgraded. You are broken open.',
            'The body becomes weapon, weather, pressure, memory.',
            'Your lungs learn the ash. Your nerves learn the blast.',
            'Choose this path if you want force without permission.',
          ],
          'attributes' => [
            'Kinetic Force',
            'Psychic Pressure',
            'Berserker Rage',
            'Aerokinesis',
            'Oxygen Retention',
            'Survival Instinct',
          ],
          'recommendedFor' => 'Players who want violent momentum, psychic pressure, close survival, and an evolution path that feels alive under fire.',
          'soundboard' => [],
          'recruiterVoiceLines' => [],
          'attributeModifiers' => [],
        ],
        'characterSoundboard' => [],
      ],
      [
        'id' => 'merged',
        'label' => 'MERGED',
        'description' => 'Technological, synthetic, reality-bending, and engineered advancement.',
        'tier' => 'founder',
        'attributes' => [
          'Synthetic Flight',
          'Neural Interface',
          'Reality Bend',
          'Environmental Merge',
          'Tactical Override',
          'System Regeneration',
        ],
        'recruiter' => [
          'id' => 'mergedpathfinder',
          'name' => 'Merged Pathfinder',
          'title' => 'Synthetic Path Recruiter',
          'portraitUrl' => $file_url_generator->generateString($recruiter_asset_base . 'Asset__Portraits__Recruiters__signalcultrecruiter.webp'),
          'sigilUrl' => $file_url_generator->generateString($sigil_asset_base . 'mergedpathfinder.webp'),
          'script' => [
            'You are not repaired. You are integrated.',
            'Steel, signal, machine, and terrain answer through you.',
            'The battlefield stops being around you. It becomes command surface.',
            'Choose this path if you want the battlefield to become an extension of command.',
          ],
          'attributes' => [
            'Synthetic Flight',
            'Neural Interface',
            'Reality Bend',
            'Environmental Merge',
            'Tactical Override',
            'System Regeneration',
          ],
          'recommendedFor' => 'Players who want engineered movement, machine affinity, battlefield control, and synthetic regeneration under impossible conditions.',
          'soundboard' => [],
          'recruiterVoiceLines' => [],
          'attributeModifiers' => [],
        ],
        'characterSoundboard' => [],
      ],
    ];

    $missions = [
      [
        'id' => 'recon',
        'label' => 'Recon',
        'description' => 'Sky watch, cloud-line mapping, aerial observation, report.',
        'tier' => 'free',
        'campaignRoute' => 'aer',
        'missionSoundboard' => [],
      ],
      [
        'id' => 'survival',
        'label' => 'Survival',
        'description' => 'Aquatic endurance under ocean pressure and underwater collapse conditions.',
        'tier' => 'free',
        'campaignRoute' => 'mare',
        'missionSoundboard' => [],
      ],
      [
        'id' => 'purge',
        'label' => 'Purge',
        'description' => 'Ground hostile reduction through land corridors and bunker choke points.',
        'tier' => 'founder',
        'campaignRoute' => 'terra',
        'missionSoundboard' => [],
      ],
      [
        'id' => 'extraction',
        'label' => 'Extraction',
        'description' => 'Recover asset and exit by flight through aerial pressure.',
        'tier' => 'founder',
        'campaignRoute' => 'aer',
        'missionSoundboard' => [],
      ],
      [
        'id' => 'sabotage',
        'label' => 'Sabotage',
        'description' => 'Disrupt urban land infrastructure, bunker relays, and vanish.',
        'tier' => 'founder',
        'campaignRoute' => 'terra',
        'missionSoundboard' => [],
      ],
      [
        'id' => 'artifact_recovery',
        'label' => 'Artifact Recovery',
        'description' => 'Secure aquatic relic-class matter from naval ruins before enemy contact.',
        'tier' => 'founder',
        'campaignRoute' => 'mare',
        'missionSoundboard' => [],
      ],
    ];

    $campaign_routes = [
      [
        'id' => 'mixed',
        'label' => 'MIXED Campaign',
        'description' => 'Campaign can rotate across AER, MARE, and TERRA mission environments.',
        'tier' => 'free',
        'environments' => ['aer', 'mare', 'terra'],
        'routeCreditTypes' => [
          'AIR Route Credit',
          'OCEAN Route Credit',
          'LAND Route Credit',
        ],
      ],
      [
        'id' => 'aer',
        'label' => 'AER Campaign',
        'description' => 'Sky and air mission route. Built for aerial assaults, altitude threats, and open-atmosphere traversal.',
        'tier' => 'free',
        'environments' => ['aer'],
        'routeCreditTypes' => ['AIR Route Credit'],
      ],
      [
        'id' => 'mare',
        'label' => 'MARE Campaign',
        'description' => 'Ocean and underwater mission route. Built for submerged ruins, pressure zones, and hostile waters.',
        'tier' => 'free',
        'environments' => ['mare'],
        'routeCreditTypes' => ['OCEAN Route Credit'],
      ],
      [
        'id' => 'terra',
        'label' => 'TERRA Campaign',
        'description' => 'Land and ruins mission route. Built for broken cities, ash fields, bunker routes, and surface survival.',
        'tier' => 'free',
        'environments' => ['terra'],
        'routeCreditTypes' => ['LAND Route Credit'],
        'routeProfile' => [
          'levelFlowOrder' => [
            'establishing_wasteland_ridge',
            'traversal_bunker_road',
            'combat_ruin_corridor',
            'aftermath_ash_field',
            'boss_ground_citadel',
          ],
          'hazards' => [
            'terrain instability',
            'visibility reduction (dust/ash)',
            'ambush zones',
            'structural collapse',
          ],
          'enemyTypes' => [
            'ground_hostile',
            'warlord_units',
            'mechanized_terrestrial',
          ],
          'audioProfile' => [
            'low wind rumble',
            'debris movement',
            'distant artillery echoes',
            'metallic resonance',
          ],
        ],
      ],
    ];

    $paywall_url = Url::fromRoute('ooh_outskirts.clearance')->toString();
    $enter_target = Url::fromRoute('ooh_outskirts.play')->toString();
    $credits_target = Url::fromRoute('ooh_outskirts.credits')->toString();
    $home_target = Url::fromRoute('<front>')->toString();
    $account = \Drupal::currentUser();
    $is_logged_in = $account->isAuthenticated();
    $member_target = Url::fromRoute($is_logged_in ? 'user.page' : 'user.login')->toString();
    $member_label = $is_logged_in ? ($account->getDisplayName() ?: 'MEMBER') : 'LOGIN';
    $mission_prompts = $this->loadMissionPromptSnapshot();

    $build = [];

    $build['#attached']['library'][] = 'ooh_outskirts/game_generator';
    $build['#attached']['drupalSettings']['ooh_outskirts']['gameGenerator'] = [
      'playlists' => $playlists,
      'paths' => $paths,
      'missions' => $missions,
      'campaignRoutes' => $campaign_routes,
      'missionPrompts' => $mission_prompts,
      'access' => [
        'currentTier' => 'free',
        'foundersUnlocked' => FALSE,
        'allowPreviewSelections' => TRUE,
      ],
      'urls' => [
        'paywall' => $paywall_url,
        'enterTarget' => $enter_target,
        'creditsTarget' => $credits_target,
        'homeTarget' => $home_target,
        'memberTarget' => $member_target,
      ],
      'user' => [
        'loggedIn' => $is_logged_in,
        'memberLabel' => $member_label,
      ],
      'credits' => [
        'initial' => 60,
      ],
      'labels' => [
        'lockedTitle' => 'ACCESS RESTRICTED',
        'lockedBody' => 'Authorization required for this system package.',
        'enterIncomplete' => 'Select playlist, recruiter path, campaign route, at least 3 attributes, and mission type.',
        'enterLocked' => 'Upgrade required for selected package.',
        'enterReady' => 'PAYLOAD VERIFIED // READY FOR STAGING',
      ],
      'storage' => [
        'stateKey' => 'ooh_game_generator_state_v1',
        'accessKey' => 'ooh_founders_access_v1',
      ],
      'marker' => 'ooh_game_generator_block_v1',
    ];

    $build['content'] = [
      '#markup' => Markup::create('
<section class="ooh-generator" data-ooh-generator>
  <div class="ooh-generator__bg"></div>
  <div class="ooh-generator__inner">
    <nav class="ooh-generator__nav" aria-label="Dossier navigation">
      <a class="ooh-generator__nav-button ooh-generator__nav-button--home" href="' . $home_target . '">HOME</a>
      <div class="ooh-generator__nav-cluster">
        <a class="ooh-generator__nav-button" href="' . $credits_target . '" data-ooh-credits-link>CREDITS: 60</a>
        <a class="ooh-generator__nav-button" href="' . $member_target . '">' . htmlspecialchars($member_label, ENT_QUOTES, 'UTF-8') . '</a>
      </div>
    </nav>

    <div class="ooh-generator__header">
      <p class="ooh-generator__eyebrow">SELECTED OPERATIONS // DOSSIER ASSEMBLY</p>
      <h2 class="ooh-generator__title">DOSSIER</h2>
      <p class="ooh-generator__intro">
        Recruiters are standing by. Select soundtrack, path, and mission profile, then begin deployment.
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
      <div class="ooh-generator__status-line">
        <span class="ooh-generator__status-label">Campaign</span>
        <span class="ooh-generator__status-value" data-ooh-summary="campaignRoute">MIXED Campaign</span>
      </div>
      <div class="ooh-generator__status-line ooh-generator__status-line--tier">
        <span class="ooh-generator__status-label">Access Tier</span>
        <span class="ooh-generator__status-value" data-ooh-summary="tier">Visitor</span>
      </div>
      <div class="ooh-generator__status-line">
        <span class="ooh-generator__status-label">Credits</span>
        <span class="ooh-generator__status-value" data-ooh-summary="credits">60</span>
      </div>
    </div>

    <div class="ooh-generator__grid">
      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-playlist" data-ooh-section="playlist">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">01</div>
          <h3 id="ooh-panel-playlist" class="ooh-generator__panel-title">Playlist Selector</h3>
        </div>
        <div class="ooh-generator__options" data-ooh-group="playlist"></div>
        <div class="ooh-generator__spotify" data-ooh-spotify-preview hidden>
          <div class="ooh-generator__spotify-kicker">Playlist Uplink</div>
          <div class="ooh-generator__spotify-copy" data-ooh-spotify-name>Playlist pending.</div>
          <iframe class="ooh-generator__spotify-player" data-ooh-spotify-player title="Selected Spotify playlist" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
        </div>
      </section>

      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-path" data-ooh-section="recruiter">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">02</div>
          <h3 id="ooh-panel-path" class="ooh-generator__panel-title">Recruiter Station</h3>
        </div>
        <p class="ooh-generator__panel-copy">
          Recruiters will assemble the character profile around your selected evolution path.
        </p>
        <div class="ooh-generator__options" data-ooh-group="path"></div>
        <div class="ooh-generator__recruiter" data-ooh-recruiter-panel hidden></div>
      </section>

      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-campaign" data-ooh-section="campaignRoute">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">03</div>
          <h3 id="ooh-panel-campaign" class="ooh-generator__panel-title">Campaign Route</h3>
        </div>
        <p class="ooh-generator__panel-copy">
          Select the deployment route before mission type assignment.
        </p>
        <div class="ooh-generator__options" data-ooh-group="campaignRoute"></div>
      </section>

      <section class="ooh-generator__panel" aria-labelledby="ooh-panel-mission" data-ooh-section="mission">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">04</div>
          <h3 id="ooh-panel-mission" class="ooh-generator__panel-title">Mission Type</h3>
        </div>
        <div class="ooh-generator__options" data-ooh-group="mission"></div>
      </section>

      <section class="ooh-generator__panel ooh-generator__panel--enter" data-ooh-section="enter">
        <div class="ooh-generator__enter-wrap">
          <button type="button" class="ooh-generator__enter" data-ooh-enter>BEGIN</button>
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
'),
    ];

    return $build;
  }

  /**
   * Loads a stable prompt snapshot for the BEGIN payload.
   */
  private function loadMissionPromptSnapshot(): array {
    $library = [
      'aer' => [],
      'mare' => [],
      'terra' => [],
    ];

    foreach (self::PROMPT_FILES as $environment => $definition) {
      $raw_text = $this->loadFirstPromptText($definition['paths']);
      if ($raw_text === '') {
        continue;
      }

      $library[$environment][] = [
        'id' => $environment . '_prompt_library',
        'environment' => $environment,
        'title' => strtoupper($environment) . ' Prompt Library',
        'type' => $environment . '_prompt_library',
        'rawText' => $raw_text,
        'routeCreditType' => $definition['routeCreditType'],
      ];
    }

    return $library;
  }

  /**
   * Reads the first non-empty file from a list of prompt source paths.
   */
  private function loadFirstPromptText(array $relative_paths): string {
    foreach ($relative_paths as $relative_path) {
      $absolute_path = DRUPAL_ROOT . $relative_path;
      if (!is_readable($absolute_path)) {
        continue;
      }

      $raw_text = file_get_contents($absolute_path);
      if ($raw_text !== FALSE && trim($raw_text) !== '') {
        return trim(str_replace(["\r\n", "\r"], "\n", $raw_text));
      }
    }

    return '';
  }

}
