<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sanitize_int( $value, $default = 0 ) {
    if ( null === $value ) {
        return $default;
    }

    return filter_var( $value, FILTER_VALIDATE_INT ) !== false ? (int) $value : $default;
}

function sanitize_float( $value, $default = 0.0 ) {
    if ( null === $value ) {
        return $default;
    }

    return filter_var( $value, FILTER_VALIDATE_FLOAT ) !== false ? (float) $value : $default;
}

function format_product_response( \WC_Product $product ) {
    $data = array(
        'id'           => $product->get_id(),
        'name'         => $product->get_name(),
        'sku'          => $product->get_sku(),
        'price'        => wc_get_price_to_display( $product ),
        'unit'         => $product->get_meta( '_unit', true ),
        'stock_status' => $product->get_stock_status(),
        'thumb'        => get_the_post_thumbnail_url( $product->get_id(), 'thumbnail' ),
        'attributes'   => array(),
        'is_variable'  => $product->is_type( 'variable' ),
    );

    if ( $product->is_type( 'variable' ) ) {
        $variations = array();

        foreach ( $product->get_available_variations() as $variation ) {
            $variations[] = array(
                'id'         => $variation['variation_id'],
                'attributes' => $variation['attributes'],
                'price'      => isset( $variation['display_price'] ) ? $variation['display_price'] : null,
                'stock'      => isset( $variation['is_in_stock'] ) ? (bool) $variation['is_in_stock'] : null,
            );
        }

        $data['variations'] = $variations;
    }

    foreach ( $product->get_attributes() as $attribute ) {
        if ( $attribute->is_taxonomy() ) {
            $terms = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'names' ) );
            $data['attributes'][] = array(
                'name'  => wc_attribute_label( $attribute->get_name() ),
                'value' => $terms,
            );
        } else {
            $data['attributes'][] = array(
                'name'  => $attribute->get_name(),
                'value' => $attribute->get_options(),
            );
        }
    }

    return $data;
}
