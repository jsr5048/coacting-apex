/*!
 Copyright (c) 2012, 2018, Oracle and/or its affiliates. All rights reserved.
*/
/*
 * The {@link apex.widget}.popupLov is used for the pop-up LOV widget of Oracle Application Express.
 */
/*global apex,$s*/
(function( widget, $ ) {
    "use strict";
    /**
     * @param {String} pSelector  jQuery selector to identify APEX page item(s) for this widget.
     * @param {Object} [pOptions]
     *
     * @function popupLov
     * @memberOf apex.widget
     * */
    widget.popupLov = function(pSelector, pOptions) {

        // Default our options and store them with the "global" prefix, because it's
        // used by the different functions as closure
        var gOptions = $.extend({
                dependingOnSelector:null,
                optimizeRefresh:true,
                pageItemsToSubmit:null,
                nullValue:"",
                filterWithValue:false,
                windowParameters:null,
                allowMultiple:false,
                inputField:"NOT_ENTERABLE"
            }, pOptions),
            gPopupLov = $(pSelector, apex.gPageContext$ );

        // Boolean to control if popup is enterable (for popup lov) or non-enterable
        // (for popup key lov)
        var gEnterable = (gOptions.inputField === 'ENTERABLE');

        // Register apex.item callbacks
        $(pSelector, apex.gPageContext$).each(function(){
            var self = this;

            widget.initPageItem(this.id, {
                enable        : function() {
                    // Enable the icon, set the context as the anchor for the icon
                    widget.util.enableIcon($('#' + self.id + '_holder', apex.gPageContext$).find('a'), '#', _callPopup);
                    // if input field is enterable, need to enable it
                    if (gEnterable) {
                        // enable both input and and popup icon
                        gPopupLov
                            .prop('disabled', false)            // enable LOV
                            .removeClass('apex_disabled');      // remove disabled class
                    } else {
                        // if non-enterable, need to re-enable the associated hidden
                        // element used to store the value POSTed
                        $('#' + self.id + '_HIDDENVALUE', apex.gPageContext$)
                            .prop('disabled', false);
                    }
                },
                disable       : function() {
                    // Disable the icon, set the context as the table row containing the lov element
                    widget.util.disableIcon($(gPopupLov).closest('tr'));
                    // if input field is enterable, need to disable it
                    if (gEnterable) {
                        // disable both input and and popup icon
                        gPopupLov
                            .prop('disabled', true)     // add disabled attribute
                            .addClass('apex_disabled'); // add move disabled class
                    } else {
                        // if non-enterable, need to disable the associated hidden element
                        // used to store the value POSTed
                        $('#' + self.id + '_HIDDENVALUE', apex.gPageContext$)
                            .prop('disabled', true);  // add disabled attribute
                    }
                },
                isDisabled    : function() {
                    return gEnterable ? gPopupLov.prop('disabled') : $('#' + self.id + '_HIDDENVALUE', apex.gPageContext$).prop('disabled');
                },
                show          : function() {
                    // traverse up to the table row container, and show that
                    $('#' + self.id, apex.gPageContext$).closest('tr').show();
                },
                hide          : function() {
                    // traverse up to the table row container, and hide that
                    $('#' + self.id, apex.gPageContext$).closest('tr').hide();
                },
                setValue      : function(pValue, pDisplayValue) {
                    // if input is enterable (popup lov), then just set pValue
                    if (gEnterable) {
                        $('#' + self.id, apex.gPageContext$).val(pValue);
                    } else {
                        // popup key lovs store their value in a hidden field
                        $('#' + self.id + '_HIDDENVALUE', apex.gPageContext$).val(pValue);
                        // and their return value in the displayed field
                        $('#' + self.id, apex.gPageContext$).val(pDisplayValue);
                    }
                },
                getValue      : function() {
                    var lReturn;
                    // if input is enterable (popup lov), then get the displayed value
                    if (gEnterable) {
                        lReturn =  $('#' + self.id, apex.gPageContext$).val();
                    } else {
                        // popup key lovs store their value in a hidden field
                        lReturn = $('#' + self.id + '_HIDDENVALUE', apex.gPageContext$).val();
                    }
                    return lReturn;
                },
                setFocusTo    : function() {
                    if ( !gEnterable ) {

                        // If non-enterable, set focus to the popup icon
                        return $( pSelector + "_lov_btn", apex.gPageContext$ );
                    } else {

                        // if enterable, just set focus to the item
                        return $( pSelector, apex.gPageContext$ );
                    }
                },
                getPopupSelector: function() {
                    return ".js-popupLOV-form";
                },
                nullValue     : gOptions.nullValue
            });
        });

        function _setPopupLovReturnValue( pEvent, pValue ) {

            var lItem = apex.item( gPopupLov.attr("id") );

            if ( gOptions.allowMultiple ) {
                lItem.setValue( lItem.getValue() + ( lItem.getValue() !== "" ? "," : "" ) + pValue.r );
            } else {
                lItem.setValue( pValue.r, pValue.d );
            }
            lItem.setFocus();

        } // _setPopupLovReturnValue

        // Triggers the "refresh" event of the popup lov which actually does the AJAX call
        function _triggerRefresh() {
            gPopupLov.trigger('apexrefresh');
        } // triggerRefresh

        // Clears the existing values from the popup lov fields and fires the before
        // and after refresh events
        function refresh() {
            // trigger the before refresh event
            gPopupLov.trigger('apexbeforerefresh');

            // remove everything except of the null value. If no null value is defined
            $s(gPopupLov.attr("id"), gOptions.nullValue, gOptions.nullValue);

            // trigger the after refresh event
            gPopupLov.trigger('apexafterrefresh');
        } // refresh

        function _callPopup() {

            widget.util.callPopupLov(
                gOptions.ajaxIdentifier,
                {
                    pageItems: $( gOptions.pageItemsToSubmit, apex.gPageContext$ ).add( gOptions.dependingOnSelector )
                }, {
                    filterOutput:     gOptions.filterWithValue,
                    filterValue:      gPopupLov.val(),
                    windowParameters: gOptions.windowParameters,
                    target:           gPopupLov[0]
                } );

            return false;
        } // _callPopup

        gPopupLov.on("_setpopuplovreturnvalue", _setPopupLovReturnValue );

        // register the click event for the icon anchor to call the popup lov dialog
        $(pSelector+"_lov_btn", apex.gPageContext$).click(_callPopup);

        // if it's a cascading popup lov we have to register change events for our masters
        if (gOptions.dependingOnSelector) {
            $(gOptions.dependingOnSelector, apex.gPageContext$).change(_triggerRefresh);
        }
        // register the refresh event which is triggered by triggerRefresh or a manual refresh
        gPopupLov.on("apexrefresh", refresh);

    }; // popupLov

})( apex.widget, apex.jQuery );
