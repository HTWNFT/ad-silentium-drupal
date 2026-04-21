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
      'prologue_kicker' => 'Prologue',
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
      'enter_path' => '/data-bunker',
      'audio_enabled' => TRUE,
      'audio_file' => 'wind-ambient.mp3',
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
      '#default_value' => (string) ($this->configuration['prologue_kicker'] ?? 'Prologue'),
    ];

    $form['ooh_prologue']['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title'),
      '#default_value' => (string) ($this->configuration['prologue_title'] ?? 'Ad Silentium'),
    ];

    $form['ooh_prologue']['text'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Prologue text'),
      '#description' => $this->t('Use one blank line between paragraphs.'),
      '#default_value' => (string) ($this->configuration['prologue_text'] ?? ''),
      '#rows' => 14,
    ];

    $form['ooh_hero'] = [
      '#type' => 'details',
      '#title' => $this->t('OOH Hero'),
      '#open' => TRUE,
      '#tree' => TRUE,
    ];

    $form['ooh_hero']['hero_interval_ms'] = [
      '#type' => 'number',
      '#title' => $this->t('Carousel interval (ms)'),
      '#min' => 1500,
      '#step' => 100,
      '#default_value' => (int) ($this->configuration['hero_interval_ms'] ?? 6500),
    ];

    $form['ooh_hero']['enter_path'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Enter button path'),
      '#description' => $this->t('Example: /data-bunker'),
      '#default_value' => (string) ($this->configuration['enter_path'] ?? '/data-bunker'),
    ];

    $form['ooh_hero']['audio_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable ambient audio'),
      '#default_value' => (bool) ($this->configuration['audio_enabled'] ?? TRUE),
    ];

    $form['ooh_hero']['audio_file'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Ambient audio filename'),
      '#description' => $this->t('File in modules/custom/ooh_outskirts/audio/. Example: wind-ambient.mp3'),
      '#default_value' => (string) ($this->configuration['audio_file'] ?? 'wind-ambient.mp3'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    parent::blockSubmit($form, $form_state);

    $prologue_values = (array) $form_state->getValue('ooh_prologue');
    $hero_values = (array) $form_state->getValue('ooh_hero');

    $this->configuration['prologue_enabled'] = (bool) ($prologue_values['enabled'] ?? TRUE);
    $this->configuration['prologue_auto_open'] = (bool) ($prologue_values['auto_open'] ?? TRUE);
    $this->configuration['prologue_auto_delay_ms'] = (int) ($prologue_values['auto_delay_ms'] ?? 2600);
    $this->configuration['prologue_kicker'] = (string) ($prologue_values['kicker'] ?? 'Prologue');
    $this->configuration['prologue_title'] = (string) ($prologue_values['title'] ?? 'Ad Silentium');
    $this->configuration['prologue_text'] = (string) ($prologue_values['text'] ?? '');

    $this->configuration['hero_interval_ms'] = (int) ($hero_values['hero_interval_ms'] ?? 6500);
    $this->configuration['enter_path'] = (string) ($hero_values['enter_path'] ?? '/data-bunker');
    $this->configuration['audio_enabled'] = (bool) ($hero_values['audio_enabled'] ?? TRUE);
    $this->configuration['audio_file'] = (string) ($hero_values['audio_file'] ?? 'wind-ambient.mp3');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $config = $this->configuration + $this->defaultConfiguration();

    $slides = $this->loadSlidesFromFilesystem();
    $this->normalizeSlides($slides);

    if (empty($slides)) {
      return [
        '#markup' => Markup::create('<div class="ooh-landing-fallback">No hero slides available.</div>'),
        '#cache' => [
          'max-age' => 0,
        ],
      ];
    }

    $prologue_text = trim((string) ($config['prologue_text'] ?? ''));
    $paragraphs = $prologue_text !== ''
      ? preg_split("/\\R{2,}/", $prologue_text) ?: []
      : [];

    $paragraphs = array_values(array_filter(
      array_map('trim', $paragraphs),
      static fn (string $item): bool => $item !== ''
    ));

    return [
      '#markup' => Markup::create($this->renderMarkup($slides, $config)),
      '#attached' => [
        'library' => [
          'ooh_outskirts/landing',
        ],
        'drupalSettings' => [
          'ooh_outskirts' => [
            'heroSlides' => array_values($slides),
            'heroIntervalMs' => (int) ($config['hero_interval_ms'] ?? 6500),
            'prologue' => [
              'enabled' => (bool) ($config['prologue_enabled'] ?? TRUE),
              'autoOpen' => (bool) ($config['prologue_auto_open'] ?? TRUE),
              'autoDelayMs' => (int) ($config['prologue_auto_delay_ms'] ?? 2600),
              'kicker' => (string) ($config['prologue_kicker'] ?? 'Prologue'),
              'title' => (string) ($config['prologue_title'] ?? 'Ad Silentium'),
              'paragraphs' => $paragraphs,
              'storageKey' => 'ooh_prologue_seen_v4',
            ],
            'audio' => [
              'enabled' => (bool) ($config['audio_enabled'] ?? TRUE),
            ],
            'marker' => 'ooh_landing_block_active_file_v4',
          ],
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Loads hero slides recursively from the Drupal public files directory.
   */
  private function loadSlidesFromFilesystem(): array {
    $roots = [
      'public://adsilentium/loops',
      'public://outskirts/loops',
    ];

    $file_system = \Drupal::service('file_system');
    $slides = [];

    foreach ($roots as $root_uri) {
      $root_real = $file_system->realpath($root_uri);

      if (!$root_real || !is_dir($root_real)) {
        continue;
      }

      $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($root_real, \FilesystemIterator::SKIP_DOTS)
      );

      $files = [];
      foreach ($iterator as $fileinfo) {
        if ($fileinfo->isFile() && strtolower($fileinfo->getExtension()) === 'mp4') {
          $files[] = $fileinfo->getPathname();
        }
      }

      if (empty($files)) {
        continue;
      }

      sort($files, SORT_NATURAL | SORT_FLAG_CASE);

      foreach ($files as $fullpath) {
        $filename = basename($fullpath);
        $relative_dir = str_replace('\\', '/', substr(dirname($fullpath), strlen($root_real)));
        $relative_dir = trim($relative_dir, '/');
        $scenario = $relative_dir !== '' ? basename($relative_dir) : '';

        $src = $relative_dir !== ''
          ? str_replace('public://', '', $root_uri) . '/' . $relative_dir . '/' . $filename
          : str_replace('public://', '', $root_uri) . '/' . $filename;

        $slides[] = [
          'src' => $src,
          'href' => (string) ($this->configuration['enter_path'] ?? '/data-bunker'),
          'title' => 'AD SILENTIUM',
          'tagline' => '',
          'scenario' => $scenario,
        ];
      }

      if (!empty($slides)) {
        break;
      }
    }

    return $slides;
  }

  /**
   * Normalize slide src/href into valid URLs for subdirectory installs.
   */
  private function normalizeSlides(array &$slides): void {
    $file_system = \Drupal::service('file_system');
    $file_url_generator = \Drupal::service('file_url_generator');
    $base_path = rtrim(\Drupal::request()->getBasePath(), '/');

    foreach ($slides as &$slide) {
      if (!empty($slide['href']) && is_string($slide['href']) && str_starts_with($slide['href'], '/')) {
        $slide['href'] = Url::fromUserInput($slide['href'])->toString();
      }

      $src = isset($slide['src']) ? trim((string) $slide['src']) : '';
      if ($src === '') {
        continue;
      }

      if (preg_match('#^https?://#i', $src)) {
        $slide['src'] = $src;
        continue;
      }

      $src = str_replace('\\', '/', $src);
      $src_path = parse_url($src, PHP_URL_PATH) ?? $src;
      $src_path = ltrim((string) $src_path, '/');
      $filename = basename($src_path);
      $scenario = trim((string) ($slide['scenario'] ?? ''));

      $candidates = [];

      if (str_starts_with($src_path, 'adsilentium/loops/')) {
        $relative = substr($src_path, strlen('adsilentium/loops/'));
        $candidates[] = 'public://adsilentium/loops/' . $relative;
      }
      elseif (str_starts_with($src_path, 'outskirts/loops/')) {
        $relative = substr($src_path, strlen('outskirts/loops/'));
        $candidates[] = 'public://outskirts/loops/' . $relative;
      }
      elseif (preg_match('~^sites/default/files/adsilentium/loops/(.+\.mp4)$~i', $src_path, $m)) {
        $candidates[] = 'public://adsilentium/loops/' . $m[1];
      }
      elseif (preg_match('~^sites/default/files/outskirts/loops/(.+\.mp4)$~i', $src_path, $m)) {
        $candidates[] = 'public://outskirts/loops/' . $m[1];
      }
      else {
        if ($scenario !== '') {
          $candidates[] = 'public://adsilentium/loops/' . $scenario . '/' . $filename;
          $candidates[] = 'public://outskirts/loops/' . $scenario . '/' . $filename;
        }

        $candidates[] = 'public://adsilentium/loops/' . $filename;
        $candidates[] = 'public://outskirts/loops/' . $filename;
      }

      foreach ($candidates as $uri) {
        if ($file_system->realpath($uri)) {
          $url = $file_url_generator->generateString($uri);

          if ($base_path !== '' && str_starts_with($url, '/sites/')) {
            $url = $base_path . $url;
          }

          $slide['src'] = $url;
          continue 2;
        }
      }
    }

    unset($slide);
  }

  /**
   * Render hero + prologue shell.
   */
  private function renderMarkup(array $slides, array $config): string {
    $first = $slides[0] ?? [];

    $first_src = htmlspecialchars((string) ($first['src'] ?? ''), ENT_QUOTES, 'UTF-8');
    $first_title = htmlspecialchars((string) ($first['title'] ?? 'AD SILENTIUM'), ENT_QUOTES, 'UTF-8');
    $first_tagline = htmlspecialchars((string) ($first['tagline'] ?? ''), ENT_QUOTES, 'UTF-8');
    $login_href = htmlspecialchars(Url::fromRoute('user.login')->toString(), ENT_QUOTES, 'UTF-8');
    $enter_href = htmlspecialchars(
      Url::fromUserInput((string) ($config['enter_path'] ?? '/data-bunker'))->toString(),
      ENT_QUOTES,
      'UTF-8'
    );

    $audio_enabled = (bool) ($config['audio_enabled'] ?? TRUE);
    $audio_filename = trim((string) ($config['audio_file'] ?? 'wind-ambient.mp3'));
    $audio_src = '';

    if ($audio_enabled && $audio_filename !== '') {
      $audio_src = htmlspecialchars(
        \Drupal::request()->getBasePath() . '/' .
        \Drupal::service('extension.list.module')->getPath('ooh_outskirts') .
        '/audio/' . rawurlencode($audio_filename),
        ENT_QUOTES,
        'UTF-8'
      );
    }

    $audio_markup = $audio_src !== ''
      ? '<audio id="ooh-ambient-wind" preload="auto" loop playsinline><source src="' . $audio_src . '" type="audio/mpeg"></audio>'
      : '';

    return <<<HTML
<!-- ooh_landing_block_active_file_v4 -->
<section class="ooh-hero ooh-overlay-root" data-ooh-hero>
  {$audio_markup}

  <div class="ooh-login-wrap">
    <button class="ooh-login-btn" id="ooh-mute-toggle" type="button" aria-pressed="false">
      🔊 Sound
    </button>
    <a href="{$login_href}" class="ooh-login-btn">Login</a>
  </div>

  <div class="ooh-hero__media" aria-hidden="true">
    <video class="ooh-hero__video is-active" data-ooh-video="A" muted loop playsinline autoplay preload="metadata" src="{$first_src}"></video>
    <video class="ooh-hero__video" data-ooh-video="B" muted loop playsinline autoplay preload="metadata"></video>
    <div class="ooh-hero__fx" aria-hidden="true"></div>
  </div>

  <div class="ooh-hero__hud">
    <h1 class="ooh-hero__title ooh-game-title" data-ooh-title>{$first_title}</h1>
    <p class="ooh-hero__tagline" data-ooh-tagline>{$first_tagline}</p>

    <div class="ooh-hero__controls" role="group" aria-label="Landing controls">
      <a class="ooh-btn ooh-btn--enter" href="{$enter_href}" data-ooh-cta data-ooh-action="enter">ENTER</a>
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-open data-ooh-action="prologue">READ PROLOGUE</button>
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
        <a class="ooh-btn" href="{$enter_href}" data-ooh-prologue-enter>Enter</a>
      </div>
    </div>
  </div>
</section>
HTML;
  }

}