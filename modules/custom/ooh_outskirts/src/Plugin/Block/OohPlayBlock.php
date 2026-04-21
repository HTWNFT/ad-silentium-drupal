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
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'title' => 'Stage 2 // Signal Alignment',
      'subtitle' => 'Classify the player before assembly.',
      'require_login' => TRUE,
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
    <h2 class="ooh-title">Access Required</h2>
    <p class="ooh-subtitle">Sign in before entering the Stage 2 assembly flow.</p>
    <div class="ooh-row">
      <a class="ooh-btn" href="' . htmlspecialchars($login_url, ENT_QUOTES, 'UTF-8') . '">Log in</a>
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

    $title = htmlspecialchars((string) ($config['title'] ?? 'Stage 2 // Signal Alignment'), ENT_QUOTES, 'UTF-8');
    $subtitle = nl2br(htmlspecialchars((string) ($config['subtitle'] ?? ''), ENT_QUOTES, 'UTF-8'));
    $playlist_options = htmlspecialchars((string) ($config['playlist_options'] ?? ''), ENT_QUOTES, 'UTF-8');
    $recruiter_options = htmlspecialchars((string) ($config['recruiter_options'] ?? ''), ENT_QUOTES, 'UTF-8');
    $mission_options = htmlspecialchars((string) ($config['mission_options'] ?? ''), ENT_QUOTES, 'UTF-8');
    $seed = htmlspecialchars((string) (\Drupal::request()->query->get('seed') ?? ''), ENT_QUOTES, 'UTF-8');

    $markup = <<<HTML
<section
  class="ooh-shell ooh-stage2"
  data-ooh-play
  data-seed="{$seed}"
  data-playlist-options="{$playlist_options}"
  data-recruiter-options="{$recruiter_options}"
  data-mission-options="{$mission_options}"
>
  <div class="ooh-card">
    <div class="ooh-stage2__eyebrow">OUTSKIRTS OF HELL // STAGE 2</div>
    <h2 class="ooh-title">{$title}</h2>
    <p class="ooh-subtitle">{$subtitle}</p>

    <div class="ooh-stage2__seedrow">
      <span class="ooh-muted">Seed:</span>
      <code class="ooh-stage2__seed" data-ooh-seed-display>{$seed}</code>
    </div>

    <div class="ooh-stage2__grid">
      <section class="ooh-stage2__panel">
        <div class="ooh-stage2__stepnum">1</div>
        <h3 class="ooh-stage2__heading">Select a Playlist</h3>
        <p class="ooh-muted">Choose the audio identity for the run.</p>
        <div class="ooh-stage2__choices" data-ooh-choice-group="playlist"></div>
      </section>

      <section class="ooh-stage2__panel">
        <div class="ooh-stage2__stepnum">2</div>
        <h3 class="ooh-stage2__heading">Choose a Recruiter</h3>
        <p class="ooh-muted">Merged or Doomed determines the build tone.</p>
        <div class="ooh-stage2__choices" data-ooh-choice-group="recruiter"></div>
      </section>

      <section class="ooh-stage2__panel">
        <div class="ooh-stage2__stepnum">3</div>
        <h3 class="ooh-stage2__heading">Select a Mission Type</h3>
        <p class="ooh-muted">Pick the first operation profile.</p>
        <div class="ooh-stage2__choices" data-ooh-choice-group="mission"></div>
      </section>

      <section class="ooh-stage2__panel ooh-stage2__panel--summary">
        <div class="ooh-stage2__stepnum">4</div>
        <h3 class="ooh-stage2__heading">Enter</h3>
        <p class="ooh-muted">Assemble the session from the selected identity.</p>

        <div class="ooh-stage2__summary" data-ooh-summary>
          <div><strong>Playlist:</strong> <span data-ooh-summary-playlist>Unselected</span></div>
          <div><strong>Recruiter:</strong> <span data-ooh-summary-recruiter>Unselected</span></div>
          <div><strong>Mission:</strong> <span data-ooh-summary-mission>Unselected</span></div>
        </div>

        <div class="ooh-row">
          <button class="ooh-btn" type="button" data-ooh-assemble>Assemble Run</button>
          <button class="ooh-btn ooh-btn--ghost" type="button" data-ooh-reset>Reset</button>
        </div>

        <div class="ooh-stage2__assembled" data-ooh-assembled hidden>
          <h4 class="ooh-stage2__assembled-title">Session Armed</h4>
          <pre class="ooh-pre" data-ooh-assembled-output></pre>
        </div>
      </section>
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
      ],
      '#cache' => [
        'contexts' => ['url.query_args:seed', 'user.roles:authenticated'],
        'max-age' => 0,
      ],
    ];
  }

}