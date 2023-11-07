<?php

namespace Epconline\YamahaOemPartsLookup;

/**
Plugin Name: Yamaha OEM Parts Lookup
Plugin URI: https://epconline.com.au/wp-plugins/Yamaha_OEM_Parts_Lookup
Description: Display Yamaha OEM Parts Lookup
Version: 1.86
Author: Russell Wyatt
Author URI: https://epconline.com.au/

 */

define(__NAMESPACE__ . '\NS', __NAMESPACE__ . '\\');
//require_once('inc/config.php');


require_once('classes/yamaha-oem-parts-lookup.class.php');
require_once('classes/yamaha-oem-parts-lookup-management.class.php');

if( class_exists(NS.'YamahaOemPartsLookup') && class_exists(NS.'YamahaOemPartsLookupManagement') ) :
    $yamahaOemPartsLookup = new \Epconline\YamahaOemPartsLookup\YamahaOemPartsLookup();
    $yamahaOemPartsLookupManagement = new \Epconline\YamahaOemPartsLookup\YamahaOemPartsLookupManagement();

    if( isset($yamahaOemPartsLookup) && isset($yamahaOemPartsLookupManagement) )
    {
        function widgetInit()
        {
            global $yamahaOemPartsLookup, $yamahaOemPartsLookupManagement;

            if( !function_exists('wp_register_sidebar_widget') )
            {
                return;
            }

//            register_sidebar_widget('Action', array(&$actionFeed, 'displayWidget'));

//            register_widget_control('Action', array(&$actionFeedManagement, 'displayWidgetControl'), 375, 200);

            wp_register_sidebar_widget(
                'yamaha-oem-parts-lookup',        // your unique widget id
                'Yamaha OEM Parts Lookup',          // widget name
                array(&$yamahaOemPartsLookup, 'displayWidget'),
                array(                  // options
                    'description' => 'Provide Lookup facilities for Yamaha OEM Parts'
                )
            );

            wp_register_widget_control(
                'yamaha-oem-parts-lookup',
                'yamaha-oem-parts-lookup',
                array(&$yamahaOemPartsLookupManagement, 'displayWidgetControl')
            );
        }

        function managementInit()
        {
            global $yamahaOemPartsLookupManagement;
           // add_management_page('Yamaha OEM Parts Lookup', 'Yamaha OEM Parts Lookup', 5, basename(__FILE__), array(&$oemPartsLookupManagement, 'displayManagementPage'));
            add_options_page('Yamaha OEM Parts Lookup Options', 'Yamaha OEM Parts Lookup', 10, basename(__FILE__), array(&$yamahaOemPartsLookupManagement, 'displayOptionsPage'));
        }


        function script_enqueuer()
        {
//            wp_deregister_script('modernizr');
//            wp_register_script( 'modernizr', WP_PLUGIN_URL.'/yamaha-oem-parts-lookup/js/libs/modernizr-1.7.min.js', false, 'null', false);
//            wp_enqueue_script( 'modernizr');
//
            wp_deregister_script( 'jquery' );
            wp_register_script( 'jquery', 'https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', false, '1.10.2', false);
            wp_enqueue_script( 'jquery');

            wp_deregister_script( 'jquery-ui' );
            wp_register_script( 'jquery-ui', 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js', false, '1.11.4', false);
            wp_enqueue_script( 'jquery-ui');

            wp_deregister_script( 'yamaha-leaflet' );
            wp_register_script( 'yamaha-leaflet', plugins_url().'/yamaha-oem-parts-lookup/js/libs/leaflet.js', false, '1.9.4', false);
            wp_enqueue_script( 'yamaha-leaflet');

            wp_deregister_script( 'yamaha-img-viewer' );
            wp_register_script( 'yamaha-img-viewer', plugins_url().'/yamaha-oem-parts-lookup/js/libs/imgViewer2.min.js', false, '2.2.1', false);
            wp_enqueue_script( 'yamaha-img-viewer');

            wp_deregister_script( 'yamaha-cookies' );
            wp_register_script( 'yamaha-cookies', plugins_url().'/yamaha-oem-parts-lookup/js/libs/jquery.cookies.2.2.0.min.js', false, '2.2.0', false);
            wp_enqueue_script( 'yamaha-cookies');

            wp_deregister_script( 'yamaha-plugins' );
            wp_register_script( 'yamaha-plugins', plugins_url().'/yamaha-oem-parts-lookup/js/plugins.js', false, null, false);
            wp_enqueue_script( 'yamaha-plugins');

            wp_deregister_script( 'yamaha-basictable' );
            wp_register_script( 'yamaha-basictable', plugins_url().'/yamaha-oem-parts-lookup/js/libs/jquery.basictable.min.js', array('jquery'), null, false);
            wp_enqueue_script( 'yamaha-basictable');

            $accessKey = getAccessKey();

            wp_register_script( 'yamaha-oem-parts-lookup', plugins_url().'/yamaha-oem-parts-lookup/js/yamaha-oem-parts-lookup.js', array('jquery') );
            wp_localize_script( 'yamaha-oem-parts-lookup', 'ypicAjax', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ),
                'homeurl' => home_url(),
                'accesskey' => esc_attr($accessKey),
                'ypicproducttypes' => esc_attr(get_option('yamaha_products')),
                'ypicsetting_ma' => esc_attr(get_option('yamaha_margin_ma')),
                'ypicsetting_mb' => esc_attr(get_option('yamaha_margin_mb')),
                'ypicsetting_gst' => esc_attr(get_option('yamaha_include_gst')),
                'customcontactlink' => esc_attr(get_option('custom_contact_link')),
                'customcontactnewpage' => esc_attr(get_option('custom_contact_new_page')),
                'text_color' => esc_attr(get_option('text_color')),
                'text_color_highlight' => esc_attr(get_option('text_color_highlight')),
                'background_color' => esc_attr(get_option('background_color')),
                'background_color_highlight' => esc_attr(get_option('background_color_highlight')),
            ));
            wp_enqueue_script( 'yamaha-oem-parts-lookup' );

            wp_register_style('yamaha-oem-parts-lookup-style', plugins_url().'/yamaha-oem-parts-lookup/styles/yamaha.css');
            wp_enqueue_style('yamaha-oem-parts-lookup-style');
            wp_register_style('basictablestyle', plugins_url().'/yamaha-oem-parts-lookup/styles/libs/basictable.css');
            wp_enqueue_style('basictablestyle');
            wp_register_style('leaflet-style', plugins_url().'/yamaha-oem-parts-lookup/styles/libs/leaflet.css');
            wp_enqueue_style('leaflet-style');
            wp_register_style('imgViewer2-style', plugins_url().'/yamaha-oem-parts-lookup/styles/libs/imgViewer2.min.css');
            wp_enqueue_style('imgViewer2-style');

        }

        function getAccessKey()
        {
            // Make call to Dealer Admin site to check subscription
            $_dealer_key = get_option('yamaha_dealer_id');
            $_product_key_yamaha = '324d31df-d5ab-4449-85a7-43e5a97c3e28';

            // Dealer Key first, then product key
            $access_url = "https://adminapi.epconline.com.au/Subscription/AccessKey/{$_dealer_key}/{$_product_key_yamaha}/";

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $access_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            $buffer = curl_exec($ch);
            curl_close($ch);

            return str_replace('"', '', $buffer);
        }

//        function setAccessCookie()
//        {
//            // Make call to Dealer Admin site to check subscription
//            $_dealer_key = get_option('yamaha_dealer_id');
//            $_product_key_yamaha = '324d31df-d5ab-4449-85a7-43e5a97c3e28';
//            $_configured_product_types = get_option('yamaha_products');
//            $_yamaha_margin_ma = get_option('yamaha_margin_ma');
//            $_yamaha_margin_mb = get_option('yamaha_margin_mb');
//
//// Dealer Key first, then product key
//            $access_url = "https://adminapi.epconline.com.au/Subscription/AccessKey/{$_dealer_key}/{$_product_key_yamaha}/";
//            $ch=curl_init();
//            curl_setopt($ch,CURLOPT_URL,$access_url);
//            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
//            $buffer = curl_exec($ch);
//            curl_close($ch);
//
//            $accessKey = str_replace('"', '',$buffer);
//            setcookie("accesskey[yamaha]", FALSE);
//            setcookie("epcconfig[yamaha]", FALSE);
//
//            setcookie("accesskey[yamaha]", $accessKey);
//            setcookie("epcconfig[yamaha]", $_configured_product_types);
//            setcookie( "epcsetting_ma[yamaha]", $_yamaha_margin_ma);
//            setcookie( "epcsetting_mb[yamaha]", $_yamaha_margin_mb);
//        }
        // [actionFeed [title=""] [delay=""] [fade=""] [actionstodisplay=""]

        function yamahaOemPartsLookup_func($atts) {
            global $yamahaOemPartsLookup;

         //   extract( shortcode_atts( array(), $atts ) );

            return $yamahaOemPartsLookup->getActionCode();
        }

        // ajax handler
        function ajax_oem_parts_lookup_callback() {
            global $yamahaOemPartsLookup;

//            if ( !wp_verify_nonce( $_REQUEST['nonce'], "ajax_action_feed_nonce")) {

//                exit("No naughty business please");

//            }
            return $yamahaOemPartsLookup->getAjaxOemPartsLookup();
        }

        add_shortcode('yamahaOemPartsLookup', NS.'yamahaOemPartsLookup_func');
        register_activation_hook( __FILE__, array(&$yamahaOemPartsLookup, 'activate') );
        register_deactivation_hook( __FILE__, array(&$yamahaOemPartsLookup, 'deactivate'));
        add_action('admin_menu', NS.'managementInit');
//        add_action('admin_init', NS.'settings_api_init' );
        add_action('plugins_loaded', NS.'widgetInit');
        if (!is_admin()) {
            add_action('init', NS . 'script_enqueuer');
            //add_action('init', NS . 'setAccessCookie');
            add_action('wp_head', array(&$yamahaOemPartsLookup, 'addHeaderContent'));
        }
    }

endif;
?>