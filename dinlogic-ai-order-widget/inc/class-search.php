<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Search {
    public function search( $query, $page = 1, $per_page = 10 ) {
        if ( ! $query ) {
            return array(
                'items'      => array(),
                'pagination' => array(
                    'page'      => $page,
                    'per_page'  => $per_page,
                    'total'     => 0,
                ),
            );
        }

        $args = array(
            'limit'        => $per_page,
            'paginate'     => true,
            'page'         => max( 1, $page ),
            'orderby'      => 'relevance',
            'order'        => 'DESC',
            'return'       => 'ids',
            'stock_status' => array( 'instock', 'onbackorder' ),
            'featured'     => false,
        );

        if ( function_exists( 'wc_get_container' ) && class_exists( '\\Automattic\\WooCommerce\\Utilities\\StringUtil' ) ) {
            $args['s'] = $query;
        } else {
            $args['search'] = $query;
        }

        $products = new \WC_Product_Query( $args );
        $result   = $products->get_products();
        $total    = isset( $result['total'] ) ? (int) $result['total'] : count( $result );
        $items    = isset( $result['products'] ) ? $result['products'] : $result;

        $data = array();

        foreach ( $items as $product_id ) {
            $product = wc_get_product( $product_id );

            if ( ! $product ) {
                continue;
            }

            $data[] = format_product_response( $product );
        }

        return array(
            'items'      => $data,
            'pagination' => array(
                'page'      => $page,
                'per_page'  => $per_page,
                'total'     => $total,
            ),
        );
    }
}
