<?php
namespace Dinlogic\AIW;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class OCR {
    protected $logger;

    public function __construct( Logger $logger ) {
        $this->logger = $logger;
    }

    public function extract_text( $files ) {
        $file = reset( $files );

        if ( empty( $file['tmp_name'] ) ) {
            return new WP_Error( 'invalid_file', __( 'Invalid file upload.', 'dinlogic-ai-order-widget' ) );
        }

        $mime = isset( $file['type'] ) ? $file['type'] : '';

        $allowed = array(
            'image/jpeg',
            'image/png',
            'application/pdf',
        );

        if ( ! in_array( $mime, $allowed, true ) ) {
            return new WP_Error( 'invalid_mime', __( 'Unsupported file type.', 'dinlogic-ai-order-widget' ) );
        }

        $content = file_get_contents( $file['tmp_name'] );
        $hash    = md5( $content );

        $this->logger->log( 'OCR extract invoked', array( 'hash' => $hash, 'mime' => $mime ) );

        return array(
            'text'       => '',
            'confidence' => 0,
        );
    }
}
