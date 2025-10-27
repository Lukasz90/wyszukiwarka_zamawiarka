<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Parser {
    protected $detector;
    protected $logger;

    public function __construct( Family_Detector $detector, Logger $logger ) {
        $this->detector = $detector;
        $this->logger   = $logger;
    }

    public function parse_transcript( $transcript ) {
        $lines   = preg_split( '/\r?\n|[\.;]/', $transcript );
        $results = array();

        foreach ( $lines as $line ) {
            $clean = trim( $line );

            if ( '' === $clean ) {
                continue;
            }

            $families = $this->detector->detect( $clean );

            $results[] = array(
                'raw'        => $clean,
                'family'     => isset( $families[0] ) ? $families[0]['family'] : null,
                'confidence' => isset( $families[0] ) ? $families[0]['confidence'] : 0,
                'missing'    => array(),
                'candidates' => array(),
            );
        }

        if ( empty( $results ) ) {
            $this->logger->log( 'Parser: no lines extracted', array( 'transcript' => $transcript ) );
        }

        return $results;
    }
}
