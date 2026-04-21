<?php

declare(strict_types=1);

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;

/**
 * Provides the OOH Landing Block.
 *
 * @Block(
 *   id = "ooh_landing_block",
 *   admin_label = @Translation("OOH Landing Block"),
 *   category = @Translation("OOH")
 * )
 */
final class OohLandingBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'prologue_enabled' => TRUE,
      'prologue_auto_open' => TRUE,
      'prologue_auto_delay_ms' => 2600,
      'prologue_kicker' => 'Outskirts of Hell',
      'prologue_title' => 'Ad Silentium',
      'prologue_text' => <<<'TXT'
In a long-distant, incalculable number of years from now, the universe will stop expanding, becoming full of matter like oxygen in an air-filled lung.

Reality's "waste matter" will be filtered through and forced out at this stage, while beneficial matter remains. This "matter" will be the living; some can stay, others must leave.

The time when the harmful and beneficial coexist will be "Ad Silentium", a stillness replicated in the pause between breaths.

The humans to continue into the next phase are "Selected". They fall into two categories: "Merged" and "Doomed".

The Merged have evolved into unity with the technology they used for centuries, a rote repetition across many generations, fusing humanity with its progress.

The Doomed forced their own adaptive evolution through intensive study and practice of ancient ways. The name is one of sarcastic irony; they are esoteric masters on all levels.

The scourge of the new reality is the Genetic Warlord Class. They are the long-descended remnants of the Genetic Elite class. Many thousands of years before Ad Silentium, they denied recognition of powers beyond themselves and were left behind genetically, physically manifesting their grand denial. Many millennia ago, they fused nature and technology with genetics to survive and live forever.

Thousands of years later, the families of these elites are low in numbers and are fighting their inevitable expulsion from the universe's realm as waste matter. However, many existing clans are still clinging to their fading power, still denying the reality that they are marked for removal from reality in this culling.

These worldwide elites engineered mutations out of spite upon discovering they were not "Merged" or "Doomed". Dubbed "Creations", they are merged animal and human DNA. Millennia later, these creations have destroyed all nature and wildlife. Some are still loyal to the Genetic Warlord clans (Mutant class) while others roam free (Ronin class), and will help or harm both Evolved and Doomed.

You are one of The Selected and are a target of Genetic Warlords and Creations of all kinds.

You may choose the path of the Merged, a character who is a fusion of human and technology, with powers that translate well into a world that has merged with you, mirroring technology in nature.

Or you may choose the path of the Doomed, a character with the power to manipulate the still-existing "Old Reality" at will, having evolved in a way that was once forsaken and then reclaimed by your kind.

The forces of human progress and evolution have merged, and fate is to be earned in the new reality of Ad Silentium.
TXT,
      'hero_interval_ms' => 6500,
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $form = parent::blockForm($form, $form_state);

    $form['ooh_prologue'] = [
      '#type' => 'details',
      '#title' => $this->t('OOH Prologue'),
      '#open' => TRUE,
      '#tree' => TRUE,
    ];

    $form['ooh_prologue']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable prologue overlay'),
      '#default_value' => (bool) ($this->configuration['prologue_enabled'] ?? TRUE),
    ];

    $form['ooh_prologue']['auto_open'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Auto-open prologue'),
      '#default_value' => (bool) ($this->configuration['prologue_auto_open'] ?? TRUE),
    ];

    $form['ooh_prologue']['auto_delay_ms'] = [
      '#type' => 'number',
      '#title' => $this->t('Auto-open delay (ms)'),
      '#min' => 0,
      '#step' => 100,
      '#default_value' => (int) ($this->configuration['prologue_auto_delay_ms'] ?? 2600),
    ];

    $form['ooh_prologue']['kicker'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Kicker'),
      '#default_value' => (string) ($this->configuration['prologue_kicker'] ?? 'Outskirts of Hell'),
    ];

    $form['ooh_prologue']['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title'),
      '#default_value' => (string) ($this->configuration['prologue_title'] ?? 'Ad Silentium'),
    ];

    $form['ooh_prologue']['text'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Prologue text'),
      '#description' => $this->t('Use a blank line between paragraphs.'),
      '#default_value' => (string) ($this->configuration['prologue_text'] ?? ''),
      '#rows' => 10,
    ];

    $form['ooh_hero'] = [
      '#type' => 'details',
      '#title' => $this->t('OOH Hero'),
      '#open' => TRUE,
    ];

    $form['ooh_hero']['hero_interval_ms'] = [
      '#type' => 'number',
      '#title' => $this->t('Carousel interval (ms)'),
      '#min' => 1500,
      '#step' => 100,
      '#default_value' => (int) ($this->configuration['hero_interval_ms'] ?? 6500),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    parent::blockSubmit($form, $form_state);

    $values = (array) $form_state->getValue('ooh_prologue');
    $this->configuration['prologue_enabled'] = (bool) ($values['enabled'] ?? TRUE);
    $this->configuration['prologue_auto_open'] = (bool) ($values['auto_open'] ?? TRUE);
    $this->configuration['prologue_auto_delay_ms'] = (int) ($values['auto_delay_ms'] ?? 2600);
    $this->configuration['prologue_kicker'] = (string) ($values['kicker'] ?? 'Outskirts of Hell');
    $this->configuration['prologue_title'] = (string) ($values['title'] ?? 'Ad Silentium');
    $this->configuration['prologue_text'] = (string) ($values['text'] ?? '');

    $hero_values = (array) $form_state->getValue('ooh_hero');
    $this->configuration['hero_interval_ms'] = (int) ($hero_values['hero_interval_ms'] ?? 6500);
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
   $slides = $this->loadSlidesFromManifests();

  if ($slides === []) {
   $slides = $this->getDefaultSlides();
  }

    $prologue = [
      'enabled' => (bool) ($this->configuration['prologue_enabled'] ?? TRUE),
      'autoOpen' => (bool) ($this->configuration['prologue_auto_open'] ?? TRUE),
      'autoDelayMs' => (int) ($this->configuration['prologue_auto_delay_ms'] ?? 2600),
      'kicker' => (string) ($this->configuration['prologue_kicker'] ?? 'Outskirts of Hell'),
      'title' => (string) ($this->configuration['prologue_title'] ?? 'Ad Silentium'),
      'paragraphs' => $paragraphs,
      'storageKey' => 'ooh_prologue_seen_v3',
    ];

    return [
      '#markup' => Markup::create($this->renderMarkup($slides)),
      '#attached' => [
        'library' => [
          'ooh_outskirts/landing',
        ],
        'drupalSettings' => [
          'ooh_outskirts' => [
            'heroSlides' => $slides,
            'heroIntervalMs' => (int) ($this->configuration['hero_interval_ms'] ?? 6500),
            'prologue' => $prologue,
            'marker' => 'ooh_landing_block_active_file_v3',
          ],
        ],
      ],
      '#cache' => [
        'contexts' => ['url.path'],
      ],
    ];
  }
  /**
   * Fallback slides if manifest loading fails.
   */
  private function getDefaultSlides(): array {
    return [
      [
        'src' => 'video_loops_underboard_alley_core.mp4',
        'href' => '/underboard-alley',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Underboard Alley',
        'scenario' => 'underboard-alley',
      ],
      [
        'src' => 'video_loops_neon_bog_core.mp4',
        'href' => '/neon-bog',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Neon Bog',
        'scenario' => 'neon-bog',
      ],
      [
        'src' => 'video_loops_data_bunker_core.mp4',
        'href' => '/data-bunker',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Data Bunker',
        'scenario' => 'data-bunker',
      ],
      [
        'src' => 'video_loops_fog_marsh_core.mp4',
        'href' => '/fog-marsh',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Fog Marsh',
        'scenario' => 'fog-marsh',
      ],
      [
        'src' => 'video_loops_warlord_enclave_core.mp4',
        'href' => '/warlord-enclave',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Warlord Enclave',
        'scenario' => 'warlord-enclave',
      ],
      [
        'src' => 'video_loops_wasteland_ridge_core.mp4',
        'href' => '/wasteland-ridge',
        'title' => 'AD SILENTIUM',
        'tagline' => 'Wasteland Ridge',
        'scenario' => 'wasteland-ridge',
      ],
    ];
  }

  /**
   * Load hero slides from per-scenario manifest files.
   *
   * Expected path:
   * sites/default/files/adsilentium/manifests/[scenario]/manifest.json
   */
  private function loadSlidesFromManifests(): array {
    $manifest_root = DRUPAL_ROOT . '/sites/default/files/adsilentium/manifests';
    if (!is_dir($manifest_root)) {
      return [];
    }

    $scenario_dirs = glob($manifest_root . '/*', GLOB_ONLYDIR) ?: [];
    sort($scenario_dirs, SORT_NATURAL | SORT_FLAG_CASE);

    $slides = [];

  /**
   * Normalize slide src/href into correct URLs for subdirectory installs.
   */
  private function normalizeSlides(array &$slides): void {
    $file_url_generator = \Drupal::service('file_url_generator');
    $base_path = rtrim(\Drupal::request()->getBasePath(), '/');

    foreach ($slides as &$s) {
      if (!empty($s['href']) && is_string($s['href']) && str_starts_with($s['href'], '/')) {
        $s['href'] = Url::fromUserInput($s['href'])->toString();
      }

      $src = isset($s['src']) ? trim((string) $s['src']) : '';
      if ($src === '') {
        continue;
      }

      if (preg_match('#^https?://#i', $src)) {
        $s['src'] = $src;
        continue;
      }

      $src = str_replace('\\', '/', $src);
      $src_path = parse_url($src, PHP_URL_PATH) ?? $src;
      $src_path = ltrim((string) $src_path, '/');

      $candidates = [];

      if (str_starts_with($src_path, 'adsilentium/loops/')) {
        $relative = substr($src_path, strlen('adsilentium/loops/'));
        $candidates[] = 'public://adsilentium/loops/' . $relative;
      }
      elseif (preg_match('~^sites/default/files/adsilentium/loops/(.+\.mp4)$~i', $src_path, $m)) {
        $candidates[] = 'public://adsilentium/loops/' . $m[1];
      }
      elseif (preg_match('~^sites/default/files/adsilentium/loops/([^/]+\.mp4)$~i', $src_path, $m)) {
        $candidates[] = 'public://adsilentium/loops/' . $m[1];
      }
      else {
        $filename = basename($src_path);
        $scenario = trim((string) ($s['scenario'] ?? ''));

        if ($scenario !== '') {
          $candidates[] = 'public://adsilentium/loops/' . $scenario . '/' . $filename;
        }

        $candidates[] = 'public://adsilentium/loops/' . $filename;
      }

      foreach ($candidates as $uri) {
        if (\Drupal::service('file_system')->realpath($uri)) {
          $url = $file_url_generator->generateString($uri);

          if ($base_path !== '' && str_starts_with($url, '/sites/')) {
            $url = $base_path . $url;
          }

          $s['src'] = $url;
          continue 2;
        }
      }
    }
    unset($s);
  }
    return $slides;
  }

  /**
   * Convert a slug like "warlord-enclave" to "Warlord Enclave".
   */
  private function humanizeScenario(string $scenario): string {
    return ucwords(str_replace('-', ' ', trim($scenario)));
  }
  /**
   * Normalize slide src/href into correct URLs for subdirectory installs.
   */
  private function normalizeSlides(array &$slides): void {
    $file_url_generator = \Drupal::service('file_url_generator');
    $base_path = rtrim(\Drupal::request()->getBasePath(), '/');

    foreach ($slides as &$slide) {
    
      $src = isset($slide['src']) ? trim((string) $slide['src']) : '';
      if ($src === '') {
        continue;
      }

      if (preg_match('#^https?://#i', $src)) {
        $slide['src'] = $src;
        continue;
      }

      if (preg_match('~/?sites/default/files/outskirts/loops/([^/?#]+\.mp4)(?:[?#].*)?$~i', $src, $matches)) {
        $src = $matches[1];
      }

      $src_path = parse_url($src, PHP_URL_PATH) ?? $src;
      $filename = basename(str_replace('\\', '/', (string) $src_path));

      $uri = 'public://outskirts/loops/' . $filename;
      $url = $file_url_generator->generateString($uri);

      if ($base_path !== '' && str_starts_with($url, '/sites/')) {
        $url = $base_path . $url;
      }

      $slide['src'] = $url;
    }
    
    unset($slide);
  }

  /**
   * Minimal markup for hero + prologue shell.
   */
  private function renderMarkup(array $slides): string {
    $first = $slides[0] ?? [];
    $first_title = htmlspecialchars((string) ($first['title'] ?? 'AD SILENTIUM'), ENT_QUOTES, 'UTF-8');
    $first_tagline = htmlspecialchars((string) ($first['tagline'] ?? ''), ENT_QUOTES, 'UTF-8');
    $first_src = htmlspecialchars((string) ($first['src'] ?? ''), ENT_QUOTES, 'UTF-8');
    $login_href = htmlspecialchars(Url::fromRoute('user.login')->toString(), ENT_QUOTES, 'UTF-8');
    $audio_src = htmlspecialchars(\Drupal::service('extension.list.module')->getPath('ooh_outskirts') . '/audio/wind-ambient.mp3', ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!-- ooh_landing_block_active_file_v3 -->
<section class="ooh-hero" data-ooh-hero>
  <audio id="ooh-ambient-wind" preload="auto" loop playsinline>
    <source src="/{$audio_src}" type="audio/mpeg">
  </audio>

  <div class="ooh-login-wrap">
    <a href="{$login_href}" class="ooh-login-btn">LOGIN</a>
  </div>

  <div class="ooh-hero__media" aria-hidden="true">
    <video class="ooh-hero__video is-active" data-ooh-video="A" muted loop playsinline autoplay preload="metadata" src="{$first_src}"></video>
    <video class="ooh-hero__video" data-ooh-video="B" muted loop playsinline autoplay preload="metadata"></video>
    <div class="ooh-hero__fx" aria-hidden="true"></div>
  </div>

  <div class="ooh-hero__hud">
    <div class="ooh-hero__kicker">PROLOGUE</div>
      <div class="ooh-hero__kicker">OUTSKIRTS OF HELL GAMES</div>
      <h1 class="ooh-hero__title ooh-game-title" data-ooh-title>{$first_title}</h1>
      <p class="ooh-hero__tagline" data-ooh-tagline>{$first_tagline}</p>
    </div>

    <div class="ooh-hero__controls" role="group" aria-label="Landing controls">
      <a class="ooh-btn ooh-btn--enter" href="#" data-ooh-cta>Enter</a>
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-open>Read Prologue</button>
    </div>

    <div class="ooh-hero__dots" data-ooh-dots aria-label="Background selection"></div>
  </div>
</section>

<section class="ooh-prologue" data-ooh-prologue hidden>
  <div class="ooh-prologue__backdrop" data-ooh-prologue-close></div>

  <div class="ooh-prologue__panel" data-ooh-prologue-panel role="dialog" aria-modal="true" aria-label="Prologue" tabindex="-1">
    <div class="ooh-prologue__top">
      <div>
        <div class="ooh-prologue__kicker" data-ooh-prologue-kicker></div>
        <h2 class="ooh-prologue__title" data-ooh-prologue-title></h2>
      </div>
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-close-btn aria-label="Close prologue">×</button>
    </div>

    <div class="ooh-prologue__viewport" data-ooh-prologue-viewport>
      <div class="ooh-prologue__crawl" data-ooh-prologue-body></div>
    </div>

    <div class="ooh-prologue__actions">
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-skip>Skip</button>

      <div class="ooh-prologue__actions-right">
        <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-replay>Replay</button>
        <button class="ooh-btn" type="button" data-ooh-prologue-enter>Enter</button>
      </div>
    </div>
  </div>
</section>
HTML;
  }

}