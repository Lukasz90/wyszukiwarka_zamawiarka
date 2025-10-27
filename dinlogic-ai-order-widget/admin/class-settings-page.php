<?php
namespace Dinlogic\AIW;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Settings_Page {
    const OPTION_KEY = 'dinlogic_aiw_settings';

    protected $registry;

    public function __construct( Family_Registry $registry = null ) {
        $this->registry = $registry ? $registry : new Family_Registry();
    }

    public function init() {
        add_action( 'admin_menu', array( $this, 'register_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    public function register_menu() {
        add_submenu_page(
            'woocommerce',
            __( 'AI Orders', 'dinlogic-ai-order-widget' ),
            __( 'AI Orders', 'dinlogic-ai-order-widget' ),
            'manage_woocommerce',
            'dinlogic-ai-orders',
            array( $this, 'render_page' )
        );
    }

    public function register_settings() {
        register_setting( 'dinlogic_aiw_settings', self::OPTION_KEY, array( $this, 'sanitize_settings' ) );

        add_settings_section(
            'dinlogic_aiw_registry',
            __( 'Family Registry', 'dinlogic-ai-order-widget' ),
            '__return_false',
            'dinlogic-ai-orders'
        );

        add_settings_field(
            'dinlogic_aiw_registry_yaml',
            __( 'Registry YAML', 'dinlogic-ai-order-widget' ),
            array( $this, 'render_registry_field' ),
            'dinlogic-ai-orders',
            'dinlogic_aiw_registry'
        );
    }

    public function sanitize_settings( $value ) {
        $value = wp_parse_args( $value, array( 'registry' => '' ) );

        $validation = $this->registry->validate( $value['registry'] );

        if ( is_wp_error( $validation ) ) {
            add_settings_error( self::OPTION_KEY, 'registry_error', $validation->get_error_message() );
            $value['registry'] = $this->registry->get_raw_contents();
        } else {
            $this->registry->save( $value['registry'] );
        }

        return $value;
    }

    public function render_page() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            return;
        }

        $settings = get_option( self::OPTION_KEY, array( 'registry' => $this->registry->get_raw_contents() ) );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'AI Order Widget', 'dinlogic-ai-order-widget' ); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'dinlogic_aiw_settings' );
                do_settings_sections( 'dinlogic-ai-orders' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function render_registry_field() {
        $settings = get_option( self::OPTION_KEY, array( 'registry' => $this->registry->get_raw_contents() ) );
        $contents = isset( $settings['registry'] ) ? $settings['registry'] : '';
        printf(
            '<textarea name="%1$s[registry]" rows="15" class="large-text code">%2$s</textarea>',
            esc_attr( self::OPTION_KEY ),
            esc_textarea( $contents )
        );
    }
}
