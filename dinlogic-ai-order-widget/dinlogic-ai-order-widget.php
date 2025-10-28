<?php
/**
 * Plugin Name: Dinlogic AI Order Widget
 * Description: Prosty widget zamówień dla WooCommerce z wyszukiwaniem i obsługą głosu.
 * Version: 0.2.0
 * Author: Dinlogic
 * Text Domain: dinlogic-ai-order-widget
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'DINLOGIC_AIW_VERSION', '0.2.0' );
define( 'DINLOGIC_AIW_PATH', plugin_dir_path( __FILE__ ) );
define( 'DINLOGIC_AIW_URL', plugin_dir_url( __FILE__ ) );

require_once DINLOGIC_AIW_PATH . 'inc/class-search.php';
require_once DINLOGIC_AIW_PATH . 'inc/class-parser.php';
require_once DINLOGIC_AIW_PATH . 'inc/class-rest.php';

add_action( 'plugins_loaded', function () {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return;
    }

    $rest = new Dinlogic_AIW_REST( new Dinlogic_AIW_Search(), new Dinlogic_AIW_Parser() );
    $rest->init();
} );

function dinlogic_aiw_enqueue_assets() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return;
    }

    wp_register_script(
        'dinlogic-aiw-widget',
        DINLOGIC_AIW_URL . 'public/build/widget.js',
        array(),
        DINLOGIC_AIW_VERSION,
        true
    );

    wp_register_style(
        'dinlogic-aiw-widget',
        DINLOGIC_AIW_URL . 'public/build/widget.css',
        array(),
        DINLOGIC_AIW_VERSION
    );
}
add_action( 'init', 'dinlogic_aiw_enqueue_assets' );

function dinlogic_aiw_shortcode() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return '';
    }

    wp_enqueue_script( 'dinlogic-aiw-widget' );
    wp_enqueue_style( 'dinlogic-aiw-widget' );

    $i18n = array(
        'searching'   => __( 'Szukam…', 'dinlogic-ai-order-widget' ),
        'analyzing'   => __( 'Analizuję…', 'dinlogic-ai-order-widget' ),
        'noResults'   => __( 'Brak wyników.', 'dinlogic-ai-order-widget' ),
        'added'       => __( 'Dodano do koszyka', 'dinlogic-ai-order-widget' ),
        'error'       => __( 'Błąd', 'dinlogic-ai-order-widget' ),
    );

    wp_localize_script(
        'dinlogic-aiw-widget',
        'DinlogicAIWConfig',
        array(
            'restBase' => esc_url_raw( rest_url( Dinlogic_AIW_REST::ROUTE_NAMESPACE ) ),
            'nonce'    => wp_create_nonce( 'wp_rest' ),
            'currency' => get_woocommerce_currency_symbol(),
            'i18n'     => $i18n,
        )
    );

    ob_start();
    echo '<div class="aiw-widget" aria-live="polite"></div>';

    return ob_get_clean();
}
add_shortcode( 'ai_order_widget', 'dinlogic_aiw_shortcode' );
