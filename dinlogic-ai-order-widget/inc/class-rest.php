<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Dinlogic_AIW_REST {
    const ROUTE_NAMESPACE = 'aiw/v1';

    /** @var Dinlogic_AIW_Search */
    private $search;

    /** @var Dinlogic_AIW_Parser */
    private $parser;

    public function __construct( Dinlogic_AIW_Search $search, Dinlogic_AIW_Parser $parser ) {
        $this->search = $search;
        $this->parser = $parser;
    }

    public function init() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/search',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'handle_search' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'q'        => array(
                        'sanitize_callback' => 'sanitize_text_field',
                        'required'          => false,
                    ),
                    'page'     => array(
                        'validate_callback' => 'is_numeric',
                        'default'           => 1,
                    ),
                    'per_page' => array(
                        'validate_callback' => 'is_numeric',
                        'default'           => 10,
                    ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/cart/add',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_cart_add' ),
                'permission_callback' => array( $this, 'check_nonce' ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/voice/parse',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_voice_parse' ),
                'permission_callback' => array( $this, 'check_nonce' ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/lines/add',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_lines_add' ),
                'permission_callback' => array( $this, 'check_nonce' ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/ocr/extract',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'handle_ocr_extract' ),
                'permission_callback' => array( $this, 'check_nonce' ),
            )
        );
    }

    public function handle_search( WP_REST_Request $request ) {
        $query    = $request->get_param( 'q' );
        $page     = $request->get_param( 'page' );
        $per_page = $request->get_param( 'per_page' );

        $results = $this->search->search( $query, $page, $per_page );

        return rest_ensure_response( $results );
    }

    public function handle_cart_add( WP_REST_Request $request ) {
        $product_id = absint( $request->get_param( 'product_id' ) );
        $qty        = max( 1, absint( $request->get_param( 'qty' ) ) );
        $variation  = $request->get_param( 'variation' );

        if ( ! $product_id ) {
            return new WP_Error( 'invalid_product', __( 'Brak produktu.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        if ( null === WC()->cart ) {
            wc_load_cart();
        }

        if ( empty( WC()->cart ) ) {
            return new WP_Error( 'cart_unavailable', __( 'Koszyk niedostępny.', 'dinlogic-ai-order-widget' ), array( 'status' => 500 ) );
        }

        $added = false;

        if ( ! empty( $variation ) && is_array( $variation ) ) {
            $added = WC()->cart->add_to_cart( $product_id, $qty, 0, $variation );
        } else {
            $added = WC()->cart->add_to_cart( $product_id, $qty );
        }

        if ( false === $added ) {
            return new WP_Error( 'add_failed', __( 'Nie udało się dodać produktu.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        return rest_ensure_response(
            array(
                'ok'         => true,
                'cart_count' => WC()->cart->get_cart_contents_count(),
            )
        );
    }

    public function handle_voice_parse( WP_REST_Request $request ) {
        $transcript = (string) $request->get_param( 'transcript' );
        $cleaned    = $this->parser->dedupe_text( $transcript );

        $qty = 1;
        if ( preg_match( '/(\d+)/', $cleaned, $matches ) ) {
            $qty = max( 1, (int) $matches[1] );
        }

        $candidates = array();

        if ( '' !== $cleaned ) {
            $results = $this->search->search( $cleaned, 1, 5 );

            foreach ( $results as $result ) {
                $candidates[] = array(
                    'product_id' => $result['id'],
                    'qty'        => $qty,
                    'unit'       => 'pcs',
                    'score'      => 0.5,
                );
            }
        }

        $response = array(
            'lines' => array(
                array(
                    'raw'        => $cleaned,
                    'family'     => null,
                    'confidence' => 0.5,
                    'missing'    => array(),
                    'candidates' => $candidates,
                ),
            ),
        );

        return rest_ensure_response( $response );
    }

    public function handle_lines_add( WP_REST_Request $request ) {
        $lines = $request->get_param( 'lines' );

        if ( ! is_array( $lines ) ) {
            return new WP_Error( 'invalid_lines', __( 'Nieprawidłowe dane.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        if ( null === WC()->cart ) {
            wc_load_cart();
        }

        if ( empty( WC()->cart ) ) {
            return new WP_Error( 'cart_unavailable', __( 'Koszyk niedostępny.', 'dinlogic-ai-order-widget' ), array( 'status' => 500 ) );
        }

        $added = 0;

        foreach ( $lines as $line ) {
            $product_id = isset( $line['product_id'] ) ? absint( $line['product_id'] ) : 0;
            $qty        = isset( $line['qty'] ) ? max( 1, absint( $line['qty'] ) ) : 1;
            $variation  = isset( $line['variation'] ) && is_array( $line['variation'] ) ? $line['variation'] : array();

            if ( ! $product_id ) {
                continue;
            }

            $result = WC()->cart->add_to_cart( $product_id, $qty, 0, $variation );

            if ( false !== $result ) {
                $added += $qty;
            }
        }

        return rest_ensure_response(
            array(
                'ok'    => true,
                'added' => $added,
            )
        );
    }

    public function handle_ocr_extract() {
        return new WP_Error( 'not_implemented', __( 'Endpoint niezaimplementowany.', 'dinlogic-ai-order-widget' ), array( 'status' => 501 ) );
    }

    public function check_nonce( WP_REST_Request $request ) {
        $headers = $request->get_headers();
        $nonce   = isset( $headers['x-wp-nonce'][0] ) ? $headers['x-wp-nonce'][0] : '';

        if ( ! $nonce ) {
            return new WP_Error( 'rest_forbidden', __( 'Brak uprawnień.', 'dinlogic-ai-order-widget' ), array( 'status' => 403 ) );
        }

        if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
            return new WP_Error( 'rest_forbidden', __( 'Brak uprawnień.', 'dinlogic-ai-order-widget' ), array( 'status' => 403 ) );
        }

        return true;
    }
}
