<?php

namespace Drupal\ooh_outskirts\Controller;

use Drupal\Core\Controller\ControllerBase;

class OohPageController extends ControllerBase {

  public function landingpage() {
    $block = \Drupal::service('plugin.manager.block')->createInstance('ooh_landing_block');
    $build = $block->build();

    $build['#attached']['library'][] = 'ooh_outskirts.landing';
    $build['#cache']['max-age'] = 0;

    return $build;
  }

  public function clearance() {
    $block = \Drupal::service('plugin.manager.block')->createInstance('ooh_clearance_block');
    $build = $block->build();
    $build['#attached']['library'][] = 'ooh_outskirts.landing';
    $build['#cache']['max-age'] = 0;

    return $build;
  }

  public function credits() {
    $block = \Drupal::service('plugin.manager.block')->createInstance('ooh_credits_block');
    $build = $block->build();
    $build['#attached']['library'][] = 'ooh_outskirts.landing';
    $build['#cache']['max-age'] = 0;

    return $build;
  }

}