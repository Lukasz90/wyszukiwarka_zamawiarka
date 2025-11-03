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
    if ( 0 !== strpos( $class, 'Dinlogic\\AIW\\' ) ) {
        return;
    }

    $parts    = explode( '\\', $class );
    array_shift( $parts );
    $relative = strtolower( implode( '-', $parts ) );
    $file     = DINLOGIC_AIW_PATH . 'inc/class-' . $relative . '.php';

    if ( is_readable( $file ) ) {
        require_once $file;
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
            'restUrl'         => esc_url_raw( rest_url( Dinlogic\AIW\REST::ROUTE_NAMESPACE ) ),
            'nonce'           => wp_create_nonce( 'wp_rest' ),
            'currency'        => get_woocommerce_currency(),
            'currencySymbol'  => get_woocommerce_currency_symbol(),
            'locale'          => str_replace( '_', '-', get_locale() ),
            'priceDecimals'   => wc_get_price_decimals(),
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
