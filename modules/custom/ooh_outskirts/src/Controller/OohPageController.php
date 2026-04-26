<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;

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

  /**
   * Builds the clearance page.
   */
  public function clearance() {
    return [
      '#theme' => 'ooh_clearance_block',
      '#attached' => [
        'library' => [
          'ooh_outskirts/clearance',
        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

  /**
   * Builds the credits page.
   */
  public function credits() {
    return [
      '#theme' => 'ooh_credits_block',
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
