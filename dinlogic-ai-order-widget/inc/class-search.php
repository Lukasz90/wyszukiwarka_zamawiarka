<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Dinlogic_AIW_Search {

    /**
     * Execute a combined SKU and name search.
     *
     * @param string $query
     * @param int    $page
     * @param int    $per_page
     *
     * @return array
     */
    public function search( $query, $page = 1, $per_page = 10 ) {
        $query    = trim( wp_unslash( (string) $query ) );
        $page     = max( 1, absint( $page ) );
        $per_page = max( 1, absint( $per_page ) );

        if ( '' === $query ) {
            return array();
        }

        $ids = array_unique( array_merge( $this->search_by_sku( $query ), $this->search_by_name( $query ) ) );

        if ( empty( $ids ) ) {
            return array();
        }

        $offset = ( $page - 1 ) * $per_page;
        $ids    = array_slice( $ids, $offset, $per_page );

        return array_values( array_filter( array_map( array( $this, 'format_product' ), $ids ) ) );
    }

    private function search_by_sku( $query ) {
        global $wpdb;

        $like = '%' . $wpdb->esc_like( $query ) . '%';

        $sql = $wpdb->prepare(
            "SELECT DISTINCT p.ID
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE p.post_type = 'product' AND p.post_status = 'publish'
            AND pm.meta_key = '_sku' AND pm.meta_value LIKE %s
            ORDER BY p.post_date DESC
            LIMIT 50",
            $like
        );

        return array_map( 'intval', $wpdb->get_col( $sql ) );
    }

    private function search_by_name( $query ) {
        $args  = array(
            'post_type'      => array( 'product' ),
            'post_status'    => array( 'publish' ),
            's'              => $query,
            'posts_per_page' => 50,
            'fields'         => 'ids',
        );
        $query = new WP_Query( $args );

        return array_map( 'intval', $query->posts );
    }

    private function format_product( $product_id ) {
        $product = wc_get_product( $product_id );

        if ( ! $product ) {
            return null;
        }

        $attributes = array();
        foreach ( $product->get_attributes() as $attribute ) {
            $name   = wc_attribute_label( $attribute->get_name() );
            $values = array();

            if ( $attribute->is_taxonomy() ) {
                $values = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'names' ) );
            } else {
                $values = $attribute->get_options();
            }

            $attributes[] = array(
                'name'  => $name,
                'value' => implode( ', ', array_map( 'wc_clean', $values ) ),
            );
        }

        $image_id = $product->get_image_id();
        $thumb    = $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : wc_placeholder_img_src();

        $price = $product->get_price();
        $price = is_numeric( $price ) ? (float) $price : null;

        return array(
            'id'           => $product->get_id(),
            'name'         => $product->get_name(),
            'sku'          => $product->get_sku(),
            'price'        => $price,
            'unit'         => 'pcs',
            'stock_status' => $product->get_stock_status(),
            'thumb'        => $thumb,
            'attributes'   => $attributes,
            'is_variable'  => $product->is_type( 'variable' ),
        );
    }
}
