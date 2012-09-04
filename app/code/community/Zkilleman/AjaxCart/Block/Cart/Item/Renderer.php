<?php
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

class Zkilleman_AjaxCart_Block_Cart_Item_Renderer
    extends Mage_Checkout_Block_Cart_Item_Renderer
{

    /**
     * Get item delete url
     *
     * @todo uenc option & rewrite for Grouped product
     * @return string
     */
    public function getDeleteUrl()
    {
        if (!Mage::getSingleton('ajaxcart/config')->isEnabled()) {
            return parent::getDeleteUrl();
        }
        $params = array('id' => $this->getItem()->getId());
        if (!Mage::app()->getRequest()->getParam('isAjax')) {
            $params[Mage_Core_Controller_Front_Action::PARAM_NAME_URL_ENCODED] =
                $this->helper('core/url')->getEncodedUrl();
        }
        return $this->getUrl('checkout/cart/delete', $params);
    }
}
