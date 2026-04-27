<?php

namespace Drupal\ooh_outskirts\Plugin\Block;

use Drupal\Component\Utility\Html;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Url;

/**
 * Provides the Outskirts of Hell landing page block.
 *
 * @Block(
 *   id = "ooh_landing_block",
 *   admin_label = @Translation("OOH Landing Block"),
 *   category = @Translation("Outskirts of Hell")
 * )
 */
class OohLandingBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    $base_path = rtrim(\Drupal::request()->getBasePath(), '/');
    $dossier_url = Html::escape(Url::fromUserInput('/dossier')->toString());
    $clearance_url = Html::escape(Url::fromRoute('ooh_outskirts.clearance')->toString());
    $loops_dir = DRUPAL_ROOT . '/sites/default/files/adsilentium/loops';
    $loops_web_path = $base_path . '/sites/default/files/adsilentium/loops';

    $loop_files = [];

    if (is_dir($loops_dir) && is_readable($loops_dir)) {
      $entries = scandir($loops_dir) ?: [];

      foreach ($entries as $entry) {
        $full_path = $loops_dir . DIRECTORY_SEPARATOR . $entry;

        if (
          $entry !== '.' &&
          $entry !== '..' &&
          is_file($full_path) &&
          preg_match('/\.mp4$/i', $entry)
        ) {
          $loop_files[] = $entry;
        }
      }
    }

    if (!empty($loop_files)) {
      shuffle($loop_files);
    }

    $slides_markup = '';

    if (!empty($loop_files)) {
      foreach ($loop_files as $index => $file_name) {
        $is_active = $index === 0 ? ' is-active' : '';
        $aria_hidden = $index === 0 ? 'false' : 'true';
        $file_url = $loops_web_path . '/' . rawurlencode($file_name);
        $file_url_escaped = Html::escape($file_url);

        $slides_markup .= <<<HTML
    <div class="ooh-hero__slide ooh-hero__slide--video{$is_active}" aria-hidden="{$aria_hidden}">
      <video class="ooh-hero__loop-video" autoplay muted loop playsinline preload="auto">
        <source src="{$file_url_escaped}" type="video/mp4">
      </video>
    </div>

HTML;
      }
    }
    else {
      $slides_markup = <<<HTML
    <div class="ooh-hero__slide ooh-hero__slide--fallback is-active" aria-hidden="false">
      <div class="ooh-hero__fallback-message">
        NO LOOP ASSETS FOUND IN /sites/default/files/adsilentium/loops
      </div>
    </div>

HTML;
    }

    $template = <<<HTML
<section class="ooh-hero ooh-hero-carousel ooh-hero--random-loops ooh-hero--cinematic" id="ooh-hero" data-ooh-hero>

  <div class="ooh-hero__carousel">
{$slides_markup}  </div>

  <div class="ooh-hero__overlay"></div>

  <div class="ooh-hero__inner">
    <p class="ooh-hero__eyebrow">CLASSIFIED // AD SILENTIUM</p>

    <h1 class="ooh-hero__title ooh-game-title">AD SILENTIUM</h1>

    <p class="ooh-hero__subtitle">
      Enter the dead zone. Build your path. Select your signal.
    </p>

    <div class="ooh-hero__actions">
      <a class="ooh-hero__button ooh-hero__button--primary" href="{$dossier_url}">
        ENTER
      </a>

      <a class="ooh-hero__button ooh-hero__button--secondary" href="{$clearance_url}">
        CLEARANCE
      </a>
    </div>

    <div class="ooh-hero__dots" aria-label="Hero slide navigation"></div>
  </div>

</section>

<section class="ooh-prologue-modal" id="ooh-prologue-modal" aria-hidden="true">
  <div class="ooh-prologue-modal__backdrop" data-close="1"></div>

  <div class="ooh-prologue-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ooh-prologue-title">
    <button class="ooh-prologue-modal__close" type="button" id="ooh-close-prologue" aria-label="Close">
      CLOSE
    </button>

    <p class="ooh-prologue__eyebrow">TRANSMISSION // PROLOGUE</p>
    <h2 class="ooh-prologue__title" id="ooh-prologue-title">Ad Silentium</h2>

    <div class="ooh-prologue__viewport">
      <div class="ooh-prologue__crawl" id="ooh-prologue-crawl">
        <p>
          In a long-distant, incalculable number of years from now, the universe will stop expanding, becoming full of matter like oxygen in an air-filled lung. Reality's "waste matter" will be filtered out at this stage, while beneficial matter remains. This "matter" will be the living; some can stay, others must leave.
        </p>
        <p>
          "Ad Silentium" is the time when what is deemed harmful will exit and what is deemed worthy will coexist, a stillness replicated in the silent pause between breaths.
        </p>
        <p>
          The scourge of the new reality is the Genetic Warlord Class. They are the long-descended remnants of the once-Transhumanist Elite class, fused with the Reptilian masters whom they once served in secret. Many thousands of years before Ad Silentium, they denied recognition of powers beyond themselves. Hence, the very force they denied tapped them to leave mortality. Summoning Reptilians from the bowels of the planet, they fused with them in an attempt to survive. Eons later, the plan has failed. The families of these elites are dwindling in number and fighting their inevitable expulsion from the universe as waste matter. However, many existing clans are still clinging to their fading power, still denying the reality that they are marked for removal from reality in this culling.
        </p>
        <p>
          The humans chosen to continue into the next phase are "Selected." They fall into two categories: "Merged" and "Doomed." The Merged have evolved into unity with the technology they used for centuries, a rote repetition across many generations, fusing humanity with its progress. The Doomed forced their own adaptive evolution through intensive study and practice of ancient ways. The name is one of sarcastic irony; they are esoteric masters on all levels.
        </p>
        <p>
          These worldwide elites engineered mutations out of spite upon discovering that they were neither "Merged" nor "Doomed." Dubbed "Creations," they are merged animal and human DNA. Millennia later, these creations have destroyed all nature and wildlife. Some are still loyal to the Genetic Warlord clans (Mutant class) while others roam free (Ronin class), and will help or harm both Evolved and Doomed.
        </p>
        <p>
          You are one of The Selected and are a target of Genetic Warlords and Creations of all kinds. You may choose the path of the Merged, a character who is a fusion of human and technology, with powers that translate well into a world that has merged with you, mirroring technology in nature. Or you may choose the path of the Doomed, a character with the power to manipulate the still-existing "Old Reality" at will, having evolved in a way that was once forsaken and then reclaimed by your kind. The forces of human progress and evolution have merged, and fate is to be earned in the new cross-reality of Ad Silentium.
        </p>
      </div>
    </div>
  </div>
</section>
HTML;

    return [
      '#type' => 'container',
      '#attributes' => [
        'data-ooh-hero' => 'true',
      ],
      'content' => [
        '#markup' => $template,
      ],
       '#attached' => [
         'library' => [
           'ooh_outskirts/landing',
           'ooh_outskirts/global-fonts',
         ],
      ],
    ];
  }

}
