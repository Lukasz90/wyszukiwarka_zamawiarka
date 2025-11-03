<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Search {
    /** @var Logger */
    protected $logger;

    public function __construct( ?Logger $logger = null ) {
        $this->logger = $logger ? $logger : new Logger();
    }

    public function search( $query, $page = 1, $per_page = 10, $debug = false ) {
        $raw_query = $query;
        $query     = is_string( $query ) ? \wc_clean( $query ) : '';

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

        $debug_data = array();

        if ( $debug ) {
            $debug_data['query'] = array(
                'raw'       => $raw_query,
                'sanitized' => $query,
                'page'      => (int) $page,
                'per_page'  => (int) $per_page,
            );
        }

        $this->logger->log(
            'dinlogic_aiw.search.start',
            array(
                'raw_query'  => $raw_query,
                'query'      => $query,
                'page'       => (int) $page,
                'per_page'   => (int) $per_page,
                'debug_flag' => (bool) $debug,
            )
        );

        $args = array_merge(
            $this->get_base_args( $page, $per_page ),
            $this->get_search_args( $query )
        );

        if ( $debug ) {
            $debug_data['initial_args'] = $args;
        }

        list( $items, $total, $context ) = $this->execute_query( $args );

        if ( $debug ) {
            $debug_data['initial_context'] = $context;
        }

        if ( empty( $items ) ) {
            $fallback_args = array_merge(
                $this->get_base_args( $page, $per_page ),
                array(
                    's'       => $query,
                    'orderby' => 'title',
                    'order'   => 'ASC',
                )
            );

            $this->logger->log(
                'dinlogic_aiw.search.fallback',
                array(
                    'query' => $query,
                    'args'  => $fallback_args,
                )
            );

            if ( $debug ) {
                $debug_data['fallback_args'] = $fallback_args;
            }

            list( $items, $total, $fallback_context ) = $this->execute_query( $fallback_args );

            if ( $debug ) {
                $debug_data['fallback_context'] = $fallback_context;
            }
        }

        $data = array();

        foreach ( $items as $product_id ) {
            $product = wc_get_product( $product_id );

            if ( ! $product ) {
                continue;
            }

            $data[] = format_product_response( $product );
        }

        $response = array(
            'items'      => $data,
            'pagination' => array(
                'page'      => $page,
                'per_page'  => $per_page,
                'total'     => $total,
            ),
        );

        if ( $debug && $this->can_expose_debug() ) {
            $response['debug'] = $debug_data;
        }

        $this->logger->log(
            'dinlogic_aiw.search.complete',
            array(
                'query'          => $query,
                'count'          => count( $data ),
                'total'          => (int) $total,
                'debug_included' => $debug && $this->can_expose_debug(),
            )
        );

        return $response;
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
            $args['search']  = $query;
            $args['orderby'] = 'relevance';
            $args['order']   = 'DESC';
        } else {
            $args['s']       = $query;
            $args['orderby'] = 'title';
            $args['order']   = 'ASC';
        }

        return $args;
    }

    protected function execute_query( $args ) {
        global $wpdb;

        $clauses_snapshot = null;
        $marker           = wp_rand( 1000, 9999 );

        $filter = function ( $clauses, $query ) use ( &$clauses_snapshot, $marker ) {
            if ( (int) $query->get( 'dinlogic_aiw_marker' ) === $marker ) {
                $clauses_snapshot = $clauses;
            }

            return $clauses;
        };

        add_filter( 'posts_clauses', $filter, 999, 2 );

        $args['dinlogic_aiw_marker'] = $marker;

        try {
            $products = new \WC_Product_Query( $args );
            $result   = $products->get_products();
        } finally {
            remove_filter( 'posts_clauses', $filter, 999 );
        }

        if ( is_wp_error( $result ) ) {
            $this->logger->log(
                'dinlogic_aiw.search.error',
                array(
                    'error_code'    => $result->get_error_code(),
                    'error_message' => $result->get_error_message(),
                    'args'          => $args,
                )
            );

            $clean_error_args = $args;
            unset( $clean_error_args['dinlogic_aiw_marker'] );

            return array( array(), 0, array( 'args' => $clean_error_args ) );
        }

        if ( isset( $result['products'] ) ) {
            $items = array_map( 'absint', (array) $result['products'] );
            $total = isset( $result['total'] ) ? (int) $result['total'] : count( $items );
        } else {
            $items = array_map( 'absint', (array) $result );
            $total = count( $items );
        }

        $clean_args = $args;
        unset( $clean_args['dinlogic_aiw_marker'] );

        $context = array(
            'args'       => $clean_args,
            'clauses'    => $clauses_snapshot,
            'last_query' => ( isset( $wpdb ) && $wpdb ) ? $wpdb->last_query : null,
        );

        if ( $this->logger->is_enabled() ) {
            $this->logger->log(
                'dinlogic_aiw.search.result',
                array(
                    'count'      => count( $items ),
                    'total'      => (int) $total,
                    'args'       => $clean_args,
                    'clauses'    => $clauses_snapshot,
                    'last_query' => $context['last_query'],
                )
            );
        }

        return array( $items, $total, $context );
    }

    protected function can_expose_debug() {
        return current_user_can( 'manage_options' );
    }
}
