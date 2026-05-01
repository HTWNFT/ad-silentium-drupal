<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;

class OohPageController extends ControllerBase {

  public function landingpage() {
    $media_dir = DRUPAL_ROOT . '/sites/default/files/adsilentium/loops';
    $media_url = base_path() . 'sites/default/files/adsilentium/loops/';

    $files = glob($media_dir . '/*.mp4') ?: [];

    shuffle($files);
    $files = array_slice($files, 0, 8);

    $loops = [];

    foreach ($files as $index => $file) {
      $loops[] = [
        'index' => $index,
        'url' => $media_url . rawurlencode(basename($file)),
        'active' => $index === 0,
        'index0' => $index,
      ];
    }

    return [
      '#theme' => 'ooh_landing_page',
      '#loops' => $loops,
      '#attached' => [
        'library' => [
          'ooh_outskirts/landing',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }
  public function clearance() {
    return [
      '#theme' => 'ooh_clearance_page',
      '#attached' => [
        'library' => [
          'ooh_outskirts/clearance',
        ],
      ],
    ];
  }

  public function dossier() {
    $block = \Drupal::service('plugin.manager.block')
      ->createInstance('ooh_game_generator_block', []);
    $build = $block->build();

    $build['#cache'] = [
      'max-age' => 0,
    ];

    return $build;
  }

  public function play() {
    $block = \Drupal::service('plugin.manager.block')
      ->createInstance('ooh_play_block', [
        'require_login' => FALSE,
      ]);
    $build = $block->build();

    $build['#cache'] = [
      'max-age' => 0,
    ];

    return $build;
  }

  public function credits() {
    return [
      '#theme' => 'ooh_credits_page',
      '#attached' => [
        'library' => [
          'ooh_outskirts/credits',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  public function creditsCheckout(Request $request) {
    $pack = (string) $request->query->get('pack', '60');
    $allowed_packs = ['60', '180', '480'];

    if (!in_array($pack, $allowed_packs, TRUE)) {
      $pack = '60';
    }

    return [
      '#theme' => 'ooh_credits_checkout_page',
      '#selected_pack' => $pack,
      '#attached' => [
        'library' => [
          'ooh_outskirts/credits',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

}
