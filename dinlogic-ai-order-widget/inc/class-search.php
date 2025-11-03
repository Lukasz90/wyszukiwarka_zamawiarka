<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Search {
    public function search( $query, $page = 1, $per_page = 10 ) {
        $query = is_string( $query ) ? \wc_clean( $query ) : '';

        if ( '' === $query ) {
            return array(
                'items'      => array(),
                'pagination' => array(
                    'page'      => $page,
                    'per_page'  => $per_page,
                    'total'     => 0,
                ),
            );
        }

        $args = array_merge(
            $this->get_base_args( $page, $per_page ),
            $this->get_search_args( $query )
        );

        list( $items, $total ) = $this->execute_query( $args );

        if ( empty( $items ) ) {
            $fallback_args = array_merge(
                $this->get_base_args( $page, $per_page ),
                array(
                    's'       => $query,
                    'orderby' => 'title',
                    'order'   => 'ASC',
                )
            );

            list( $items, $total ) = $this->execute_query( $fallback_args );
        }

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

    protected function get_base_args( $page, $per_page ) {
        return array(
            'limit'        => $per_page,
            'paginate'     => true,
            'page'         => max( 1, $page ),
            'return'       => 'ids',
            'status'       => array( 'publish' ),
            'stock_status' => array( 'instock', 'onbackorder', 'outofstock' ),
        );
    }

    protected function get_search_args( $query ) {
        $args = array(
            'search_columns' => array( 'post_title', 'post_excerpt', 'post_content', 'sku' ),
        );

        if ( defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '3.7.0', '>=' ) ) {
            $args['search'] = $query;
            $args['orderby'] = 'relevance';
            $args['order']   = 'DESC';
        } else {
            $args['s']      = $query;
            $args['orderby'] = 'title';
            $args['order']   = 'ASC';
        }

        return $args;
    }

    protected function execute_query( $args ) {
        $products = new \WC_Product_Query( $args );
        $result   = $products->get_products();

        if ( is_wp_error( $result ) ) {
            return array( array(), 0 );
        }

        if ( isset( $result['products'] ) ) {
            $items = array_map( 'absint', (array) $result['products'] );
            $total = isset( $result['total'] ) ? (int) $result['total'] : count( $items );
        } else {
            $items = array_map( 'absint', (array) $result );
            $total = count( $items );
        }

        return array( $items, $total );
    }
}
