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
            this._config = $H(config || {});
            this._actionProductPattern = /\/product\/(\d*)\D|$/;
            if (!this.getOption('url')) {
                this.setOption('url', '/ajax-cart/cart/');
            }
            Event.observe(_d, 'dom:loaded', this._domLoaded.bind(this));
        },
        getOption: function(key)
        {
            return this._config.get(key);
        },
        setOption: function(key, value)
        {
            return this._config.set(key, value);
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
                            self._handleResponse(response);
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
                        self._handleResponse(response);
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
                    },
                    function(response) {
                        self._handleResponse(response);
                    });
            }
            return false;
        },
        addProduct: function(params, callback)
        {
            params.isAjax = 1;
            new Ajax.Request(this.getOption('url') + 'add', {
                method: 'post',
                parameters: params,
                onSuccess: function(transport) {
                    if (callback) {
                        var response = false;
                        try {
                            response = eval('(' + transport.responseText + ')');
                        } catch (e) {
                            // console.log(e);
                        }
                        callback(response);
                    }
                }
            });
        },
        removeProduct: function(params, callback)
        {
            params.isAjax = 1;
            new Ajax.Request(this.getOption('url') + 'delete', {
                method: 'post',
                parameters: params,
                onSuccess: function(transport) {
                    if (callback) {
                        var response = false;
                        try {
                            response = eval('(' + transport.responseText + ')');
                        } catch (e) {
                            // console.log(e);
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
        _handleResponse: function(response)
        {
            var customHandler = this.getOption('responseHandler');
            if (typeof customHandler == 'function') {
                customHandler(response);
                return;
            }

            this.displayMessages(response.messages);
            this.replaceCart(response.sidebarHtml);
            this.replaceToplink(response.cartLink);
        },
        displayMessages: function(messages)
        {
            if (!Object.isArray(messages)) {
                return;
            }

            var customHandler = this.getOption('messageHandler');
            if (typeof customHandler == 'function') {
                customHandler(messages);
                return;
            }

            if (_w._zkillemanNotify) {
                messages.each(function(message) {
                    _w._zkillemanNotify.addMessage(message);
                });
                return;
            }

            if (this.getOption('noAlerts') !== true) {
                messages.each(function(message) {
                    alert(message.text);
                });
            }
        },
        replaceCart: function(cartHtml)
        {
            var customHandler = this.getOption('cartHandler');
            if (typeof customHandler == 'function') {
                customHandler(cartHtml);
                return;
            }

            $$('.block-cart').each(function(elem) {
                Element.replace(elem, cartHtml);
            });

            this._replaceRemoveListeners();

            // add listener to configurable details (/js/varien/js.js)
            truncateOptions();
        },
        replaceToplink: function(toplink)
        {
            var customHandler = this.getOption('toplinkHandler');
            if (typeof customHandler == 'function') {
                customHandler(toplink);
                return;
            }

            if (typeof toplink != 'object' || !toplink.label) {
                return;
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
