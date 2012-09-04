/**
 * Zkilleman_AjaxCart
 *
 * Copyright (C) 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 *
 * This file is part of Zkilleman_AjaxCart.
 *
 * Zkilleman_AjaxCart is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Zkilleman_AjaxCart is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Zkilleman_AjaxCart. If not, see <http://www.gnu.org/licenses/>.
 *
 * @category  Zkilleman
 * @package   Zkilleman_AjaxCart
 * @author    Henrik Hedelund <henke.hedelund@gmail.com>
 * @copyright 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 * @license   http://www.gnu.org/licenses/lgpl.html GNU LGPL
 * @link      https://github.com/henkelund/magento-zkilleman-ajaxcart
 */

(function(_w, _d) {

    _w.ZkillemanAjaxCart = Class.create({
        _config: null,
        _actionProductPattern: null,
        initialize: function(config)
        {
            this._config               = config;
            this._config.url           = config.url || '/ajax-cart/cart/';
            this._actionProductPattern = /\/product\/(\d*)\D|$/;
            Event.observe(_d, 'dom:loaded', this._domLoaded.bind(this));
        },
        _domLoaded: function()
        {
            var form = _w.productAddToCartForm;
            if (typeof form != 'undefined') {
                this._replaceProductForm(form);
            }

            this._replaceListClickActions();
            this._replaceRemoveListeners();
        },
        _replaceProductForm: function(form)
        {
            var self            = this;
            form.originalSubmit = form.submit;

            form.submit = function(button) {

                if (this.validator.validate()) {
                    if (!self.submitForm(form, function(response) {

                        if (button && button != 'undefined') {
                            button.disabled = false;
                            $(button).removeClassName('loading');
                        }

                        if (!response) {
                            form.originalSubmit();
                        } else {

                            self.displayMessages(response.messages);
                            self.replaceCart(response.sidebarHtml);
                            self.replaceToplink(response.cartLink);
                        }
                    })) {
                        form.originalSubmit();
                    }

                    if (button && button != 'undefined') {
                        button.disabled = true;
                        $(button).addClassName('loading');
                    }
                }
            }.bind(form);
        },
        _replaceListClickActions: function()
        {
            var self = this;
            $$('.btn-cart').each(function(elem) {
                var clickAction = new String(elem.getAttribute('onclick'));
                if (!(/\/checkout\/cart\/add\//.test(clickAction))) {
                    return;
                }
                var actionMatch = clickAction.match(self._actionProductPattern);
                var product = actionMatch.length > 1 ? parseInt(actionMatch[1]) : 0;
                if (isNaN(product) || product <= 0) {
                    return;
                }

                elem.setAttribute('onclick', 'return false;');
                elem.observe('click', function() {
                    elem.setAttribute('disabled', 'disabled');
                    elem.addClassName('loading');
                    self.addProduct({
                        product: product
                    }, function(response) {
                        self.displayMessages(response.messages);
                        self.replaceCart(response.sidebarHtml);
                        self.replaceToplink(response.cartLink);
                        elem.removeAttribute('disabled');
                        elem.removeClassName('loading');
                    });
                });
            });
        },
        _replaceRemoveListeners: function()
        {
            var checkoutPattern = /checkout/;
            if (checkoutPattern.test(_w.location)) {
                // don't use ajax remove on checkout page
                return;
            }

            var self = this;

            $$('.block-cart .btn-remove').each(function(elem) {
                elem.setAttribute('onclick', 'return false;');
                elem.observe('click', self._removeClicked.bind(self));
            });
        },
        _removeClicked: function(evt)
        {
            var self = this;
            var href = evt.element().getAttribute('href');
            var pattern = /\/id\/(\d*)\D|$/;
            var matches;
            if (matches = pattern.exec(href)) {
                $(evt.element()).addClassName('loading');
                this.removeProduct({
                    id: matches[1]
                }, function(response) {
                    self.displayMessages(response.messages);
                    self.replaceCart(response.sidebarHtml);
                    self.replaceToplink(response.cartLink);
                });
            }
            return false;
        },
        addProduct: function(params, callback)
        {
            params.isAjax = 1;
            new Ajax.Request(this._config.url + 'add', {
                method: 'post',
                parameters: params,
                onSuccess: function(transport) {
                    if (callback) {
                        var response = false;
                        try {
                            response = eval('(' + transport.responseText + ')');
                        } catch (e) {
                            console.log(e);
                        }
                        callback(response);
                    }
                }
            });
        },
        removeProduct: function(params, callback)
        {
            params.isAjax = 1;
            new Ajax.Request(this._config.url + 'delete', {
                method: 'post',
                parameters: params,
                onSuccess: function(transport) {
                    if (callback) {
                        var response = false;
                        try {
                            response = eval('(' + transport.responseText + ')');
                        } catch (e) {
                            console.log(e);
                        }
                        callback(response);
                    }
                }
            });
        },
        submitForm: function(form, callback)
        {
            if (form.validator.validate()) {
                var params = Form.serialize(form.form, {
                    hash: true
                });
                if (typeof params != 'object') {
                    params = {};
                }

                var actionMatch = form.form.action.match(this._actionProductPattern);
                if (actionMatch.length > 1) {
                    params.product = parseInt(actionMatch[1]);
                }

                if (typeof params.product == 'undefined' ||
                    isNaN(params.product) || params.product <= 0) {
                    return false;
                }
                this.addProduct(params, callback);
            }
            return true;
        },
        displayMessages: function(messages)
        {
            if (!messages.length) {
                return;
            }

            var notify = _w._zkillemanNotify;
            for (var i = 0; i < messages.length; ++i) {
                // if notify module is available, use it!
                if (typeof notify == 'object' &&
                        typeof notify.addMessage == 'function') {
                    notify.addMessage(messages[i]);
                } else {
                    alert(messages[i].text);
                }
            }
        },
        replaceCart: function(cartHtml)
        {
            $$('.block-cart').each(function(elem) {
                Element.replace(elem, cartHtml);
            });

            this._replaceRemoveListeners();

            // add listener to configurable details (/js/varien/js.js)
            truncateOptions();
        },
        replaceToplink: function(toplink)
        {
            if (typeof toplink != 'object' || !toplink.label) {
                return false;
            }
            var label = toplink.label;
            var title = toplink.title || label;
            $$('.top-link-cart').each(function(elem) {
                Element.update(elem, label);
                elem.setAttribute('title', title);
            });
        }
    });

})(window, document);
