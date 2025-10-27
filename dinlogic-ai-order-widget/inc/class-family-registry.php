<?php
namespace Dinlogic\AIW;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Family_Registry {
    protected $path;
    protected $families;

    public function __construct( $path = null ) {
        $this->path = $path ? $path : DINLOGIC_AIW_PATH . 'inc/config/families.yaml';
    }

    public function get_raw_contents() {
        if ( ! file_exists( $this->path ) ) {
            return '';
        }

        return (string) file_get_contents( $this->path );
    }

    public function get_families() {
        if ( null !== $this->families ) {
            return $this->families;
        }

        $this->families = array();

        if ( ! file_exists( $this->path ) ) {
            return $this->families;
        }

        $contents = file_get_contents( $this->path );

        $parsed = $this->parse_yaml( $contents );

        if ( is_wp_error( $parsed ) ) {
            return array();
        }

        $this->families = is_array( $parsed ) ? $parsed : array();

        return $this->families;
    }

    public function validate( $yaml ) {
        $parsed = $this->parse_yaml( $yaml );

        if ( is_wp_error( $parsed ) ) {
            return $parsed;
        }

        if ( ! is_array( $parsed ) ) {
            return new WP_Error( 'invalid_registry', __( 'Registry must be a map of families.', 'dinlogic-ai-order-widget' ) );
        }

        foreach ( $parsed as $family_key => $definition ) {
            if ( ! is_array( $definition ) ) {
                return new WP_Error( 'invalid_family', sprintf( __( 'Family %s must be an object.', 'dinlogic-ai-order-widget' ), $family_key ) );
            }

            if ( empty( $definition['synonyms'] ) || ! is_array( $definition['synonyms'] ) ) {
                return new WP_Error( 'invalid_synonyms', sprintf( __( 'Family %s must define synonyms array.', 'dinlogic-ai-order-widget' ), $family_key ) );
            }

            if ( isset( $definition['attributes'] ) && ! is_array( $definition['attributes'] ) ) {
                return new WP_Error( 'invalid_attributes', sprintf( __( 'Family %s attributes must be an array.', 'dinlogic-ai-order-widget' ), $family_key ) );
            }
        }

        return true;
    }

    public function save( $yaml ) {
        $result = $this->validate( $yaml );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        file_put_contents( $this->path, $yaml );
        $this->families = null;

        return true;
    }

    protected function parse_yaml( $yaml ) {
        if ( '' === trim( $yaml ) ) {
            return array();
        }

        if ( function_exists( 'yaml_parse' ) ) {
            try {
                return yaml_parse( $yaml );
            } catch ( \Exception $e ) {
                return new WP_Error( 'yaml_parse_error', $e->getMessage() );
            }
        }

        if ( class_exists( '\\Spyc' ) ) {
            return \Spyc::YAMLLoadString( $yaml );
        }

        $converted = $this->fallback_yaml_to_json( $yaml );

        if ( is_wp_error( $converted ) ) {
            return $converted;
        }

        $decoded = json_decode( $converted, true );

        if ( json_last_error() !== JSON_ERROR_NONE ) {
            return new WP_Error( 'yaml_parse_error', __( 'Unable to parse families file.', 'dinlogic-ai-order-widget' ) );
        }

        return $decoded;
    }

    protected function fallback_yaml_to_json( $yaml ) {
        $lines        = preg_split( '/\r?\n/', $yaml );
        $indent_stack = array( 0 );
        $json_lines   = array();
        $level        = 0;

        foreach ( $lines as $line ) {
            if ( '' === trim( $line ) || 0 === strpos( trim( $line ), '#' ) ) {
                continue;
            }

            preg_match( '/^(\s*)/', $line, $matches );
            $indent = strlen( $matches[0] );

            while ( $indent < end( $indent_stack ) ) {
                array_pop( $indent_stack );
                $level    = max( 0, $level - 1 );
                $json_lines[] = str_repeat( '  ', $level ) . '},';
            }

            if ( $indent > end( $indent_stack ) ) {
                $indent_stack[] = $indent;
                $json_lines[]   = str_repeat( '  ', $level ) . '{';
                $level++;
            }

            $parts = explode( ':', trim( $line ), 2 );

            if ( count( $parts ) < 2 ) {
                return new WP_Error( 'yaml_parse_error', __( 'Invalid YAML syntax.', 'dinlogic-ai-order-widget' ) );
            }

            $key   = trim( $parts[0] );
            $value = trim( $parts[1] );

            if ( '' === $value ) {
                $json_lines[]  = str_repeat( '  ', $level ) . sprintf( '"%s": {', $key );
                $indent_stack[] = $indent + 2;
                $level++;
                continue;
            }

            if ( in_array( $value, array( 'true', 'false' ), true ) ) {
                $encoded_value = $value;
            } elseif ( is_numeric( $value ) ) {
                $encoded_value = $value;
            } elseif ( 0 === strpos( $value, '[' ) || 0 === strpos( $value, '{' ) ) {
                $encoded_value = $value;
            } else {
                $encoded_value = wp_json_encode( $value );
            }

            $json_lines[] = str_repeat( '  ', $level ) . sprintf( '"%s": %s,', $key, $encoded_value );
        }

        while ( count( $indent_stack ) > 1 ) {
            array_pop( $indent_stack );
            $level    = max( 0, $level - 1 );
            $json_lines[] = str_repeat( '  ', $level ) . '},';
        }

        $json = '{' . rtrim( implode( '', $json_lines ), ',' ) . '}';

        return $json;
    }
}
