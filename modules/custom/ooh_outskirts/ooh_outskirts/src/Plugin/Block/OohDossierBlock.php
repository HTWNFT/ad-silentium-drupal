<?php

declare(strict_types=1);

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;

/**
 * Provides the OOH Dossier Block.
 *
 * @Block(
 *   id = "ooh_dossier_block",
 *   admin_label = @Translation("OOH Dossier Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
final class OohDossierBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'play_path' => '/play',
      'default_seed' => '',
      'title' => 'Recruiter Dossier',
      'subtitle' => 'Generate your first seeded identity before entering the play layer.',
      'require_login' => TRUE,
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
      '#default_value' => (string) ($this->configuration['title'] ?? 'Recruiter Dossier'),
    ];

    $form['subtitle'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Subtitle'),
      '#rows' => 3,
      '#default_value' => (string) ($this->configuration['subtitle'] ?? 'Generate your first seeded identity before entering the play layer.'),
    ];

    $form['play_path'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Play path'),
      '#description' => $this->t('Example: /play'),
      '#default_value' => (string) ($this->configuration['play_path'] ?? '/play'),
    ];

    $form['default_seed'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Default seed'),
      '#description' => $this->t('Optional fallback seed if none is present in the URL.'),
      '#default_value' => (string) ($this->configuration['default_seed'] ?? ''),
    ];

    $form['require_login'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Require login to view dossier block'),
      '#default_value' => (bool) ($this->configuration['require_login'] ?? TRUE),
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
    $this->configuration['play_path'] = (string) $form_state->getValue('play_path');
    $this->configuration['default_seed'] = (string) $form_state->getValue('default_seed');
    $this->configuration['require_login'] = (bool) $form_state->getValue('require_login');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $config = $this->configuration + $this->defaultConfiguration();
    $current_user = \Drupal::currentUser();

    if (!empty($config['require_login']) && !$current_user->isAuthenticated()) {
      $login_url = Url::fromRoute('user.login', [], [
        'query' => ['destination' => '/dossier'],
      ])->toString();

      $register_url = Url::fromRoute('user.register', [], [
        'query' => ['destination' => '/dossier'],
      ])->toString();

      $markup = '
<section class="ooh-shell">
  <div class="ooh-card">
    <h2 class="ooh-title">Access Required</h2>
    <p class="ooh-subtitle">Create an account or sign in to generate your dossier.</p>
    <div class="ooh-row">
      <a class="ooh-btn" href="' . htmlspecialchars($login_url, ENT_QUOTES, 'UTF-8') . '">Log in</a>
      <a class="ooh-btn" href="' . htmlspecialchars($register_url, ENT_QUOTES, 'UTF-8') . '">Create account</a>
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

    $title = htmlspecialchars((string) ($config['title'] ?? 'Recruiter Dossier'), ENT_QUOTES, 'UTF-8');
    $subtitle = nl2br(htmlspecialchars((string) ($config['subtitle'] ?? ''), ENT_QUOTES, 'UTF-8'));
    $play_path = htmlspecialchars(
      Url::fromUserInput((string) ($config['play_path'] ?? '/play'))->toString(),
      ENT_QUOTES,
      'UTF-8'
    );
    $default_seed = htmlspecialchars((string) ($config['default_seed'] ?? ''), ENT_QUOTES, 'UTF-8');

    $markup = <<<HTML
<section class="ooh-shell" data-ooh-dossier data-play-path="{$play_path}" data-default-seed="{$default_seed}">
  <div class="ooh-card">
    <h2 class="ooh-title">{$title}</h2>
    <p class="ooh-subtitle">{$subtitle}</p>

    <div class="ooh-row">
      <input class="ooh-input ooh-seed-input" type="text" placeholder="Enter seed phrase" aria-label="Seed phrase" />
      <button class="ooh-btn ooh-generate" type="button">Generate</button>
      <button class="ooh-btn ooh-copy" type="button">Copy</button>
      <a class="ooh-btn ooh-play-link" href="{$play_path}">Enter Play</a>
    </div>

    <pre class="ooh-pre ooh-output" aria-live="polite"></pre>

    <div class="ooh-row">
      <span class="ooh-muted">Permalink:</span>
      <code class="ooh-muted ooh-permalink"></code>
    </div>
  </div>
</section>
HTML;

    return [
      '#markup' => Markup::create($markup),
      '#attached' => [
        'library' => [
          'ooh_outskirts/dossier',
        ],
      ],
      '#cache' => [
        'contexts' => ['url.query_args:seed', 'user.roles:authenticated'],
        'max-age' => 0,
      ],
    ];
  }

}