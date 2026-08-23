//=============================================================================
// LimitedBuyItem.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.LimitedBuyItem = VynPlugin.LimitedBuyItem || {};

/*:
 * Limited Buy Item
 *
 * @plugindesc v1.0.0 This plugin to limit item buy
 * @author Vyndicate
 *
 * @help
 * If you want to limit the item you want to buy, you can use this plugin
 * 
 * This can be used on situation like a very rare item only can hold few of it
 * 
 * Item/Weapon/Armor notetag:
 * <Limited Stock: x>
 * Use x as maximum item you can bought
 * 
 * Put below MultipleCurrency plugin to make it work properly
 * ============================================================================
 * v1.0.0
 * Initiate Plugin
 */

VynPlugin.parameters = PluginManager.parameters('LimitedBuyItem');

//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
VynPlugin.LimitedBuyItem.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.LimitedBuyItem.Database_Loaded.call(this)) return false;
    if (!VynPlugin.LimitedBuyItem._loadLimitItemBuy) {
        this.processLimitItemBuy($dataItems);
        this.processLimitItemBuy($dataWeapons);
        this.processLimitItemBuy($dataArmors);
        VynPlugin.LimitedBuyItem._loadLimitItemBuy = true;
    }
    return true;
};

DataManager.processLimitItemBuy = function (objects) {
    for (let n = 1; n < objects.length; n++) {
        let obj = objects[n];

        let limitedStock = obj.meta["Limited Stock"];
        obj.limitedStock = limitedStock || 0;
    }
};

//-----------------------------------------------------------------------------
// Game_Party
//-----------------------------------------------------------------------------
VynPlugin.LimitedBuyItem.Game_Party_maxItems = Game_Party.prototype.maxItems;
Game_Party.prototype.maxItems = function (item) {
    if (item.limitedStock) {
        return item.limitedStock;
    }
    return VynPlugin.LimitedBuyItem.Game_Party_maxItems.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// If Multiple Currency Exist
//-----------------------------------------------------------------------------
if (VynPlugin.MultipleCurrency) {
    Window_ShopBuy.prototype.drawItem = function (index) {
        let item = this._data[index];
        let price = this._priceText[index];
        let currency = this._currencyUnit[index];
        let icon = this._currencyIcon[index];
        let rect = this.itemRect(index);
        let priceWidth = 72 + this.textWidth(price);
        rect.width -= this.textPadding();
        if (item instanceof Object) {
            let itemAvailableLeft = "";
            if (item.limitedStock > 0) {
                let calculateLeft = item.limitedStock - $gameParty.numItems(item)
                if (calculateLeft < 0) calculateLeft = 0;
                itemAvailableLeft = " (Stock: " + calculateLeft + ")"
            }
            this.changePaintOpacity(this.isEnabled(item));
            this.drawItemName(item.itemRealName + itemAvailableLeft, item.realIconIndex, rect.x, rect.y, rect.width - priceWidth);
        } else if (typeof item == "number") {
            this.changePaintOpacity(this.isEnabled(this._data[item]));
        }
        if (icon) {
            this.drawItemNameForCurrency(price, icon, rect.x + rect.width - priceWidth, rect.y, priceWidth);
        } else {
            this.drawText(price + currency, rect.x + rect.width - priceWidth, rect.y, priceWidth, 'right');
        }
        this.changePaintOpacity(true);
    };
} else {
    Window_ShopBuy.prototype.drawItemName = function (item, x, y, width) {
        width = width || 312;
        if (item) {
            let itemAvailableLeft = "";
            if (item.limitedStock > 0) {
                let calculateLeft = item.limitedStock - $gameParty.numItems(item)
                if (calculateLeft < 0) calculateLeft = 0;
                itemAvailableLeft = " (Stock: " + calculateLeft + ")"
            }
            var iconBoxWidth = Window_Base._iconWidth + 4;
            this.resetTextColor();
            this.drawIcon(item.iconIndex, x + 2, y + 2);
            this.drawText(item.name + itemAvailableLeft, x + iconBoxWidth, y, width - iconBoxWidth);
        }
    };
}