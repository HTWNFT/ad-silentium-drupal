<?php

namespace Drupal\ooh\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides an Outskirts of Hell Credits block.
 *
 * @Block(
 *   id = "ooh_credits_block",
 *   admin_label = @Translation("Outskirts of Hell")
 * )
 */
class OohCreditsBlock extends BlockBase {

  public function build() {
    return [
      '#theme' => 'ooh_credits_block',
      '#attached' => [
        'library' => [
          'ooh/credits',
        ],
      ],
    ];
  }

}