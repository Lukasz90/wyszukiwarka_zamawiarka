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
            'return'       => 'ids',
            'status'       => array( 'publish' ),
            'stock_status' => array( 'instock', 'onbackorder' ),
            'featured'     => false,
            's'            => $query,
        );

        $orderby_args = $this->get_orderby_args();

        if ( ! empty( $orderby_args ) ) {
            $args = array_merge( $args, $orderby_args );
        }

        $products = new \WC_Product_Query( $args );
        $result   = $products->get_products();

        if ( is_wp_error( $result ) ) {
            $fallback_args = array_merge(
                $args,
                array(
                    'orderby' => 'title',
                    'order'   => 'ASC',
                )
            );

            unset( $fallback_args['s'] );
            $fallback_args['search'] = $query;

            $products = new \WC_Product_Query( $fallback_args );
            $result   = $products->get_products();
        }
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

    protected function get_orderby_args() {
        if ( defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '3.7.0', '>=' ) ) {
            return array(
                'orderby' => 'relevance',
                'order'   => 'DESC',
            );
        }

        return array(
            'orderby' => 'title',
            'order'   => 'ASC',
        );
    }
}
