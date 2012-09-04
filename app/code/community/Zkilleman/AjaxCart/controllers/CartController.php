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

require_once implode(DS, array(
    'Mage', 'Checkout', 'controllers', 'CartController.php'
));

class Zkilleman_AjaxCart_CartController extends Mage_Checkout_CartController
{

    const EVENT_RESPONSE = 'ajaxcart_ajax_update_response';

    /**
     *
     */
    public function indexAction()
    {
        $this->getResponse()->setRedirect(Mage::getBaseUrl(), 301);
    }

    /**
     *
     */
    public function addAction()
    {
        // run core logic
        parent::addAction();
        $this->_prepareResponse();
    }

    /**
     *
     */
    public function deleteAction()
    {
        $id = (int) $this->getRequest()->getParam('id');
        if ($id) {
            try {
                $this->_getCart()->removeItem($id)->save();
                $this->_getSession()->addSuccess($this->__('Item removed.'));
            } catch (Exception $e) {
                $this->_getSession()->addError($this->__('Cannot remove the item.'));
                Mage::logException($e);
            }
        }
        $this->_prepareResponse();
    }

    /**
     *
     */
    protected function _prepareResponse()
    {
        // drain session messages
        $messages = array();
        foreach (Mage::getSingleton('checkout/session')
                        ->getMessages(true)->getItems() as $message) {
            $messages[] = array(
                'identifier' => $message->getIdentifier(),
                'code'       => $message->getCode(),
                'type'       => $message->getType(),
                'text'       => $message->getText(),
                'isSticky'   => $message->getIsSticky()
            );
        }

        $this->loadLayout();
        $topLinksBlock = $this->getLayout()->getBlock('top.links');
        $sidebarBlock  = $this->getLayout()->getBlock('cart_sidebar');

        $cartLink = false;
        if ($topLinksBlock && $topLinksBlock instanceof Mage_Page_Block_Template_Links) {
            foreach ($topLinksBlock->getLinks() as $link) {
                if ($link->getAParams() == 'class="top-link-cart"') {
                    $cartLink = $link->getData();
                    break;
                }
            }
        }

        $responseObject = new Varien_Object(array(
            'messages'      => $messages,
            'sidebarHtml'   => $sidebarBlock ? $sidebarBlock->toHtml() : '',
            'cartLink'      => $cartLink,
            'action'        => $this->getRequest()->getActionName(),
            'requestParams' => $this->getRequest()->getParams()
        ));

        Mage::dispatchEvent(
                self::EVENT_RESPONSE, array('response_object' => $responseObject));

        // reset redirect headers and send response
        $this->getResponse()
            ->clearHeaders()
            ->setHttpResponseCode(200)
            ->setHeader('Content-type', 'application/json')
            ->setBody($responseObject->toJson());
    }
}
