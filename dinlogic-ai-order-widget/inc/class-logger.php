<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Logger {
    protected $enabled;

    public function __construct( $enabled = null ) {
        if ( null === $enabled ) {
            $enabled = (bool) get_option( 'dinlogic_aiw_logging_enabled', false );
        }

        $this->enabled = $enabled;
    }

    public function log( $message, $context = array() ) {
        if ( ! $this->enabled ) {
            return;
        }

        if ( is_array( $message ) || is_object( $message ) ) {
            $message = wp_json_encode( $message );
        }

        $entry = sprintf( '[%s] %s %s', current_time( 'mysql' ), $message, wp_json_encode( $context ) );

        error_log( $entry );
    }
}
