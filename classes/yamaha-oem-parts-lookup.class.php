<?php

namespace Epconline\YamahaOemPartsLookup;
use WC_AJAX;
/**
 * Created by JetBrains PhpStorm.
 * User: Russell Wyatt
 * Date: 15/05/16
 * Time: 11:14 AM
 * To change this template use File | Settings | File Templates.
 */


class YamahaOemPartsLookup
{
    var $tableName;
    var $pluginPath;
    var $currentVersion;
    var $numActions;
    function __construct()
    {
        global $wpdb;

        if( !function_exists('get_option') )
        {
            require_once('../../../wp-config.php');
        }

        $this->currentVersion = '1.3';
        $this->pluginPath = get_option('siteurl') . '/wp-content/plugins/yamaha-oem-parts-lookup/';

        $options = get_option('widgetYamahaOemPartsLookup');
        $options['version'] = $this->currentVersion;
        update_option('widgetYamahaOemPartsLookup', $options);

        add_action('wp_ajax_yamaha_oem_ajax_add_to_cart_woo', array( $this, 'yamaha_oem_ajax_add_to_cart_woo_callback'));
        add_action('wp_ajax_nopriv_yamaha_oem_ajax_add_to_cart_woo', array( $this, 'yamaha_oem_ajax_add_to_cart_woo_callback'));
//        add_filter( 'storefront_cart_link_fragment', 'storefront_cart_link_fragment_callback' );
        add_filter('woocommerce_add_to_cart_fragments', array( $this, 'yamaha_oem_cart_link_fragment_callback' ));

    }



    static function activate()
    {
        global $wpdb;
//            echo "plugin Activate callback<br/>";
        if( !function_exists('get_option') )
        {
            require_once('../../../wp-config.php');
        }

        $options = array();
        $options['title'] = 'Yamaha OEM Parts Lookup';

        if( !get_option('widgetYamahaOemPartsLookup') )
        {
            add_option('widgetYamahaOemPartsLookup', $options);
        }

// Database table stuff can go here

        update_option('widgetYamahaOemPartsLookup', $options);
        delete_option('widgetYamahaOemPartsLookup');
    }

    static function deactivate()
    {
        if( !function_exists('get_option') )
        {
            require_once('../../../wp-config.php');
        }
        delete_option('widgetYamahaOemPartsLookup');
    }



    function addHeaderContent()
    {
        global $wpdb;

        if( !function_exists('get_option') )
        {
            require_once('../../../wp-config.php');
        }
        //TODO: Put stuff in the header

    }



    function displayWidget($args)
    {
        extract($args);
        $options = get_option('widgetYamahaOemPartsLookup');
        $title = $options['title'];
        echo $before_widget . $before_title . $title . $after_title;

        echo "<div id=\"yamaha-oem-parts-lookup\" style=\"font-size:$fontsize$fontunit;\">\n";
        echo "Loading...\n";
        echo "</div>\n";
       // echo "<script type=\"text/javascript\">setTimeout(\"oemPartsLookup.oempartslookupInit()\", 2000)</script>\n";

        echo $after_widget;
    }

    function getActionCode($title=null)
    {
        $output =  "";

        $output .= $this->displayLookupForm();

        return $output;
    }

    function displayLookupForm () {
        //TODO: Put the display code here
        $output = '<div id="yamaha-oem-filterpanel">
            <div id="TypeSelection">
                <div>
                    <select id="TypeSelect" name="TypeSelect">
                    </select>
                </div>
                <div id="YearSelection">
                    <select id="YearSelect" name="YearSelect"></select>
                </div>
                <div id="ModelSelection">
                    <select id="ModelSelect" name="ModelSelect"></select>
                </div>
                <div id="ContentSelection">
                    <select id="ContentSelect" name="ContentSelect"></select>
                </div>
                <div id="AssemblySelection">
                    <select id="AssemblySelect" name="AssemblySelect"></select>
                </div>

            </div>

        </div>
        <div id="yamaha-oem-AssemblyContainer">
            <div id="Diagram">
                <div id="newCanvas" style="width:100%;height:auto;overflow:hidden;"></div>
            </div>
            <div id="PartsListContainer">
                <table id="PartsList">
                    <thead>
                    <tr>
                        <th class="refno">Ref No.</th>
                        <th>Desc</th>
                        <th>Number</th>
                        <th>Qty per Assembly</th>
                        <th>Qty to Order</th>
                        <th>Price</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
        <div id="yamaha-oem-imageWrap">
        </div>';

        return $output;
    }

    function yamaha_oem_ajax_add_to_cart_woo_callback() {
        ob_start();
        $post=get_page_by_title($_REQUEST['post_title'], 'ARRAY_N', 'product' );
        $price =  $_REQUEST['price'];

        if(!$post) {
            $my_post = array(
                'post_title'    => $_REQUEST['post_title'],
                'post_content'  => $_REQUEST['post_content'],
                'post_status'   => 'publish',
                'post_parent' => '',
                'post_type'     =>'product'
            );

            $wp_error = "";
            $product_ID = wp_insert_post( $my_post, $wp_error  );
            if ($wp_error != ''){
                echo($wp_error);
            }
            if ( $product_ID ){
//                echo "inserted post";
                update_post_meta( $product_ID, '_price', $price);
                update_post_meta( $product_ID, '_regular_price', $price ); // Update regular price
                wc_delete_product_transients( $product_ID ); // Update product cache

                add_post_meta($product_ID, '_stock_status', 'instock' );

                $term = get_term_by('id', get_option('yamaha_wc_category'), 'product_cat');
                wp_set_object_terms($product_ID, $term->term_id, 'product_cat');
                wp_set_object_terms($product_ID, array('Parts Shipping'), 'product_shipping_class');
            }
        } else {
            $product_ID=$post[0];
            update_post_meta( $product_ID, '_price', $price);
            update_post_meta( $product_ID, '_regular_price', $price ); // Update regular price
            wc_delete_product_transients( $product_ID ); // Update product cache

            add_post_meta($product_ID, '_stock_status', 'instock' );

            $term = get_term_by('id', get_option('yamaha_wc_category'), 'product_cat');
            wp_set_object_terms($product_ID, $term->term_id, 'product_cat');
            wp_set_object_terms($product_ID, array('Parts Shipping'), 'product_shipping_class');

        }
        //echo 'ProductID = ' . $product_ID;

        if ( $product_ID ) {
            if (!empty(WC()->cart)) {
                WC()->cart->add_to_cart($product_ID, $_REQUEST['quantity']);

                do_action( 'woocommerce_ajax_added_to_cart', $product_ID );

                // Return fragments
                WC_AJAX::get_refreshed_fragments();
            }
            else {
                echo 'Error with WC';
            }
        }
    }

    function yamaha_oem_cart_link_fragment_callback( $fragments ) {
        ob_start();
        ?>
        <a class="cart-contents" href="<?php echo wc_get_cart_url(); ?>" title="<?php _e( 'View your shopping cart' ); ?>"><?php echo sprintf (_n( '%d item', '%d items', WC()->cart->get_cart_contents_count() ), WC()->cart->get_cart_contents_count() ); ?> - <?php echo WC()->cart->get_cart_total(); ?></a>
        <?php

        $fragments['a.cart-contents'] = ob_get_clean();

        return $fragments;
    }


    function getYamahaOemPartsLookup() {

        global $wpdb;

//TODO: All this needs changing

        die(); // this is required to return a proper result
    }
}

//endif;

?>