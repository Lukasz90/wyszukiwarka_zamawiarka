<?php
namespace Dinlogic\AIW;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class REST {
    const ROUTE_NAMESPACE = 'aiw/v1';

    /** @var Search */
    protected $search;

    public function __construct( ?Search $search = null ) {
        $this->search = $search ? $search : new Search();
    }

    protected function ensure_cart() {
        if ( function_exists( 'wc_load_cart' ) ) {
            wc_load_cart();
            return;
        }

        if ( null === WC()->cart ) {
            include_once WC_ABSPATH . 'includes/class-wc-cart.php';
            WC()->cart = new \WC_Cart();
        }
    }

    public function init() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/search',
            array(
                'args'                 => array(
                    'q'        => array( 'type' => 'string' ),
                    'page'     => array( 'type' => 'integer', 'default' => 1 ),
                    'per_page' => array( 'type' => 'integer', 'default' => 10 ),
                    'debug'    => array( 'type' => 'boolean', 'default' => false ),
                ),
                'permission_callback' => '__return_true',
                'callback'            => array( $this, 'handle_search' ),
                'methods'             => WP_REST_Server::READABLE,
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/cart/add',
            array(
                'permission_callback' => array( $this, 'guard_post' ),
                'callback'            => array( $this, 'handle_cart_add' ),
                'methods'             => WP_REST_Server::CREATABLE,
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/lines/add',
            array(
                'permission_callback' => array( $this, 'guard_post' ),
                'callback'            => array( $this, 'handle_lines_add' ),
                'methods'             => WP_REST_Server::CREATABLE,
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/voice/parse',
            array(
                'permission_callback' => array( $this, 'guard_post' ),
                'callback'            => array( $this, 'handle_voice_parse' ),
                'methods'             => WP_REST_Server::CREATABLE,
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/ocr/extract',
            array(
                'permission_callback' => array( $this, 'guard_post' ),
                'callback'            => array( $this, 'handle_ocr_extract' ),
                'methods'             => WP_REST_Server::CREATABLE,
            )
        );
    }

    public function guard_post( $request ) {
        $nonce = $request->get_header( 'X-WP-Nonce' );

        if ( ! $nonce ) {
            $params = $request->get_params();
            $nonce  = isset( $params['_wpnonce'] ) ? $params['_wpnonce'] : '';
        }

        if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
            return new WP_Error( 'invalid_nonce', __( 'Invalid security token.', 'dinlogic-ai-order-widget' ), array( 'status' => 403 ) );
        }

        if ( is_user_logged_in() ) {
            return current_user_can( 'read' );
        }

        return true;
    }

    public function handle_search( WP_REST_Request $request ) {
        $q        = (string) $request->get_param( 'q' );
        $page     = sanitize_int( $request->get_param( 'page' ), 1 );
        $per_page = max( 1, min( 50, sanitize_int( $request->get_param( 'per_page' ), 10 ) ) );

        $requested_debug = rest_sanitize_boolean( $request->get_param( 'debug' ) );
        $allow_debug     = $requested_debug && current_user_can( 'manage_options' );

        $results = $this->search->search( $q, $page, $per_page, $allow_debug );

        if ( $requested_debug && ! $allow_debug ) {
            $results['debug'] = array(
                'notice' => __( 'Debug data is available only to administrators.', 'dinlogic-ai-order-widget' ),
            );
        }

        return new WP_REST_Response( $results );
    }

    public function handle_cart_add( WP_REST_Request $request ) {
        $this->ensure_cart();

        $params     = $request->get_json_params();
        $product_id = isset( $params['product_id'] ) ? (int) $params['product_id'] : 0;
        $qty        = isset( $params['qty'] ) ? max( 1, (int) $params['qty'] ) : 1;
        $variation  = isset( $params['variation'] ) && is_array( $params['variation'] ) ? $params['variation'] : array();

        if ( ! $product_id ) {
            return new WP_Error( 'invalid_product', __( 'Product ID is required.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        $product = wc_get_product( $product_id );

        if ( ! $product ) {
            return new WP_Error( 'not_found', __( 'Product not found.', 'dinlogic-ai-order-widget' ), array( 'status' => 404 ) );
        }

        $cart_item_key = false;

        if ( $product->is_type( 'variation' ) ) {
            $parent        = wc_get_product( $product->get_parent_id() );
            $cart_item_key = WC()->cart->add_to_cart( $parent->get_id(), $qty, $product->get_id(), $variation );
        } elseif ( $product->is_type( 'variable' ) ) {
            return new WP_Error( 'missing_variation', __( 'Variation attributes required.', 'dinlogic-ai-order-widget' ), array( 'status' => 409 ) );
        } else {
            $cart_item_key = WC()->cart->add_to_cart( $product_id, $qty );
        }

        if ( ! $cart_item_key ) {
            return new WP_Error( 'cart_error', __( 'Unable to add product to cart.', 'dinlogic-ai-order-widget' ), array( 'status' => 500 ) );
        }

        return new WP_REST_Response( array( 'cart_item_key' => $cart_item_key ) );
    }

    public function handle_lines_add( WP_REST_Request $request ) {
        $this->ensure_cart();

        $params = $request->get_json_params();

        if ( empty( $params['lines'] ) || ! is_array( $params['lines'] ) ) {
            return new WP_Error( 'invalid_lines', __( 'Lines payload must be an array.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        $results = array();

        foreach ( $params['lines'] as $index => $line ) {
            $product_id = isset( $line['product_id'] ) ? (int) $line['product_id'] : 0;
            $qty        = isset( $line['qty'] ) ? max( 1, (int) $line['qty'] ) : 1;
            $variation  = isset( $line['variation'] ) && is_array( $line['variation'] ) ? $line['variation'] : array();

            if ( ! $product_id ) {
                $results[] = array(
                    'index' => $index,
                    'status' => 'error',
                    'error'  => __( 'Missing product ID.', 'dinlogic-ai-order-widget' ),
                );
                continue;
            }

            $product = wc_get_product( $product_id );

            if ( ! $product ) {
                $results[] = array(
                    'index' => $index,
                    'status' => 'error',
                    'error'  => __( 'Product not found.', 'dinlogic-ai-order-widget' ),
                );
                continue;
            }

            if ( $product->is_type( 'variable' ) && empty( $variation ) ) {
                $results[] = array(
                    'index' => $index,
                    'status' => 'error',
                    'error'  => __( 'Missing variation attributes.', 'dinlogic-ai-order-widget' ),
                );
                continue;
            }

            $parent_id    = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
            $variation_id = $product->is_type( 'variation' ) ? $product->get_id() : 0;

            $cart_item_key = WC()->cart->add_to_cart( $parent_id, $qty, $variation_id, $variation );

            $results[] = array(
                'index'         => $index,
                'status'        => $cart_item_key ? 'success' : 'error',
                'cart_item_key' => $cart_item_key,
            );
        }

        return new WP_REST_Response( array( 'results' => $results ) );
    }

    public function handle_voice_parse( WP_REST_Request $request ) {
        $params     = $request->get_json_params();
        $transcript = isset( $params['transcript'] ) ? (string) $params['transcript'] : '';

        if ( '' === trim( $transcript ) ) {
            return new WP_Error( 'invalid_transcript', __( 'Transcript cannot be empty.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        $parser = new Parser( new Family_Detector(), new Logger() );
        $lines  = $parser->parse_transcript( $transcript );

        return new WP_REST_Response( array( 'lines' => $lines ) );
    }

    public function handle_ocr_extract( WP_REST_Request $request ) {
        $files = $request->get_file_params();

        if ( empty( $files ) ) {
            return new WP_Error( 'missing_file', __( 'No file provided.', 'dinlogic-ai-order-widget' ), array( 'status' => 400 ) );
        }

        $ocr    = new OCR( new Logger() );
        $result = $ocr->extract_text( $files );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return new WP_REST_Response( $result );
    }
}
