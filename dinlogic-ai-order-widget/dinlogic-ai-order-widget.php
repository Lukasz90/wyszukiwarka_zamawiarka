<?php
/**
 * Plugin Name: Dinlogic AI Order Widget
 * Description: AI-assisted ordering widget for WooCommerce combining search, voice, and OCR workflows.
 * Version: 0.1.0
 * Author: Dinlogic
 * Text Domain: dinlogic-ai-order-widget
 * Domain Path: /languages
 */

define( 'DINLOGIC_AIW_VERSION', '0.1.0' );
define( 'DINLOGIC_AIW_PATH', plugin_dir_path( __FILE__ ) );
define( 'DINLOGIC_AIW_URL', plugin_dir_url( __FILE__ ) );

spl_autoload_register( function ( $class ) {
    $prefix = 'Dinlogic\\AIW\\';

    if ( 0 !== strpos( $class, $prefix ) ) {
        return;
    }

    $relative = substr( $class, strlen( $prefix ) );
    $relative = str_replace( '\\', '/', $relative );
    $relative = str_replace( '_', '-', $relative );

    $segments   = explode( '/', $relative );
    $class_slug = strtolower( array_pop( $segments ) );
    $subpath    = '';

    if ( ! empty( $segments ) ) {
        $subpath = strtolower( implode( '/', $segments ) ) . '/';
    }

    $locations = array(
        DINLOGIC_AIW_PATH . 'inc/' . $subpath . 'class-' . $class_slug . '.php',
        DINLOGIC_AIW_PATH . 'admin/' . $subpath . 'class-' . $class_slug . '.php',
    );

    foreach ( $locations as $file ) {
        if ( is_readable( $file ) ) {
            require_once $file;
            return;
        }
    }
} );

require_once DINLOGIC_AIW_PATH . 'inc/helpers.php';

add_action( 'plugins_loaded', function () {
    load_plugin_textdomain( 'dinlogic-ai-order-widget', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

    if ( ! class_exists( 'WooCommerce' ) ) {
        return;
    }

    $rest = new Dinlogic\AIW\REST();
    $rest->init();

    if ( is_admin() ) {
        $settings = new Dinlogic\AIW\Settings_Page();
        $settings->init();
    }
} );

add_shortcode( 'ai_order_widget', function () {
    wp_enqueue_script( 'dinlogic-aiw-widget', DINLOGIC_AIW_URL . 'public/build/widget.js', array(), DINLOGIC_AIW_VERSION, true );
    wp_enqueue_style( 'dinlogic-aiw-widget', DINLOGIC_AIW_URL . 'public/build/widget.css', array(), DINLOGIC_AIW_VERSION );

    wp_localize_script(
        'dinlogic-aiw-widget',
        'DinlogicAIWConfig',
        array(
            'restUrl' => esc_url_raw( rest_url( Dinlogic\AIW\REST::ROUTE_NAMESPACE ) ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        )
    );

    ob_start();
    echo '<div id="dinlogic-ai-order-widget" class="dinlogic-aiw-widget" aria-live="polite"></div>';

    return ob_get_clean();
} );

add_action( 'init', function () {
    if ( ! function_exists( 'register_block_type' ) ) {
        return;
    }

    register_block_type(
        DINLOGIC_AIW_PATH . 'blocks',
        array(
            'render_callback' => function () {
                return do_shortcode( '[ai_order_widget]' );
            },
        )
    );
} );
