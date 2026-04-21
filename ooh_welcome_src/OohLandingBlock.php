<?php

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;

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
  public function defaultConfiguration() {
    return [
      'prologue_enabled' => TRUE,
      'prologue_auto_open' => TRUE,
      'prologue_auto_delay_ms' => 2600,
      'prologue_kicker' => 'Outskirts of Hell',
      'prologue_title' => 'Ad Silentium',
      'prologue_text' => '',
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
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
      '#title' => $this->t('Auto-open on first visit'),
      '#default_value' => (bool) ($this->configuration['prologue_auto_open'] ?? TRUE),
      '#states' => [
        'visible' => [
          ':input[name="settings[ooh_prologue][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['ooh_prologue']['auto_delay_ms'] = [
      '#type' => 'number',
      '#title' => $this->t('Auto-open delay (ms)'),
      '#default_value' => (int) ($this->configuration['prologue_auto_delay_ms'] ?? 2600),
      '#min' => 0,
      '#step' => 100,
      '#states' => [
        'visible' => [
          ':input[name="settings[ooh_prologue][enabled]"]' => ['checked' => TRUE],
          ':input[name="settings[ooh_prologue][auto_open]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['ooh_prologue']['kicker'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Kicker'),
      '#default_value' => (string) ($this->configuration['prologue_kicker'] ?? 'Outskirts of Hell'),
      '#states' => [
        'visible' => [
          ':input[name="settings[ooh_prologue][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['ooh_prologue']['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title'),
      '#default_value' => (string) ($this->configuration['prologue_title'] ?? 'Ad Silentium'),
      '#states' => [
        'visible' => [
          ':input[name="settings[ooh_prologue][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['ooh_prologue']['text'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Prologue text'),
      '#description' => $this->t('Use blank lines to separate paragraphs.'),
      '#default_value' => (string) ($this->configuration['prologue_text'] ?? ''),
      '#rows' => 16,
      '#states' => [
        'visible' => [
          ':input[name="settings[ooh_prologue][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    parent::blockSubmit($form, $form_state);

    $vals = (array) $form_state->getValue('ooh_prologue');

    $this->configuration['prologue_enabled'] = !empty($vals['enabled']);
    $this->configuration['prologue_auto_open'] = !empty($vals['auto_open']);
    $this->configuration['prologue_auto_delay_ms'] = (int) ($vals['auto_delay_ms'] ?? 2600);
    $this->configuration['prologue_kicker'] = (string) ($vals['kicker'] ?? 'Outskirts of Hell');
    $this->configuration['prologue_title'] = (string) ($vals['title'] ?? 'Ad Silentium');
    $this->configuration['prologue_text'] = (string) ($vals['text'] ?? '');
  }

  /**
   * {@inheritdoc}
   */
    public function build() {

  
    $slides = [
      [
        'title' => 'Underboard Alley',
        'tagline' => 'Quiet access routes beneath the warline.',
        'src' => 'video_loops_underboard_alley_core.mp4',
        'href' => '/underboard-alley',
      ],
      [
        'title' => 'Neon Bog',
        'tagline' => 'Signal haze. Bad visibility. Movement everywhere.',
        'src' => 'video_loops_neon_bog_core.mp4',
        'href' => '/neon-bog',
      ],
      [
        'title' => 'Data Bunker',
        'tagline' => 'Cold corridors. Buried systems. Controlled glow.',
        'src' => 'video_loops_data_bunker_core.mp4',
        'href' => '/data-bunker',
      ],
      [
        'title' => 'Neon Fog Marsh',
        'tagline' => 'Low light. Wet ground. Drift in the air.',
        'src' => 'video_loops_neon_fog_marsh_core.mp4',
        'href' => '/neon-fog-marsh',
      ],
      [
        'title' => 'Neon Fog Marsh',
        'tagline' => 'Low light. Wet ground. Drift in the air.',
        'src' => 'video_loops_neon_fog_marsh_core.mp4',
        'href' => '/neon-fog-marsh',
      ],
     ];
     // --- Fix slide video URLs so they work under /STIKWALLET11202025/... ---
$file_url = \Drupal::service('file_url_generator');

foreach ($slides as &$s) {
  $src = (string) ($s['src'] ?? '');  
  if (empty($s['src'])) {
    continue;
  }
  unset($s);
  $src = $s['src'];

  // Case 1: hardcoded broken path like /sites/default/files/outskirts/loops/FILE.mp4
  if (preg_match('#^/sites/default/files/outskirts/loops/(.+)$#', $src, $m)) {
    $s['src'] = $file_url->generateString('public://outskirts/loops/' . $m[1]);
    continue;
  }

  // Case 2: just a filename like video_loops_x.mp4
  if (strpos($src, '/') === false) {
    $s['src'] = $file_url->generateString('public://outskirts/loops/' . $src);
    continue;
  }

  // Case 3: already public://...
  if (strpos($src, 'public://') === 0) {
    $s['src'] = $file_url->generateString($src);
    continue;
  }

  // Otherwise leave it alone.
}
unset($s);
// --- end URL fix ---




    // 2) Prologue paragraphs from block config textarea (blank line = new paragraph).
    $raw = trim((string) ($this->configuration['prologue_text'] ?? ''));
    $paragraphs = $raw ? preg_split("/\R\R+/", $raw) : [];

    $prologue = [
      'enabled' => (bool) ($this->configuration['prologue_enabled'] ?? TRUE),
      'storageKey' => 'ooh_prologue_seen',
      'autoOpen' => (bool) ($this->configuration['prologue_auto_open'] ?? TRUE),
      'autoDelayMs' => (int) ($this->configuration['prologue_auto_delay_ms'] ?? 2600),
      'kicker' => (string) ($this->configuration['prologue_kicker'] ?? 'Outskirts of Hell'),
      'title' => (string) ($this->configuration['prologue_title'] ?? 'Ad Silentium'),
      'paragraphs' => $paragraphs,
    ];

    // 3) Markup: hero carousel + prologue overlay.
    $markup = '
<section class="ooh-hero" data-ooh-hero>
  <div class="ooh-hero__media" aria-hidden="true">
    <video class="ooh-hero__video is-active" data-ooh-video="A" muted autoplay loop playsinline preload="metadata"></video>
    <video class="ooh-hero__video" data-ooh-video="B" muted autoplay loop playsinline preload="metadata"></video>
  </div>

  <div class="ooh-hero__overlay">
    <div class="ooh-hero__copy">
      <div class="ooh-hero__kicker">OUTSKIRTS OF HELL</div>
      <h1 class="ooh-hero__title" data-ooh-title></h1>
      <p class="ooh-hero__tagline" data-ooh-tagline></p>

      <div class="ooh-hero__controls">
        <a class="ooh-btn" href="#" data-ooh-cta>Enter</a>
        <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-pause>Pause</button>
        <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-open>Read Prologue</button>
      </div>

      <div class="ooh-hero__dots" data-ooh-dots></div>
    </div>
  </div>
</section>

<section class="ooh-prologue" data-ooh-prologue hidden>
  <div class="ooh-prologue__backdrop" data-ooh-prologue-close></div>

  <div class="ooh-prologue__panel" role="dialog" aria-modal="true" aria-label="Prologue">
    <div class="ooh-prologue__top">
      <div class="ooh-prologue__kicker" data-ooh-prologue-kicker></div>
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-skip>Skip</button>
    </div>

    <h2 class="ooh-prologue__title" data-ooh-prologue-title></h2>

    <div class="ooh-prologue__body" data-ooh-prologue-body></div>

    <div class="ooh-prologue__actions">
      <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-prologue-close-btn>Close</button>
      <button class="ooh-btn" type="button" data-ooh-prologue-enter>Enter</button>
    </div>
  </div>
</section>
';

    return [
      '#type' => 'markup',
      '#markup' => Markup::create($markup),
      '#attached' => [
        'library' => [
          'ooh_outskirts/hero_carousel',
        ],
        'drupalSettings' => [
          'ooh_outskirts' => [
            'heroSlides' => $slides,
            'heroIntervalMs' => 6500,
            'prologue' => $prologue,
          ],
        ],
      ],
      // Dev-friendly while you iterate.
      '#cache' => [
        'max-age' => 0,
      ],
      return [
  '#theme' => 'ooh_landing_block', // keep your existing theme hook if different
  '#attached' => [
    'drupalSettings' => [
      'ooh_outskirts' => [
        'slides' => $slides,
      ],
    ],
  ],
];

    ];
  }

}
