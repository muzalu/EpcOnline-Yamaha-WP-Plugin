/***
 * Javascript file to handle interaction with yamaha EPC Online 
 * This sample code is supplied as is to give basic functionality
 * of an online parts browser including a hotspotted parts diagram
 * 
 * Copyright (C) 2019 by K & K Computech

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
var DealerID='';
var _domain = 'ypicweb.epconline.com.au';
var _yourdomain = '';


var gCanvas = null; // the canvas
var gContext = null;    // the context
var gMrkp = 10;

var canvasMinX = 0, canvasMinY = 0;
var _offsetX = 0, _offsetY = 0, _mouseX, _mouseY, _mouseDownX, _mouseDownY, _mouseMoveX, _mouseMoveY;
var _imagePosX, _imagePosY;
var _scalefactor = 2;
var _scalefactor_zoomin = 2;
var _scalefactor_zoomout = 2;
var _hitTolerance = 50;
var zoom, zoomIn, zoomOut, mousePosX, mousePosY, paint;

var _canvasWidth = 920; // gContext.canvas.width;
var _canvasHeight = 565; // gContext.canvas.height;
var _centreX = _canvasWidth / 2;
var _centreY = _canvasHeight / 2;

var _hotspots = Array();

$(document).ready(function () {
    _yourdomain = myAjax.homeurl;
    init();
    init_mouse();
});

$(document).ajaxStart(function() {

    $('#loading-image_ajax').show(); // show the gif image when ajax starts

}).ajaxStop(function() {

    $('#loading-image_ajax').hide(); // hide the gif image when ajax completes

});

// contains function
function contains(arr, findValue) {
    var i = arr.length;

    while (i--) {
        if (arr[i] === findValue) return true;
    }
    return false;
}

/***
 * init function
 * Call this first to set things up
 */
function init() {

    // hide the parts list

    //$('#PartsListContainer').hide();

    DealerID = myAjax.accesskey;
    var ConfiguredProductTypes =  myAjax.producttypes;

    var setting_ma = myAjax.epcsetting_ma;
    var setting_mb = myAjax.epcsetting_mb;

    ConfiguredProductTypes += '';
    var arrCfg = ConfiguredProductTypes.split(",");
    if (arrCfg.length > 1) {
        $('#yamaha-oem-filterpanel #TypeSelect option').remove();

        $('<option value="-1">Please select a Type</option>')

            .appendTo('#yamaha-oem-filterpanel #TypeSelect');

        if (contains(arrCfg, "MA")) {
            $('<option value="MA">Marine</option>')
                .appendTo('#yamaha-oem-filterpanel #TypeSelect');
        }

        if (contains(arrCfg, "MB")) {
            $('<option value="MB">Motorcycle</option>')
                .appendTo('#yamaha-oem-filterpanel #TypeSelect');
        }

        if (contains(arrCfg, "WV")) {
            $('<option value="WV">Water Vehicles</option>')
                .appendTo('#yamaha-oem-filterpanel #TypeSelect');
        }
    }
    else {
        $('#yamaha-oem-filterpanel #TypeSelect').remove();

        $('<input id="TypeSelect" type="hidden" />')
            .val(arrCfg[0])
            .appendTo('#yamaha-oem-filterpanel #TypeSelection');
        var selectedType = arrCfg[0];
        $('#yamaha-oem-filterpanel #TypeSelect').hide();

        switch(selectedType) {
            case 'MA':
                gMrkp = setting_ma;
                break;
            case 'MB':
			case 'WV':
                gMrkp = setting_mb;
                break;
            default:
                gMrkp = 10;
        }

        if (selectedType == 'MA') {
            $('#yamaha-oem-filterpanel #YearSelection').hide();
            getModels(selectedType);
        } else {
            getYears(selectedType);
        }
    }
    $('#status').hide();

    _scalefactor = 2;



    // handle click from Type Selection

    $('#yamaha-oem-filterpanel #TypeSelect').change(function () {
        var selectedType = $(this).val();

        switch(selectedType) {
            case 'MA':
                gMrkp = setting_ma;
                break;
            case 'MB':
			case 'WV':
                gMrkp = setting_mb;
                break;
            default:
                gMrkp = 10;
        }

        //document.getElementById('wrapper').style.display='block';
        if (selectedType != "MA") {
            $('#yamaha-oem-filterpanel #YearSelection').show();
            getYears(selectedType);
        } else {
            $('#yamaha-oem-filterpanel #YearSelection').hide();
            getModels(selectedType);
        }
    });
    var leftButtonDown = false;
    $("#imageCanvas").mousedown(function (e) {
        // Left mouse button was pressed, set flag
        if (e.which === 1) leftButtonDown = true;
    });
    $("#imageCanvas").mouseup(function (e) {
        // Left mouse button was released, clear flag
        if (e.which === 1) leftButtonDown = false;
    });
    $('#imageCanvas').mousedown(function (e) {
        _mouseDownX = mousePosX(e);
        _mouseDownY = mousePosY(e);

        _mouseMoveX = _mouseDownX;
        _mouseMoveY = _mouseDownY;

        // calculate position on image
         _imagePosX = _mouseMoveX - _offsetX;
       _imagePosY = _mouseMoveY - _offsetY;
        $('#status').html('_mouseDownX:' + _mouseDownX + ', _mouseDownY:' + _mouseDownY);
    });

    $('#imageCanvas').mouseover(function (e) {
        $('#imageCanvas').css('cursor', 'move');
    }).mouseout(function (e) {
        $('#imageCanvas').css('cursor', 'default');
    });

    function tweakMouseMoveEvent(e) {
        // Check from jQuery UI for IE versions < 9
        //
        //        if ($.browser.msie && !(document.documentMode >= 9) && !event.button) {
        //
        //           // leftButtonDown = false;
        //
        //        }

        // If left button is not set, set which to 0
        // This indicates no buttons pressed
        if (e.which === 1 && !leftButtonDown) e.which = 0;
    }

    $('#imageCanvas').mousemove(function (e) {
        // Call the tweak function to check for LMB and set correct e.which
        tweakMouseMoveEvent(e);
        _mouseX = mousePosX(e);
        _mouseY = mousePosY(e);

        if (leftButtonDown) {
            var newOffsetX = _offsetX + ((_mouseX - _mouseMoveX) * _scalefactor);
            var newOffsetY = _offsetY + ((_mouseY - _mouseMoveY) * _scalefactor);

            _mouseMoveX = _mouseX;
            _mouseMoveY = _mouseY;
            _offsetX = newOffsetX;
            _offsetY = newOffsetY;

            $('#status').html("'Left Mouse Down- _offsetX : " + newOffsetX + "_offsetY : " + newOffsetY);

            paint();
        }
        else {
            // calculate position on image
            _imagePosX = _mouseX * _scalefactor - _offsetX;
            _imagePosY = _mouseY * _scalefactor - _offsetY;
            $('#status').html(_mouseX + ', ' + _mouseY);

            // perform hit test
            var arLen = _hotspots.length;
            var gotone = false;

            for (var i = 0, len = arLen; i < len; ++i) {
                if (((_hotspots[i].RefX >= _imagePosX - _hitTolerance) && (_hotspots[i].RefX <= _imagePosX + _hitTolerance))
                    && ((_hotspots[i].RefY >= _imagePosY - _hitTolerance) && (_hotspots[i].RefY <= _imagePosY + _hitTolerance))) {
                    // popup part info
                    gotone = true;
                    $('#imageCanvas').css('cursor', 'default');

                    showInfoPopup(_hotspots[i]);
                    highlightPartRow(_hotspots[i]);
                    break;
                }
            }

            if (gotone == false) {
                $('#imageCanvas').css('cursor', 'move');
                hideInfoPopup();
                unhighlightPartRow();
            }
        }
    });

    $(document).on('mouseover', 'tr.partrow', function () {
        // get partid
        var partid = $(this).parent().attr("data-partid");

        // index into hotspots array
        var arrlen = _hotspots.length;
        for (var i = 0; i < arrlen; i++) {
            if (_hotspots[i].PartID == partid) {
                // have found the part info here
                //focusHotspot(_hotspots[i].RefX, _hotspots[i].RefY);
                break;
            }
        }
        // $('#status').html("PartID : " + partid);
        // hilight this row

        $(this).css('background-color', '#fff');
    }).on('mouseout', 'tr.partrow', function () {
            $(this).css('background-color', 'transparent');
        });
    $("#zoomIn").click(function () {
        zoomIn();
    });
    $("#zoomOut").click(function () {
        zoomOut();
    });

    $(document).on('change', 'input[type="text"].qtyTextbox', function () {
        var newqty = $(this).val();
        $(this).parent().parent().attr('data-orderqty', newqty);
    });
    // This function handles the 'Add to cart' button
    // You can extend this to pass info to the shopping cart
    $(document).on('click', 'input[type="button"].btnAddToCart', function (e) {
        e.preventDefault();
        var $thisbutton = $(this);
        var partid = jQuery(this).attr('data-partid');
        var partinfo = jQuery(this).parent().parent().attr('data-partno');
        var quantity = jQuery(this).parent().parent().attr('data-orderqty');
        var weight =  jQuery(this).parent().parent().attr('data-weight');
        var volume =  jQuery(this).parent().parent().attr('data-volume');
        var length =  jQuery(this).parent().parent().attr('data-length');
        var height =  jQuery(this).parent().parent().attr('data-height');
        var width =  jQuery(this).parent().parent().attr('data-width');
        var dangerousgoodsclass =  jQuery(this).parent().parent().attr('data-dangerousgoodsclass');
        var dangerousgoodscode =  jQuery(this).parent().parent().attr('data-dangerousgoodscode');
        var detail=jQuery(this).parent().parent().attr('data-descrp');
        var listprice=jQuery(this).parent().parent().attr('data-price');
        var title=partinfo+'-'+detail;
        var price = parseFloat(listprice).toFixed(2);

        //show the loading icon, hide button.
        var button_id = '#btnAdd_'+partid;
        var loading_id = '#loadingAdd_'+partid;
        var success_id = '#successAdd_'+partid;
        $(button_id).hide();
        $(loading_id).show();

        javascript: jQuery.ajax({
            url: myAjax.ajaxurl,
            data:{
                action: 'yamaha_oem_ajax_add_to_cart_woo',
                post_title:title,
                post_content:detail,
                price:price,
                quantity:quantity,
                weight:weight,
                volume:volume,
                length:length,
                width:width,
                height:height,
                dangerousgoodsclass:dangerousgoodsclass,
                dangerousgoodscode:dangerousgoodscode
            },
            success:function (response) {
               jQuery(".fr-loading").hide();
	           if(response=='fail') {
                    alert("Error, Please Try Again");
               } else {
    	            jQuery(".orb_custom").html(response);
                    // Trigger event so themes can refresh other areas.
                    $( document.body ).trigger( 'added_to_cart', [ response.fragments, response.cart_hash, $thisbutton ] );

                    $(".widget_shopping_cart_content").empty();
                    $(".widget_shopping_cart_content").append(response.fragments["div.widget_shopping_cart_content"]);
                   // $(".widget_shopping_cart_content").hide();
                    //show the button, hide loading icon.
                    $(loading_id).hide();
                    $(success_id).show();

                    setTimeout(function(){
                        $(success_id).hide();
                    }, 3000);

                    setTimeout(function(){

                        $(button_id).show();
                    }, 3001);
               }
          }});
    });

    $(document).on('keyup', '#PartNumber', function () {
        if ($('#PartNumber').val().length < 8) {
            $("#btnSearch").attr("disabled", "disabled");
        } else {
            $("#btnSearch").removeAttr("disabled");
        }
    });
    $(document).on('click', '#btnSearch', function () {
        var searchString = $('#PartNumber').val();
        $.getJSON(
            'https://' + _domain + '/Part/getAjaxPartSearch/' + searchString + '/' + DealerID + '?callback=?',
            function (data) {
                $('#SearchPartsList tbody tr').remove();
                $.each(data, function(i, item) {
                    var partId = item.PartID;
                    // put the item in the hotspot array
                    _hotspots.push(item);
                    // handle supersessioned parts - Display Supersession part no and Price
                    var PartNoCell;
                    var itemPrice = 0.00;
                    var itemPartID = "";
                    if (item.SsPartNo != null) {
                        PartNoCell = "<td class=\"supersession\">" + item.SsPartNo + "</td>";
                        itemPrice = item.SsPrice;
                        itemPartID = item.SsPartNo;
                    } else {
                        PartNoCell = "<td>" + item.PartNo + "</td>";
                        itemPrice = item.Price;
                        itemPartID = item.PartNo;
                    }

                    itemPrice = (itemPrice * (1 + gMrkp / 100)).toFixed(2);

                    if (itemPrice > 0) {
                        clm = '<td class="addToCart"><input type="button" id="btnAdd_' + item.PartID + '" data-partid="' + item.PartID + '" data-partno="' + itemPartID + '" class="productContentfooterLeft btnAddToCart" value="Add to Cart" style="display: none;"/></td>';
                    } else {
                        /*clm ='<td><input type="button" value="Contact store" rel="facebox" class="contactstore" id="btn_' + item.PartID + '_'+item.Description+'" /></td>';*/
                        clm = '<td><a href="contact_store.php?desc=' + item.Description + '&product_id=' + item.PartID + ' " class="contactstore" >Contact Store</a></td>';
                    }

                    $('<tr id="part_' + item.PartID + '" class="partrow"></tr>')
                        .append('<td class="refCol"><input  id="chk_' + item.PartID + '" type="hidden"></input>'+ item.Model+'</td><td>'+ item.AssemblyName+'</td><td>' + item.RefNo + '</td><td class="text descCol">' + item.Description + '</td><td class="text remarkCol">' + item.Remark + '</td>' + PartNoCell + '<td class="numberCol">' + item.Quantity + '</td><td><input name="qty_' + item.PartID + '" id="qty_' + item.PartID + '" type="text" class="qtyTextbox"  value="1"/></td><td>' + itemPrice + '</td>')
                        .append(clm)
                        .attr('data-partid', item.PartID)
                        .attr('data-partno', itemPartID)
                        .attr('data-quantity', item.Quantity)
                        .attr('data-orderqty', 1)
                        .attr('data-price', itemPrice)
                        .attr('data-refno', item.RefNo)
                        .attr('data-sspartno', item.SsPartNo)
                        .attr('data-descrp', item.Description)
                        .attr('data-remark', item.Remark)
                        .attr('data-notforsale', item.Discontinued)
                        .attr('data-weight', item.Weight)
                        .attr('data-volume', item.Volume)
                        .attr('data-dangerousgoodsclass', item.DangerousGoodsClass)
                        .attr('data-dangerousgoodscode', item.DangerousGoodsCode)
                        .attr('data-length', item.Length)
                        .attr('data-width', item.Width)
                        .attr('data-height', item.Height)
                        .appendTo('#SearchPartsList tbody');
                });

                $('#SearchPartsList tr:odd').addClass('odd');
                $('#PartSearchResultsContainer').fadeIn();
            });
    });

    gImage = new Image();
    if (document.getElementById('imageCanvas') != null) {
        gCanvas = document.getElementById('imageCanvas');
        gContext = gCanvas.getContext('2d');

        _canvasWidth = gCanvas.width;
        _canvasHeight = gCanvas.height;
    }
}

function init_mouse() {
    if ($('#imageCanvas').offset() != null) {
        canvasMinX = $('#imageCanvas').offset().left;
        canvasMinY = $('#imageCanvas').offset().top;
    }
    _centreX = _canvasWidth / 2;
    _centreY = _canvasHeight / 2;
}

function mousePosX(event) {
    // Get the mouse position relative to the canvas element.
    var x = 0;
    if (event.pageX || event.pageX === 0) { // Firefox
        x = event.pageX - canvasMinX;
    } else if (event.offsetX || event.offsetX === 0) { // Opera
        x = event.offsetX;
    }
    return x;
};


function mousePosY(event) {
    var y = 0;
    if (event.pageY || event.pagerY === 0) { // Firefox
        y = event.pageY - canvasMinY;
    } else if (event.offsetY || event.offsetY === 0) { // Opera
        y = event.offsetY;
    }
    return y;
};

function paint() {
    var newWidth = _canvasWidth * (1 / _scalefactor);
    var newHeight = _canvasHeight * (1 / _scalefactor);
    if (document.getElementById('imageCanvas') != null)
        gCanvas = document.getElementById('imageCanvas');
    gContext = gCanvas.getContext('2d');
    gContext.save();

    //gContext.translate(-((newWidth - _canvasWidth) / 2), -((newHeight - _canvasHeight) / 2));
    //gContext.scale(1 / _scalefactor, 1 / _scalefactor);
    if (_scalefactor <= 0) {
        _scalefactor = 0.5;
        gContext.scale(1 / _scalefactor, 1 / _scalefactor);
    }
    else {
        gContext.scale(1 / _scalefactor, 1 / _scalefactor);
    }
    gContext.fillStyle = gContext.strokeStyle = "#fff";
    //
    // Clear
    //
    gContext.clearRect(0, 0, _canvasWidth * _scalefactor, _canvasHeight * _scalefactor);
    gContext.drawImage(gImage, _offsetX, _offsetY);
    gContext.restore();
}

function focusHotspot(Xpos, Ypos) {
    // calculate offsets required to position hotspot in centre of canvas
    var newOffsetX = Xpos - (_centreX * _scalefactor);// * (1 / _scalefactor);
    var newOffsetY = Ypos - (_centreY * _scalefactor); // * (1 / _scalefactor);
    _offsetX = -newOffsetX;
    _offsetY = -newOffsetY;
    //alert("_offsetX : " + newOffsetX + "_offsetY : " + newOffsetY);
    $('#status').html("_offsetX : " + newOffsetX + "_offsetY : " + newOffsetY);
    paint();
}

function showInfoPopup(partdata) {
    // get hotspot position relative to page
    // first get relative to canvas
    var hotspotPosX = ((partdata.RefX + _offsetX) * (1 / _scalefactor)) + canvasMinX;
    var hotspotPosY = ((partdata.RefY + _offsetY) * (1 / _scalefactor)) + canvasMinY;
    $('#status').html('Got part ' + partdata.RefNo);
    $('<div class="partinfopanel"></div>')
        .html('<h4>' + partdata.PartNo + '</h4><p>' + partdata.Description + '</p><p>'+partdata.Remark+'</p>')
        .appendTo('body')
        .css('top', (hotspotPosY + 20) + 'px')
        .css('left', (hotspotPosX + 20) + 'px')
        .fadeIn('slow');
}

function hideInfoPopup() {
    $('.partinfopanel').remove();
}

function highlightPartRow(partdata) {
    //alert('hilight');
    $('#part_' + partdata.PartID + ' td').addClass('hilight');
}

function unhighlightPartRow() {
    //$('.partrow td').css('background-color', 'transparent');
    $('.partrow td').removeClass('hilight');
}

function zoomIn() {
    _scalefactor -= 0.5;
    $('#status').html('Scale factor : ' + _scalefactor);
    paint();
}

function zoomOut() {
    _scalefactor += 0.5;
    $('#status').html('Scale factor : ' + _scalefactor);
    paint();
}

function setTypeSelector(selType) {
    $('select#yamaha-oem-filterpanel #TypeSelect')
        .children()
        .attr('selected', function (i, selected) {
            return $(this).val() == selType;
        });
}

function getYears(type, selectedYear) {
    if (typeof type != 'undefined') {
	    $.getJSON(
	    'https://' + _domain + '/Products/Years/' + type + '/'+ DealerID + '?callback=?',
	    function (data) {
	        // first delete any content
	        $('#yamaha-oem-filterpanel #YearSelect option').remove();
	        $('#yamaha-oem-filterpanel #YearSelect')
	            .unbind()
	            .change(function () {
	                var selectedType = $('#yamaha-oem-filterpanel #TypeSelect').val();
	                var thisYear = $(this).val();
	                if (selectedType == 'WV') {
                        getWaterVehiclesForYear(thisYear);
                    } else {
                        getModelsForYear(selectedType, thisYear);
                    }
	                return false;
	            });
	        $('<option value="-1">Please select a year</option>')
	            .appendTo('#yamaha-oem-filterpanel #YearSelect')

	        $.each(data, function (i, item) {
	            $('<option id="ModelYear_' + item + '">' + item + '</option>')
	            .attr('selected', item == selectedYear)
	            .appendTo('#yamaha-oem-filterpanel #YearSelect')
	        });
	    });
    }
}

function getModels(type, selectedProductID) {
    type = type == 'MB' ? '0' : '1';
    if (typeof type != 'undefined') {
        $.getJSON(
        'https://' + _domain + '/Products/' + type + '/' + DealerID + '?callback=?',
        function (data) {
            $('#yamaha-oem-filterpanel #ModelSelect option').remove();
            $('#yamaha-oem-filterpanel #ModelSelect')
                .unbind('change')
                .change(function () {
                    // clear Assemblies droplist
		    $('#yamaha-oem-filterpanel #ContentSelect option').remove();
                    $('#yamaha-oem-filterpanel #AssemblySelect option').remove();

                    var productId = $(this).children(":selected").attr("data-prodid");
                    getContentForModel(productId);
                    // Jump to Assemblies page
                    return false;
                });
            $('<option value="-1">Please select a Model</option>')
                .appendTo('#yamaha-oem-filterpanel #ModelSelect');

            $.each(data, function (i, item) {

                    $('<option id="model_' + item.ProductID + '">' + item.Model + ' (' + item.Year + ')</option>')
                        .attr('data-prodid', item.ProductID)
                .attr('selected', item.ProductID == selectedProductID)
                .appendTo('#yamaha-oem-filterpanel #ModelSelect');
            });
        });
    }
}

function getModelsForYear(type, year, selectedProductID) {
    type = type == 'MB' ? '0' : '1';
    if ((typeof type != 'undefined') && (typeof year != 'undefined')) {
    $.getJSON(
    'https://' + _domain + '/Products/' + type + '/Year/' + year + '/' + DealerID + '?callback=?',
    function (data) {
        $('#yamaha-oem-filterpanel #ModelSelect option').remove();
        $('#yamaha-oem-filterpanel #ModelSelect')
            .unbind()
            .change(function () {
                var productId = $(this).children(":selected").attr("data-prodid");
                getContentForModel(productId);
                // Jump to Assemblies page
                return false;
            });
        $('<option value="-1">Please select a Model</option>')
            .appendTo('#yamaha-oem-filterpanel #ModelSelect')

        $.each(data, function (i, item) {
            $('<option id="model_' + item.ProductID + '">' + item.Model + '</option>')
            .attr('data-prodid', item.ProductID)
            .attr('selected', item.ProductID == selectedProductID)
            .appendTo('#yamaha-oem-filterpanel #ModelSelect')
        });
    });
    }
}

function getWaterVehiclesForYear(year, selectedProductID) {
    if (typeof year != 'undefined') {
        $.getJSON(
            'https://' + _domain + '/WaterVehicles/Year/' + year + '/' + DealerID + '?callback=?',
            function (data) {
                $('#yamaha-oem-filterpanel #ModelSelect option').remove();
                $('#yamaha-oem-filterpanel #ModelSelect')
                    .unbind()
                    .change(function () {
                        var productId = $(this).children(":selected").attr("data-prodid");
                        getContentForModel(productId);
                        // Jump to Assemblies page
                        return false;
                    });
                $('<option value="-1">Please select a Model</option>')
                    .appendTo('#yamaha-oem-filterpanel #ModelSelect')

                $.each(data, function (i, item) {
                    $('<option id="model_' + item.ProductID + '">' + item.Model + '</option>')
                        .attr('data-prodid', item.ProductID)
                        .attr('selected', item.ProductID == selectedProductID)
                        .appendTo('#yamaha-oem-filterpanel #ModelSelect')
                });

            });
    }
}

function getContentForModel(productId) {
//    alert(productId);
    if (typeof productId != 'undefined')  {
        $.getJSON(
        'https://' + _domain + '/Content/Product/' + productId + '/' + DealerID + '?callback=?',
        function (data) {
            $('#yamaha-oem-filterpanel #ContentSelect option').remove();
            //alert(data);
            $('#yamaha-oem-filterpanel #ContentSelect')
                .unbind()
                .change(function () {
                    var contentId = $(this).children(":selected").attr("data-contentid");
                    getAssembliesForContent(productId, contentId);
                    return false;
                });
            $('<option value="-1">Please select...</option>')
                .appendTo('#yamaha-oem-filterpanel #ContentSelect')
            $.each(data, function (i, item) {
                $('<option id="content_' + item.ContentID + '">' + item.Title + '</option>')
                .attr('data-contentid', item.ContentID)
                .appendTo('#yamaha-oem-filterpanel #ContentSelect')
            });
        });
    }
}

function getAssembliesForContent(productId, contentId) {
    //alert('getting assemblies for content ' + contentId);
    if ((typeof productId != 'undefined') && (typeof contentId != 'undefined')) {
        $.getJSON(
        'https://' + _domain + '/Assembly/Content/' + contentId + '/' + DealerID + '?callback=?',
        function (data) {
            //alert(data);
            $('#yamaha-oem-filterpanel #AssemblySelect option').remove();
            $('#yamaha-oem-filterpanel #AssemblySelect')
                .unbind()
                .change(function () {
                    // use substring to remove 'assembly_'
                    var assId = $(this).children(":selected").attr("data-assid");
                    getAssemblyImage(assId);
                    getPartsForAssembly(productId, assId);
                    return false;
                });
            $('<option value="-1">Please select an assembly</option>')
                .appendTo('#yamaha-oem-filterpanel #AssemblySelect')

            $.each(data, function (i, item) {
                $('<option id="assembly_' + item.AssemblyID + '">' + item.Title + '</option>')
                .attr('data-assid', item.AssemblyID)
                .appendTo('#yamaha-oem-filterpanel #AssemblySelect')
            });
        });
    }
}

function getAssembliesForModel2(modelId, selectedAssemblyID) {
    if (typeof modelId != 'undefined') {
        $.getJSON(
            'https://' + _domain + '/Assembly/Model/' + modelId + '/' + DealerID + '?callback=?',
            function (data) {
                $('#yamaha-oem-filterpanel #AssemblySelect option').remove();
                $('#yamaha-oem-filterpanel #AssemblySelect')
                    .unbind('change')
                    .change(function () {
                        // clear Accessories droplist
                        $('#AccessorySelect').val(-1);
                        // clear AdrAssemblies droplist
                        $('#AdrAssemblySelect').val(-1);
                        var assId = $(this).children(":selected").attr("data-assid");
                        getAssemblyImage(assId);
                        getPartsForAssembly(modelId, assId);
                        return false;
                    });

                $('<option value="-1">Please select an assembly</option>')

                    .appendTo('#yamaha-oem-filterpanel #AssemblySelect');



                $.each(data, function (i, item) {
                    $('<option id="assembly_' + item.AssemblyID + '">' + item.AddressNo + ' - ' + item.Name + '</option>')
                        .attr('data-assid', item.AssemblyID)
                        .attr('selected', item.AssemblyID == selectedAssemblyID)
                        .appendTo('#yamaha-oem-filterpanel #AssemblySelect')
                });
            });
    }
}

function getPartsForAssembly(productId, assemblyId) {
    //alert('getting parts for assembly ' + assemblyId);
    if ((typeof productId != 'undefined') && (typeof assemblyId != 'undefined')) {
        $.getJSON(
            'https://' + _domain + '/Part/Assembly/' + productId + '/' + assemblyId + '/' + DealerID + '?callback=?',
            function (data) {
                $('#PartsList tbody tr').remove();
                // clear hotspot array
                _hotspots.length = 0;
                $.each(data, function (i, item) {
                    var partId = item.PartID;
                    // put the item in the hotspot array
                    _hotspots.push(item);
                    // handle supersessioned parts - Display Supersession part no and Price
                    var PartNoCell;
                    var itemPrice = 0.00;
                    var  itemPartID="";

                    if (item.SsPartNo != null) {
                        PartNoCell = "<td class=\"supersession\">"+item.SsPartNo+"</td>";
                        itemPrice = item.SsPrice;
                        itemPartID = item.SsPartNo;
                    }
                    else {
                        PartNoCell= "<td>"+item.PartNo+"</td>";
                        itemPrice = item.Price;
                        itemPartID = item.PartNo;
                    }

                    itemPrice = (itemPrice * (1 + gMrkp / 100)).toFixed(2);

					var class_Partnotforsale = item.Discontinued ? "partnotforsale" : "";
                    if(itemPrice > 0){
						if(!class_Partnotforsale) {
							clm = '<td class="addToCart"><input type="button" id="btnAdd_' + item.PartID + '" data-partid="'+ item.PartID +'" data-partno="'+ itemPartID +'" class="productContentfooterLeft btnAddToCart ' + class_Partnotforsale + '" value="Add to Cart" /><img id="loadingAdd_'+ item.PartID +'" style="display:none;" src="/wp-content/plugins/yamaha-oem-parts-lookup/styles/img/loading.gif" /><span id="successAdd_'+ item.PartID +'" class="successButton">Cart Updated!</span></td>';
                        }else{
							clm = '<td align="center"><span style="color:#000000;font-size:14px;">Discontinued<span></td>';
                    	}
                    }
                    else{
                        /*clm ='<td><input type="button" value="Contact store" rel="facebox" class="contactstore" id="btn_' + item.PartID + '_'+item.Description+'" /></td>';*/
                        clm ='<td align="center"><a style="color:#000000;font-size:14px;" href="/contacts/" class="contactstore" rel="facebox">Contact Store</a></td>';
                    }

                 //   itemPrice = 'xxx';
					function format2(n, currency) {
						return currency + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
					}

						n = "$";
                    $('<tr id="part_' + item.PartID + '" class="partrow"></tr>')
                        .append('<td class="refCol"><input  id="chk_' + item.PartID + '" type="hidden"></input>' + item.RefNo + '</td><td class="text descCol">' + item.Description + '</td>' + PartNoCell + '<td class="numberCol">' + item.Quantity + '</td><td><input name="qty_' + item.PartID + '" id="qty_' + item.PartID + '" type="text" class="qtyTextbox ' + class_Partnotforsale + '"  value="1"/></td><td><span class="' + class_Partnotforsale + '">' + format2(itemPrice*1.1, "$") + '</span></td>')
                        .append(clm)
                        .attr('data-partid', item.PartID)
                        .attr('data-partno', itemPartID)
                        .attr('data-quantity', item.Quantity)
                        .attr('data-orderqty', 1)
                        .attr('data-price', itemPrice)
                        .attr('data-refno', item.RefNo)
                        //.attr('data-sspartno', item.SsPartNo)
                        .attr('data-descrp', item.Description)
                        .attr('data-remark', item.Remark)
                        .attr('data-notforsale', item.Discontinued)
                        .attr('data-weight', item.Weight)
                        .attr('data-volume', item.Volume)
                        .attr('data-dangerousgoodsclass', item.DangerousGoodsClass)
                        .attr('data-dangerousgoodscode', item.DangerousGoodsCode)
                        .attr('data-length', item.Length)
                        .attr('data-width', item.Width)
                        .attr('data-height', item.Height)
                        .appendTo('#PartsList tbody');
                })
                $('#PartsListContainer').fadeIn();
            });
    }
}


function getModelImage(modelId) {
    if (typeof modelId != 'undefined') {
        $.getJSON(
            'https://' + _domain + '/Model/Image/' + modelId + '/' + DealerID + '?callback=?',
            function (data) {
                $('div#yamaha-oem-imageWrap img').remove();
                $('div#yamaha-oem-imageWrap .modelImageContainer').remove();

                if (data.length > 0) {
                    $.each(data, function (i, item) {
                        var modelImage = new Image();
                        modelImage.src = 'https://' + _domain + '/Image/getImage/' + item.Key + '/type/' + item.Value;
                        $('<img class="modelImage">')
                            .attr('src', modelImage.src)
                            .appendTo($('<div class="modelImageContainer"></div>')
                                .appendTo($('div#yamaha-oem-imageWrap'))
                            )
                            .hide()
                            .load(function () {
                                $(this).fadeIn();
                            });
                    });
                }
            }
        );
    }
}

function getAssemblyImage(assemblyId) {
    if (typeof assemblyId != 'undefined') {
        $.getJSON(
            'https://' + _domain + '/Assembly/Image/' + assemblyId + '/' + DealerID + '?callback=?',
            function (data) {
                $('#status').html('Image Received');
                if (document.getElementById('imageCanvas')) {
                    gCanvas = document.getElementById('imageCanvas');
                    gCanvas.width = gCanvas.width;
                }

                _offsetX, _offsetY = 0;
                gImage.onload = function () {
                    $('#status').html('Image Loaded');
                    paint();
                }

                gImage.src = 'https://' + _domain + '/Image/getImage/' + data.Key + '/type/' + data.Value;
            });
    }
}
