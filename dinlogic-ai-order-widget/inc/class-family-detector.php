<?php
namespace Dinlogic\AIW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Family_Detector {
    protected $registry;

    public function __construct( Family_Registry $registry = null ) {
        $this->registry = $registry ? $registry : new Family_Registry();
    }

    public function detect( $text ) {
        $families = $this->registry->get_families();
        $matches  = array();

        foreach ( $families as $key => $family ) {
            $synonyms = isset( $family['synonyms'] ) ? $family['synonyms'] : array();
            $score    = 0;

            foreach ( $synonyms as $synonym ) {
                if ( false !== stripos( $text, $synonym ) ) {
                    $score += 1;
                }
            }

            if ( $score > 0 ) {
                $matches[] = array(
                    'family'     => $key,
                    'confidence' => min( 1, $score / max( 1, count( $synonyms ) ) ),
                );
            }
        }

        usort(
            $matches,
            function ( $a, $b ) {
                if ( $a['confidence'] === $b['confidence'] ) {
                    return 0;
                }

                return ( $a['confidence'] < $b['confidence'] ) ? 1 : -1;
            }
        );

        return array_slice( $matches, 0, 3 );
    }
}
