<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Dinlogic_AIW_Parser {

    /**
     * Reduce repeated sequences and characters from text inputs.
     *
     * @param string $text
     * @return string
     */
    public function dedupe_text( $text ) {
        $text = (string) $text;
        $text = wp_unslash( $text );

        // Collapse triple or longer repeated characters (e.g. coool -> cool).
        $text = preg_replace( '/([\p{L}])\1{2,}/u', '$1$1', $text );

        // Collapse glued words like "stycznikstycznik".
        $text = preg_replace_callback(
            '/([\p{L}]{3,})\1+/u',
            function ( $matches ) {
                return $matches[1];
            },
            $text
        );

        // Normalize whitespace.
        $text = preg_replace( '/\s+/u', ' ', $text );
        $text = trim( $text );

        if ( '' === $text ) {
            return '';
        }

        $words   = preg_split( '/\s+/u', $text );
        $cleaned = array();

        foreach ( $words as $word ) {
            if ( '' === $word ) {
                continue;
            }

            $last = end( $cleaned );
            if ( ! $last || mb_strtolower( $last ) !== mb_strtolower( $word ) ) {
                $cleaned[] = $word;
            }
        }

        return implode( ' ', $cleaned );
    }
}
