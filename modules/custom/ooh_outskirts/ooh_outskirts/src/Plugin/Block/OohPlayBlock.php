<?php

declare(strict_types=1);

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;

/**
 * Provides the OOH Play Block.
 *
 * @Block(
 *   id = "ooh_play_block",
 *   admin_label = @Translation("OOH Play Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
final class OohPlayBlock extends BlockBase {

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
   * Fallback TERRA section order used when headers are imperfect.
   */
  private const TERRA_FALLBACK_SECTIONS = [
    'establishing_wasteland_ridge' => 'Establishing Wasteland Ridge',
    'traversal_bunker_road' => 'Traversal Bunker Road',
    'combat_ruin_corridor' => 'Combat Ruin Corridor',
    'aftermath_ash_field' => 'Aftermath Ash Field',
    'boss_ground_citadel' => 'Boss Ground Citadel',
  ];

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'title' => 'Mission Briefing',
      'subtitle' => 'Dossier accepted. Mission staging renderer online.',
      'require_login' => FALSE,
      'playlist_options' => "rap|War Bangaz\nrock|War Rock",
      'recruiter_options' => "merged|Merged\ndoomed|Doomed",
      'mission_options' => "scout|Scout\nassault|Assault\ninfiltrate|Infiltrate\nsurvive|Survive",
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);

    $form['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title'),
      '#default_value' => (string) ($this->configuration['title'] ?? 'Stage 2 // Signal Alignment'),
    ];

    $form['subtitle'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Subtitle'),
      '#rows' => 3,
      '#default_value' => (string) ($this->configuration['subtitle'] ?? 'Classify the player before assembly.'),
    ];

    $form['require_login'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Require login to view play block'),
      '#default_value' => (bool) ($this->configuration['require_login'] ?? TRUE),
    ];

    $form['playlist_options'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Playlist options'),
      '#description' => $this->t('One per line, format: machine_key|Label'),
      '#rows' => 4,
      '#default_value' => (string) ($this->configuration['playlist_options'] ?? "rap|War Bangaz\nrock|War Rock"),
    ];

    $form['recruiter_options'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Recruiter options'),
      '#description' => $this->t('One per line, format: machine_key|Label'),
      '#rows' => 4,
      '#default_value' => (string) ($this->configuration['recruiter_options'] ?? "merged|Merged\ndoomed|Doomed"),
    ];

    $form['mission_options'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Mission options'),
      '#description' => $this->t('One per line, format: machine_key|Label'),
      '#rows' => 6,
      '#default_value' => (string) ($this->configuration['mission_options'] ?? "scout|Scout\nassault|Assault\ninfiltrate|Infiltrate\nsurvive|Survive"),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    parent::blockSubmit($form, $form_state);

    $this->configuration['title'] = (string) $form_state->getValue('title');
    $this->configuration['subtitle'] = (string) $form_state->getValue('subtitle');
    $this->configuration['require_login'] = (bool) $form_state->getValue('require_login');
    $this->configuration['playlist_options'] = (string) $form_state->getValue('playlist_options');
    $this->configuration['recruiter_options'] = (string) $form_state->getValue('recruiter_options');
    $this->configuration['mission_options'] = (string) $form_state->getValue('mission_options');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $config = $this->configuration + $this->defaultConfiguration();
    $current_user = \Drupal::currentUser();

    if (!empty($config['require_login']) && !$current_user->isAuthenticated()) {
      $login_url = Url::fromRoute('user.login', [], [
        'query' => ['destination' => '/play'],
      ])->toString();

      $markup = '
<section class="ooh-shell">
  <div class="ooh-card">
    <h2 class="ooh-title">ACCESS REQUIRED</h2>
    <p class="ooh-subtitle">LOGIN before mission staging.</p>
    <div class="ooh-row">
      <a class="ooh-btn" href="' . htmlspecialchars($login_url, ENT_QUOTES, 'UTF-8') . '">LOGIN</a>
    </div>
  </div>
</section>';

      return [
        '#markup' => Markup::create($markup),
        '#attached' => [
          'library' => [
            'ooh_outskirts/base',
          ],
        ],
        '#cache' => [
          'contexts' => ['user.roles:authenticated'],
          'max-age' => 0,
        ],
      ];
    }

    $title = htmlspecialchars((string) ($config['title'] ?? 'Mission Briefing'), ENT_QUOTES, 'UTF-8');
    $subtitle = nl2br(htmlspecialchars((string) ($config['subtitle'] ?? ''), ENT_QUOTES, 'UTF-8'));
    $dossier_target = Url::fromRoute('ooh_outskirts.dossier')->toString();
    $dossier_target_escaped = htmlspecialchars($dossier_target, ENT_QUOTES, 'UTF-8');
    $prompt_library = $this->loadMissionPrompts();

    $markup = <<<HTML
<section class="ooh-generator ooh-play-session ooh-play-briefing" data-ooh-play>
  <div class="ooh-generator__bg"></div>
  <div class="ooh-generator__inner">
    <nav class="ooh-generator__nav" aria-label="Mission navigation">
      <a class="ooh-generator__nav-button ooh-generator__nav-button--home" href="{$dossier_target_escaped}">RETURN TO DOSSIER</a>
    </nav>

    <div class="ooh-generator__header ooh-play-scene__header" data-ooh-play-top>
      <div class="ooh-generator__eyebrow" data-ooh-scene-route-label>MISSION SCENE // ROUTE PENDING</div>
      <h2 class="ooh-generator__title">{$title}</h2>
      <p class="ooh-generator__intro">{$subtitle}</p>
    </div>

    <div class="ooh-play-scene" data-ooh-scene-shell data-route="TERRA" data-path="UNASSIGNED" data-mission-type="unconfirmed" data-playlist-mood="neutral">
      <div class="ooh-play-scene__visual" aria-hidden="true">
        <video class="ooh-play-scene__asset-video" data-ooh-scene-video muted loop playsinline preload="metadata"></video>
        <div class="ooh-play-scene__sky"></div>
        <div class="ooh-play-scene__horizon"></div>
        <div class="ooh-play-scene__terrain"></div>
        <div class="ooh-play-scene__structure ooh-play-scene__structure--one"></div>
        <div class="ooh-play-scene__structure ooh-play-scene__structure--two"></div>
        <div class="ooh-play-scene__marker ooh-play-scene__marker--alpha"></div>
        <div class="ooh-play-scene__marker ooh-play-scene__marker--beta"></div>
        <div class="ooh-play-scene__mission-label" data-ooh-scene-mission-label>MISSION TYPE // PENDING</div>
        <div class="ooh-play-scene__staging-card">
          <span class="ooh-play-scene__staging-kicker">MISSION STATUS</span>
          <span class="ooh-play-scene__staging-copy" data-ooh-scene-status>MISSION STAGED // PAYLOAD VERIFIED // AWAITING ACTIVATION</span>
        </div>
        <aside class="ooh-play__hud" data-ooh-active-hud aria-label="Active mission HUD" aria-hidden="true">
          <div class="ooh-play__hud-panel ooh-play__hud-panel--command">
            <span class="ooh-play__hud-label">OPERATION</span>
            <span class="ooh-play__hud-value" data-ooh-hud-field="codename">Pending</span>
          </div>
          <div class="ooh-play__hud-grid">
            <div class="ooh-play__hud-readout">
              <span class="ooh-play__hud-label">THEATER</span>
              <span class="ooh-play__hud-value" data-ooh-hud-field="theater">Pending</span>
            </div>
            <div class="ooh-play__hud-readout">
              <span class="ooh-play__hud-label">MISSION</span>
              <span class="ooh-play__hud-value" data-ooh-hud-field="mission">Pending</span>
            </div>
            <div class="ooh-play__hud-readout">
              <span class="ooh-play__hud-label">PATH</span>
              <span class="ooh-play__hud-value" data-ooh-hud-field="path">Pending</span>
            </div>
            <div class="ooh-play__hud-readout">
              <span class="ooh-play__hud-label">STATUS</span>
              <span class="ooh-play__hud-value" data-ooh-hud-field="status">STAGED</span>
            </div>
          </div>
          <div class="ooh-play__hud-panel">
            <span class="ooh-play__hud-label">PRIMARY OBJECTIVE</span>
            <span class="ooh-play__hud-value" data-ooh-hud-field="primary">Pending</span>
          </div>
          <div class="ooh-play__hud-panel">
            <span class="ooh-play__hud-label">EXTRACTION</span>
            <span class="ooh-play__hud-value" data-ooh-hud-field="extraction">Pending</span>
          </div>
          <div class="ooh-play__hud-panel ooh-play__hud-panel--actions">
            <span class="ooh-play__hud-label">PASSIVE INPUT</span>
            <div class="ooh-play__hud-actions" aria-label="Passive mission inputs">
              <button class="ooh-play__hud-action" type="button" data-ooh-action="scan" disabled>SCAN</button>
              <button class="ooh-play__hud-action" type="button" data-ooh-action="hold" disabled>HOLD POSITION</button>
              <button class="ooh-play__hud-action" type="button" data-ooh-action="signal" disabled>CHECK SIGNAL</button>
            </div>
          </div>
          <div class="ooh-play__hud-panel ooh-play__hud-panel--readout">
            <span class="ooh-play__hud-label">INPUT READOUT</span>
            <span class="ooh-play__hud-value" data-ooh-action-readout>Awaiting active mission input.</span>
          </div>
          <div class="ooh-play__hud-band">
            <span data-ooh-hud-field="telemetryA">Telemetry pending</span>
            <span data-ooh-hud-field="telemetryB">Telemetry pending</span>
            <span data-ooh-hud-field="telemetryC">Telemetry pending</span>
          </div>
        </aside>
        <div class="ooh-play-scene__scanlines"></div>
      </div>

      <div class="ooh-play-scene__hud">
        <section class="ooh-generator__panel ooh-play-scene__briefing-panel" data-ooh-mission-briefing>
          <div class="ooh-generator__panel-head">
            <div class="ooh-generator__panel-kicker" data-ooh-briefing-field="route">---</div>
            <h3 class="ooh-generator__panel-title">Mission Briefing</h3>
          </div>
          <pre class="ooh-play-mission__briefing ooh-play-mission__briefing--generated" data-ooh-generated-briefing>Awaiting dossier payload.</pre>
          <div class="ooh-play-combat-gate" data-ooh-combat-gate hidden>
            <button class="ooh-play-combat-gate__button" type="button" data-ooh-combat-gate-button disabled aria-disabled="true">ENGAGE HOSTILE CONTACT</button>
            <span class="ooh-play-combat-gate__note" data-ooh-combat-gate-status>Combat systems offline.</span>
          </div>
          <div class="ooh-play-encounter" data-ooh-combat-encounter hidden aria-live="polite">
            <div class="ooh-play-encounter__header">
              <span class="ooh-play-encounter__kicker">ENCOUNTER SCAFFOLD</span>
              <span class="ooh-play-encounter__status" data-ooh-encounter-status>CONTACT DISPLAY ONLY</span>
            </div>
            <article class="ooh-play-encounter__card" data-ooh-hostile-card>
              <h4 class="ooh-play-encounter__title">HOSTILE CONTACT // UNIDENTIFIED</h4>
              <dl class="ooh-play-encounter__readouts">
                <div>
                  <dt>THREAT CLASS</dt>
                  <dd>PROBING</dd>
                </div>
                <div>
                  <dt>RANGE</dt>
                  <dd>OUTER PERIMETER</dd>
                </div>
                <div>
                  <dt>STATUS</dt>
                  <dd>OBSERVING</dd>
                </div>
              </dl>
            </article>
            <div class="ooh-play-encounter__actions" aria-label="Combat actions unavailable">
              <button class="ooh-play-encounter__action" type="button" disabled aria-disabled="true">TARGET</button>
              <button class="ooh-play-encounter__action" type="button" disabled aria-disabled="true">EVADE</button>
              <button class="ooh-play-encounter__action" type="button" disabled aria-disabled="true">SUPPRESS</button>
            </div>
          </div>
        </section>

        <aside class="ooh-generator__panel ooh-play-scene__telemetry" aria-label="Mission telemetry">
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Mission Type</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="mission">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Recruiter Path</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="path">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Operator Evolution</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="operatorEvolution">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Path Resonance</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="pathResonance">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Channel Stability</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="channelStability">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Observed Signals</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="observedSignals">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Recruiter</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="recruiter">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Playlist / Theme</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="playlist">Pending</span>
          </div>
          <div class="ooh-play-scene__field">
            <span class="ooh-generator__status-label">Prompt Block</span>
            <span class="ooh-generator__status-value" data-ooh-briefing-field="prompt">Pending</span>
          </div>
        </aside>
      </div>

      <section class="ooh-generator__panel ooh-play-scene__assembly" aria-label="Personalized mission assembly">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">ASM</div>
          <h3 class="ooh-generator__panel-title">Personalized Mission Assembly</h3>
        </div>
        <div class="ooh-play-assembly__grid" data-ooh-mission-assembly>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Codename</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="missionCodename">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Route Theater</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="routeTheater">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Primary Objective</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="primaryObjective">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Secondary Objective</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="secondaryObjective">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Insertion Style</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="insertionStyle">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Environment Hazards</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="environmentHazards">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Threat Profile</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="threatProfile">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Recruiter Directive</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="recruiterDirective">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Playlist Mood Effect</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="playlistMoodEffect">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Extraction Condition</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="extractionCondition">Pending</span>
          </div>
          <div class="ooh-play-assembly__field">
            <span class="ooh-generator__status-label">Route Credit Type</span>
            <span class="ooh-generator__status-value" data-ooh-assembly-field="routeCreditType">Pending</span>
          </div>
        </div>
      </section>

      <section class="ooh-generator__panel ooh-play-scene__debug" aria-label="Payload snapshot">
        <div class="ooh-generator__panel-head">
          <div class="ooh-generator__panel-kicker">PAY</div>
          <h3 class="ooh-generator__panel-title">Payload Snapshot</h3>
        </div>
        <pre class="ooh-play-mission__debug" data-ooh-briefing-debug>Awaiting payload.</pre>
      </section>

      <div class="ooh-play-scene__actions">
        <button class="ooh-generator__overlay-btn ooh-play-scene__activate" type="button" data-ooh-activate-mission>ACTIVATE MISSION</button>
        <a class="ooh-generator__overlay-btn" href="{$dossier_target_escaped}">Return to Dossier</a>
      </div>
    </div>
  </div>
</section>
HTML;

    return [
      '#markup' => Markup::create($markup),
      '#attached' => [
        'library' => [
          'ooh_outskirts/play',
        ],
        'drupalSettings' => [
          'ooh_outskirts' => [
            'play' => [
              'urls' => [
                'dossierTarget' => $dossier_target,
              ],
            ],
            'missionPrompts' => $prompt_library['prompts'],
            'missionPromptWarnings' => $prompt_library['warnings'],
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.query_args:seed', 'user.roles:authenticated'],
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Loads local mission prompt text from sites/default without fatal failures.
   */
  private function loadMissionPrompts(): array {
    $library = [
      'aer' => [],
      'mare' => [],
      'terra' => [],
    ];
    $warnings = [];

    foreach (self::PROMPT_FILES as $environment => $definition) {
      $source = $this->loadFirstReadablePromptSource($environment, $definition['paths']);
      $warnings = array_merge($warnings, $source['warnings']);

      if ($source['rawText'] === '') {
        continue;
      }

      $library[$environment] = $environment === 'terra'
        ? $this->parseTerraPrompts($source['rawText'], $definition['routeCreditType'])
        : $this->parseGenericPrompts($environment, $source['rawText'], $definition['routeCreditType']);
    }

    return [
      'prompts' => $library,
      'warnings' => $warnings,
    ];
  }

  /**
   * Loads the first non-empty prompt source for an environment.
   */
  private function loadFirstReadablePromptSource(string $environment, array $relative_paths): array {
    $warnings = [];

    foreach ($relative_paths as $index => $relative_path) {
      $absolute_path = DRUPAL_ROOT . $relative_path;

      if (!is_readable($absolute_path)) {
        $warnings[] = strtoupper($environment) . ' prompt file missing or unreadable: ' . $relative_path;
        continue;
      }

      $raw_text = file_get_contents($absolute_path);
      if ($raw_text !== FALSE && trim($raw_text) !== '') {
        if ($index > 0) {
          $warnings[] = strtoupper($environment) . ' primary prompt source empty; using fallback: ' . $relative_path;
        }
        return [
          'rawText' => $raw_text,
          'path' => $relative_path,
          'warnings' => $warnings,
        ];
      }

      $warnings[] = strtoupper($environment) . ' prompt file is empty or unreadable: ' . $relative_path;
    }

    return [
      'rawText' => '',
      'path' => '',
      'warnings' => $warnings,
    ];
  }

  /**
   * Parses TERRA prompt text into known route sections with keyword fallback.
   */
  private function parseTerraPrompts(string $raw_text, string $route_credit_type): array {
    $normalized = $this->normalizeLineEndings($raw_text);
    $sections = $this->splitByKnownSections($normalized, self::TERRA_FALLBACK_SECTIONS);

    if (!$sections) {
      $sections = $this->splitTerraByKeywords($normalized);
    }

    if (!$sections) {
      $sections = ['terra_prompt_library' => $normalized];
    }

    return $this->buildPromptBlocks('terra', $sections, self::TERRA_FALLBACK_SECTIONS, $route_credit_type);
  }

  /**
   * Parses AER and MARE conservatively by headings, preserving raw prompt text.
   */
  private function parseGenericPrompts(string $environment, string $raw_text, string $route_credit_type): array {
    $normalized = $this->normalizeLineEndings($raw_text);
    $sections = $this->splitByLooseHeadings($normalized);

    if (!$sections) {
      $sections = [$environment . '_prompt_library' => $normalized];
    }

    return $this->buildPromptBlocks($environment, $sections, [], $route_credit_type);
  }

  /**
   * Normalizes line endings and trims only outer whitespace.
   */
  private function normalizeLineEndings(string $text): string {
    return trim(str_replace(["\r\n", "\r"], "\n", $text));
  }

  /**
   * Splits text when known section ids or labels are present as headings.
   */
  private function splitByKnownSections(string $text, array $known_sections): array {
    $matches = [];
    $labels = [];

    foreach ($known_sections as $id => $title) {
      $labels[] = preg_quote($id, '/');
      $labels[] = preg_quote($title, '/');
      $labels[] = preg_quote(str_replace('_', ' ', $id), '/');
    }

    $pattern = '/^(?:#{1,6}\s*)?(' . implode('|', $labels) . ')\s*:?\s*$/mi';
    if (!preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
      return [];
    }

    return $this->sectionsFromHeadingMatches($text, $matches[1]);
  }

  /**
   * Uses broad TERRA keywords if exact route section headings are absent.
   */
  private function splitTerraByKeywords(string $text): array {
    $keyword_map = [
      'establishing_wasteland_ridge' => 'establishing',
      'traversal_bunker_road' => 'traversal',
      'combat_ruin_corridor' => 'combat',
      'aftermath_ash_field' => 'aftermath',
      'boss_ground_citadel' => 'boss',
    ];
    $matches = [];

    foreach ($keyword_map as $id => $keyword) {
      if (preg_match('/^.*\b' . preg_quote($keyword, '/') . '\b.*$/mi', $text, $match, PREG_OFFSET_CAPTURE)) {
        $matches[] = [
          'id' => $id,
          'offset' => $match[0][1],
        ];
      }
    }

    if (!$matches) {
      return [];
    }

    usort($matches, static fn(array $a, array $b): int => $a['offset'] <=> $b['offset']);
    $sections = [];

    foreach ($matches as $index => $match) {
      $start = $match['offset'];
      $end = $matches[$index + 1]['offset'] ?? strlen($text);
      $body = trim(substr($text, $start, $end - $start));
      if ($body !== '') {
        $sections[$match['id']] = $body;
      }
    }

    return $sections;
  }

  /**
   * Splits generic prompt files by common markdown/plain headings.
   */
  private function splitByLooseHeadings(string $text): array {
    $matches = [];
    $pattern = '/^(?:#{1,6}\s*)?([A-Z][A-Z0-9 _\/:-]{3,}|[a-z0-9_]+(?:_[a-z0-9]+)+)\s*:?\s*$/m';

    if (!preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
      return [];
    }

    if (count($matches[1]) < 2) {
      return [];
    }

    return $this->sectionsFromHeadingMatches($text, $matches[1]);
  }

  /**
   * Converts heading regex matches into section bodies.
   */
  private function sectionsFromHeadingMatches(string $text, array $heading_matches): array {
    $sections = [];

    foreach ($heading_matches as $index => $heading_match) {
      $heading = trim($heading_match[0]);
      $heading_offset = $heading_match[1];
      $body_start = $heading_offset + strlen($heading_match[0]);
      $body_end = $heading_matches[$index + 1][1] ?? strlen($text);
      $body = trim(substr($text, $body_start, $body_end - $body_start));
      $id = $this->machineName($heading);

      if ($body !== '' && $id !== '') {
        $sections[$id] = $body;
      }
    }

    return $sections;
  }

  /**
   * Builds normalized prompt blocks for drupalSettings.
   */
  private function buildPromptBlocks(string $environment, array $sections, array $known_titles, string $route_credit_type): array {
    $blocks = [];

    foreach ($sections as $id => $raw_text) {
      $clean_id = $this->machineName((string) $id) ?: $environment . '_prompt_' . (count($blocks) + 1);
      $blocks[] = [
        'id' => $clean_id,
        'environment' => $environment,
        'title' => $known_titles[$clean_id] ?? $this->titleFromId($clean_id),
        'type' => $clean_id,
        'rawText' => trim((string) $raw_text),
        'routeCreditType' => $route_credit_type,
      ];
    }

    return $blocks;
  }

  /**
   * Converts a label to a stable machine name.
   */
  private function machineName(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '_', $value) ?? '';
    return trim($value, '_');
  }

  /**
   * Converts a machine name to a readable title.
   */
  private function titleFromId(string $id): string {
    return ucwords(str_replace('_', ' ', $id));
  }

}
