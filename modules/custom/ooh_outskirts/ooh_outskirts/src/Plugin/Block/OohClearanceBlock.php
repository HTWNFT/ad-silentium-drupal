<?php

namespace Drupal\ooh\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides an Outskirts of Hell Clearance block.
 *
 * @Block(
 *   id = "ooh_clearance_block",
 *   admin_label = @Translation("Outskirts of Hell")
 * )
 */
class OohClearanceBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'ooh_clearance_block',
      '#attached' => [
        'library' => [
          'ooh/clearance',
        ],
      ],
    ];
  }

}