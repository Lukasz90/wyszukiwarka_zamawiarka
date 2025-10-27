<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Indexer {
    const TRANSIENT_KEY = 'dinlogic_aiw_index';
    const EXPIRATION    = 15 * MINUTE_IN_SECONDS;

    public function build_index() {
        $products = wc_get_products( array( 'limit' => -1, 'status' => 'publish' ) );
        $index    = array();

        foreach ( $products as $product ) {
            $index[ $product->get_id() ] = array(
                'id'    => $product->get_id(),
                'name'  => $product->get_name(),
                'sku'   => $product->get_sku(),
                'brand' => $product->get_meta( 'brand' ),
            );
        }

        set_transient( self::TRANSIENT_KEY, $index, self::EXPIRATION );

        return $index;
    }

    public function get_index() {
        $index = get_transient( self::TRANSIENT_KEY );

        if ( false === $index ) {
            $index = $this->build_index();
        }

        return $index;
    }
}
