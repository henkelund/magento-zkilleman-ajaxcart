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

class Zkilleman_AjaxCart_Model_Config
{

    const XML_PATH_ENABLED = 'ajaxcart/general/enabled';
    const XML_PATH_RESPONSE_BLOCKS = 'global/ajaxcart/response_blocks';

    /**
     *
     * @return bool
     */
    public function isEnabled()
    {
        return Mage::getStoreConfigFlag(self::XML_PATH_ENABLED);
    }

    /**
     * Get names of layout components that should be included in ajax response
     *
     * @return array
     */
    public function getResponseBlockNames()
    {
        $blockNames = array();
        $node = Mage::getConfig()->getNode(self::XML_PATH_RESPONSE_BLOCKS);
        /* @var $node Mage_Core_Model_Config_Element */
        if ($node) {
            foreach ($node->children() as $blockNode) {
                $name = (string) $blockNode;
                $label = $this->_formatLabel($blockNode->getName(), 'Html');
                if (!empty($name)) {
                    $blockNames[$name] = $label;
                }
            }
        }
        return $blockNames;
    }

    /**
     *
     * @param string $string
     * @param string $suffix
     * @return string
     */
    protected function _formatLabel($string, $suffix = '')
    {
        return $this->_lcfirst(uc_words($string, '')) . $suffix;
    }

    /**
     * Make a string's first character lowercase
     *
     * @param string $str The input string.
     * @return string The resulting string.
     */
    protected function _lcfirst($str)
    {
        if (function_exists('lcfirst')) {
            $str = lcfirst($str);
        } else if (strlen($str) > 0) {
            $str[0] = strtolower($str[0]);
        }
        return $str;
    }
}
