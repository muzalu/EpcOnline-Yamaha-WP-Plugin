<?php

namespace Epconline\YamahaOemPartsLookup;
    /**
     * Created by JetBrains PhpStorm.
     * User: Russell Wyatt
     * Date: 15/05/16
     * Time: 11:15 AM
     * To change this template use File | Settings | File Templates.
     */


class YamahaOemPartsLookupManagement

{
    var $pluginPath;
    var $pluginFile;
    var $tableName;
    var $numActions;

    function __construct()
    {
        //echo "Initialising OemPartsLookupManagement Object<br/>";
        global $wpdb;
        if( !function_exists('get_option') )
        {
            require_once('../../../wp-config.php');
        }

        $this->pluginPath = get_option('siteurl') . '/wp-content/plugins/yamaha-oem-parts-lookup/';
        $this->pluginFile = $this->pluginPath . 'yamaha-oem-parts-lookup.php';
    }

    function ajaxDelete()
    {
        global $wpdb;

//TODO: Review, probably don't need this


        exit();
    }

    function displayManagementPage()
    {
        global $wpdb;
        echo "\t\t<div class=\"wrap\">\n";
        echo "\t\t</div>\n";
    }

    function getProductCategories( $selectedCategory)
    {
        $taxonomy     = 'product_cat';
        $orderby      = 'name';
        $show_count   = 0;      // 1 for yes, 0 for no
        $pad_counts   = 0;      // 1 for yes, 0 for no
        $hierarchical = 1;      // 1 for yes, 0 for no
        $title        = '';
        $empty        = 0;

        $args = array(
            'taxonomy'     => $taxonomy,
            'orderby'      => $orderby,
            'show_count'   => $show_count,
            'pad_counts'   => $pad_counts,
            'hierarchical' => $hierarchical,
            'title_li'     => $title,
            'hide_empty'   => $empty
        );
        $all_categories = get_categories( $args );
        foreach ($all_categories as $cat) {
            if($cat->category_parent == 0) {
                $category_id = $cat->term_id;
                $selected = ($category_id == $selectedCategory) ? "selected" : "";
                echo '<option value="'. $category_id.'"'.  $selected.'>'. $cat->name .'</option>';

                $args2 = array(
                    'taxonomy'     => $taxonomy,
                    'child_of'     => 0,
                    'parent'       => $category_id,
                    'orderby'      => $orderby,
                    'show_count'   => $show_count,
                    'pad_counts'   => $pad_counts,
                    'hierarchical' => $hierarchical,
                    'title_li'     => $title,
                    'hide_empty'   => $empty
                );
                $sub_cats = get_categories( $args2 );
                if($sub_cats) {
                    foreach($sub_cats as $sub_category) {
                        echo  $sub_category->name ;
                    }
                }
            }
        }
    }

    function displayOptionsPage()
    {
        if($_POST['action'] == 'update'){
            update_option('yamaha_dealer_id', $_POST['yamaha_dealer_id'] );
            update_option('yamaha_products', $_POST['yamaha_products'] );
            update_option('yamaha_wc_category', $_POST['yamaha_wc_category']);
            update_option('yamaha_margin_ma', $_POST['yamaha_margin_ma']);
            update_option('yamaha_margin_mb', $_POST['yamaha_margin_mb']);
            update_option('yamaha_include_gst', $_POST['yamaha_include_gst']);
            update_option('custom_contact_link', $_POST['custom_contact_link']);
            update_option('custom_contact_new_page', $_POST['custom_contact_new_page']);
            update_option('text_color', $_POST['text_color']);
            update_option('text_color_highlight', $_POST['text_color_highlight']);
            update_option('background_color', $_POST['background_color']);
            update_option('background_color_highlight', $_POST['background_color_highlight']);
            update_option('show_marine_years', $_POST['show_marine_years']);

            ?><div class="updated"><p><strong><?php _e('Options saved.', 'eg_trans_domain' ); ?></strong></p></div><?php
        }
        ?>

        <div class="wrap">
            <h2>Yamaha OEM Parts Lookup Options</h2>

            <form method="post">
                <?php wp_nonce_field('yamaha-nonce'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Dealer Id</th>
                        <td><input type="text" name="yamaha_dealer_id" value="<?php echo get_option('yamaha_dealer_id'); ?>" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Products Selected</th>
                        <td><input type="text" name="yamaha_products" value="<?php echo get_option('yamaha_products'); ?>" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">WooCommerce Category</th>
                        <td>
                            <select name="yamaha_wc_category">
                                <option value="-1">Please select...</option>
                            <?php $this->getProductCategories(get_option('yamaha_wc_category')); ?>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Add To Cart - Update Elements (comma separated)</th>
                        <td><input type="text" name="yamaha_update_add_to_cart_elements" value="<?php echo get_option('yamaha_update_add_to_cart_elements'); ?>" /></td>
                    </tr>

                    <tr valign="top">
                        <th scope="row">Margin for Motorcycle Parts</th>
                        <td>
                            <input type="number" name="yamaha_margin_mb" value="<?php echo get_option('yamaha_margin_mb'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Margin for Marine</th>
                        <td>
                            <input type="number" name="yamaha_margin_ma" value="<?php echo get_option('yamaha_margin_ma'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Include GST @ 10%</th>
                        <td>
                                <input type="checkbox" name="yamaha_include_gst" value="1" <?php if (get_option('yamaha_include_gst')) echo "checked=\"checked\"" ?> />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Custom Contact Link</th>
                        <td>
                            <input type="text" name="custom_contact_link" value="<?php echo get_option('custom_contact_link'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Open Contact in New Page</th>
                        <td>
                            <input type="checkbox" name="custom_contact_new_page" value="1" <?php if (get_option('custom_contact_new_page')) echo "checked=\"checked\"" ?> />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Text Colour</th>
                        <td>
                            <input type="text" name="text_color" value="<?php echo get_option('text_color'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Text Colour Highlight</th>
                        <td>
                            <input type="text" name="text_color_highlight" value="<?php echo get_option('text_color_highlight'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Background Colour</th>
                        <td>
                            <input type="text" name="background_color" value="<?php echo get_option('background_color'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Background Colour Highlight</th>
                        <td>
                            <input type="text" name="background_color_highlight" value="<?php echo get_option('background_color_highlight'); ?>" />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Show Marine Years</th>
                        <td>
                            <input type="checkbox" name="show_marine_years" value="1" <?php if (get_option('show_marine_years')) echo "checked=\"checked\"" ?>" />
                        </td>
                    </tr>
                </table>

                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="page_options" value="yamaha_dealer_id,yamaha_products,yamaha_wc_category,yamaha_margin_mb,yamaha_margin_ma,yamaha_include_gst,custom_contact_link,custom_contact_new_page,text_color,text_color_highlight,background_color,background_color_highlight,show_marine_years" />
                <input type="submit" name="Submit" value="<?php _e('Save Changes') ?>" />
            </form>
        </div>
    <?php
    }

    function displayWidgetControl()
    {
        $options = get_option('widgetYamahaOemPartsLookup');

        if ( !is_array($options) ){
            $options = array();
            $options['title'] = 'Yamaha OEM Parts Lookup';
        }

        if ( $_POST['oempartslookup-submit'] && check_admin_referer('yamaha-nonce')) {

            //TODO: Look at this
            print_r($options);
       //     $options['title'] = strip_tags(stripslashes($_POST['yamahaoempartslookup-title']));
            update_option('widgetYamahaOemPartsLookup', $options);
        }

    //    $title = htmlspecialchars($options['title'], ENT_QUOTES);

      //  echo '<p><label for="actionfeed-title">Title: <input style="width: 200px;" id="statecutsstats-title" name="statecutsstats-title" type="text" value="'.$title.'" /></label></p>';
        echo '<input type="hidden" id="oempartslookup-submit" name="oempartslookup-submit" value="1" />';
        wp_nonce_field('yamaha-nonce');

    }
}

