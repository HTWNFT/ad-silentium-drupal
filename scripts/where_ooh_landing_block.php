<?php
$def = \Drupal::service('plugin.manager.block')->getDefinition('ooh_landing_block');
echo "provider: {$def['provider']}\n";
echo "class: {$def['class']}\n";
$r = new \ReflectionClass($def['class']);
echo "file: {$r->getFileName()}\n";
