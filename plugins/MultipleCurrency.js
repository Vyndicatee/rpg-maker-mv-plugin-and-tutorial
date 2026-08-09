/*:
 * Multiple Currency
 *
 * @plugindesc v1.1.0 This plugin adds support for multiple currencies
 * @author Vyndicate
 *
 * @help
 * 
 * If you want to have another currency other than just Gold. You can
 * use another currency on shop or even better, more than 1 currency!
 * 
 * ===Item/Armor/Weapon notetag===
 * <Variable/Item/Armor/Weapon x Buy/Sell Price: y>
 * Determine the currency for specified item with x index and y price amount
 * 
 * Example:
 * <Variable 1 Buy Price: 10>
 * <Item 3 Sell Price: 2>
 * <Armor 4 Buy Price: 5>
 * <Weapon 5 Buy Price: 3>
 * 
 * <Dupes: x>
 * Determine the item that you want to duplicate the whole section
 * without copy paste everything with x index of item
 * 
 * Example:
 * <Dupes: 3>
 * 
 * If you set this in one of the Item notetag, the whole thing like description,
 * item name, icon, will duplicate from Item index 3
 * 
 * This can be used for having multiple item with different currency in 
 * different shop
 * 
 * If you want to use an Icon, you can use icon[x] with x as icon index
 * 
 * ===Item/Armor/Weapon/Variable name===
 * icon[x]Item Name
 * if you don't want to use the name, you can just add <> between Item Name
 * 
 * icon[x]<Item Name>
 * 
 * PSA: Don't open this js file because the code is spaghetti
 * 
 * ============================================================================
 * Changelog
 * v1.1.0
 * Add icon support. Available both buy window and gold window
 * 
 * v1.0.1
 * Remove Commented code
 *
 * v1.0.0
 * Init plugin
 *
 */

var VynPlugin = VynPlugin || {};
VynPlugin.MultipleCurrency = VynPlugin.MultipleCurrency || {};

//=============================================================================
// Parameter Variables
//=============================================================================
VynPlugin.MultipleCurrency.parameters = PluginManager.parameters('MultipleCurrency');

//=============================================================================
// DataManager
//=============================================================================
VynPlugin.MultipleCurrency.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.MultipleCurrency.Database_Loaded.call(this)) return false;
    if (!VynPlugin.MultipleCurrency._loadCurrencies) {
        this.setCurrency($dataItems);
        this.setCurrency($dataWeapons);
        this.setCurrency($dataArmors);
        VynPlugin.MultipleCurrency._loadCurrencies = true;
    }
    return true;
};

DataManager.setCurrency = function (items) {
    for (var i = 1; i < items.length; i++) {
        var obj = items[i];
        var list = [];
        Object.entries(obj.meta).forEach(([key, value]) => {
            var tempObject = {};
            var type = key.split(" ")[0].toLowerCase();
            var isError = false;
            switch (type) {
                case "variable":
                case "item":
                case "weapon":
                case "armor":
                    tempObject.type = type;
                    break;
                default:
                    isError = true;
                    break;
            }

            var id = Number(key.split(" ")[1]);
            if (!isNaN(id)) {
                tempObject.id = id;
            } else {
                isError = true;
            }

            var isBuy = key.split(" ")[2];
            if (isBuy && isBuy.toLowerCase() === "buy") {
                tempObject.isBuy = true;
            } else {
                tempObject.isBuy = false;
            }

            var amount = Number(value);
            if (!isNaN(amount)) {
                tempObject.amount = amount;
            } else {
                isError = true;
            }

            if (!isError) {
                list.push(tempObject);
            }
        });
        obj.shopNewCurrency = list;
        obj.shopDupesFromId = Number(obj.meta["Dupes"]) || 0;
    }
};

//=============================================================================
// Window_Base
//=============================================================================
Window_Base.prototype.drawMultipleCurrenciesValue = function (value, unit, x, y, width) {
    let currentX = 0;
    for (let i = 0; i < value.length; i++) {
        let unitText = unit[i];
        let icon = findCurrencyIcon(unitText);
        let currency = convertIntoItemNameOnly(unitText);
        let iconBoxWidth = icon ? Window_Base._iconWidth + 4 : 0;
        let unitWidth = this.textWidth(currency);
        this.resetTextColor();
        this.drawText(value[i], x + currentX - iconBoxWidth, y, width - unitWidth - 6, 'right');
        this.changeTextColor(this.systemColor());
        if (icon) {
            this.drawIcon(icon, x + currentX + width - unitWidth - iconBoxWidth, y + 2);
        }
        this.drawText(currency, x + currentX + width - unitWidth, y, unitWidth, 'right');
        currentX -= this.textWidth(value[i] + currency) + iconBoxWidth + 10;
    }
};

//=============================================================================
// Window_Selectable
//=============================================================================
Window_Selectable.prototype.callHandlerWithArgs = function (symbol, ...args) {
    if (this.isHandled(symbol)) {
        this._handlers[symbol](...args);
    }
};

//=============================================================================
// Window_ShopBuy
//=============================================================================
VynPlugin.MultipleCurrency.Window_ShopBuy_initialize = Window_ShopBuy.prototype.initialize;
Window_ShopBuy.prototype.initialize = function (x, y, height, shopGoods) {
    this._additionalIndexes = {};
    VynPlugin.MultipleCurrency.Window_ShopBuy_initialize.apply(this, arguments);
};

Window_ShopBuy.prototype.makeItemList = function () {
    this._data = [];
    this._price = [];
    this._priceText = [];
    this._currencyUnit = [];
    this._currencyIcon = [];
    let offset = 0;
    this._shopGoods.forEach(function (goods, index) {
        var item = null;
        switch (goods[0]) {
            case 0:
                item = $dataItems[goods[1]];
                if (item.shopNewCurrency && item.shopNewCurrency.filter(ncl => ncl.isBuy).length > 0 && item.shopDupesFromId) {
                    var shopObject = item.shopNewCurrency.filter(ncl => ncl.isBuy);
                    var shopDupesId = item.shopDupesFromId;
                    var newItem = Object.assign({}, $dataItems[item.shopDupesFromId]);
                    newItem.shopNewCurrency = shopObject;
                    newItem.shopDupesFromId = shopDupesId;
                    item = newItem;
                }
                break;
            case 1:
                item = $dataWeapons[goods[1]];
                if (item.shopNewCurrency && item.shopNewCurrency.filter(ncl => ncl.isBuy).length > 0 && item.shopDupesFromId) {
                    var shopObject = item.shopNewCurrency.filter(ncl => ncl.isBuy);
                    var shopDupesId = item.shopDupesFromId;
                    var newItem = Object.assign({}, $dataWeapons[item.shopDupesFromId]);
                    newItem.shopNewCurrency = shopObject;
                    newItem.shopDupesFromId = shopDupesId;
                    item = newItem;
                }
                break;
            case 2:
                item = $dataArmors[goods[1]];
                if (item.shopNewCurrency && item.shopNewCurrency.filter(ncl => ncl.isBuy).length > 0 && item.shopDupesFromId) {
                    var shopObject = item.shopNewCurrency.filter(ncl => ncl.isBuy);
                    var shopDupesId = item.shopDupesFromId;
                    var newItem = Object.assign({}, $dataArmors[item.shopDupesFromId]);
                    newItem.shopNewCurrency = shopObject;
                    newItem.shopDupesFromId = shopDupesId;
                    item = newItem;
                }
                break;
        }
        if (item) {
            // 0 = dataItems, 1 = dataWeapons, 2 = dataArmors
            item.itemTypeId = goods[0];
            item.realItemName = convertIntoRealItemName(item.name);
            item.realIconIndex = item.iconIndex;
            let shopCurrency = item.shopNewCurrency.filter(ncl => ncl.isBuy);
            if (shopCurrency && shopCurrency.length > 0) {
                for (let i = 0; i < shopCurrency.length; i++) {
                    if (i > 0) {
                        this._data.push(index + offset);
                    } else {
                        this._data.push(item);
                    }
                    let type = shopCurrency[i].type;
                    let customItemName = "";
                    this._price.push(goods[2] === 0 ? item.price : goods[3]);
                    switch (type) {
                        case "variable":
                            this._priceText.push(shopCurrency[i].amount + " ");
                            customItemName = $dataSystem.variables[shopCurrency[i].id];
                            break;
                        case "item":
                            this._priceText.push(shopCurrency[i].amount + " ");
                            customItemName = $dataItems[shopCurrency[i].id].name;
                            break;
                        case "weapon":
                            this._priceText.push(shopCurrency[i].amount + " ");
                            customItemName = $dataWeapons[shopCurrency[i].id].name;
                            break;
                        case "armor":
                            this._priceText.push(shopCurrency[i].amount + " ");
                            customItemName = $dataArmors[shopCurrency[i].id].name;
                            break;
                    }
                    let currencyUnit = convertIntoItemNameOnly(customItemName);
                    let currencyIcon = findCurrencyIcon(customItemName);
                    this._currencyUnit.push(currencyUnit);
                    this._currencyIcon.push(currencyIcon);
                }
                offset += shopCurrency.length - 1;
            } else {
                this._data.push(item);
                this._price.push(goods[2] === 0 ? item.price : goods[3]);
                this._priceText.push((goods[2] === 0 ? item.price : goods[3]) + " ");
                this._currencyUnit.push(TextManager.currencyUnit);
                this._currencyIcon.push(null);
            }
        }
    }, this);
};

Window_ShopBuy.prototype.drawItem = function (index) {
    var item = this._data[index];
    var price = this._priceText[index];
    var currency = this._currencyUnit[index];
    var icon = this._currencyIcon[index];
    var rect = this.itemRect(index);
    var priceWidth = 72 + this.textWidth(price);
    rect.width -= this.textPadding();
    if (item instanceof Object) {
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item.realItemName, item.realIconIndex, rect.x, rect.y, rect.width - priceWidth);
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

Window_ShopBuy.prototype.drawItemName = function (itemName, itemIconIndex, x, y, width) {
    width = width || 312;
    var iconBoxWidth = Window_Base._iconWidth + 4;
    this.resetTextColor();
    this.drawIcon(itemIconIndex, x + 2, y + 2);
    this.drawText(itemName, x + iconBoxWidth, y, width - iconBoxWidth);
};

Window_ShopBuy.prototype.drawItemNameForCurrency = function (itemName, itemIconIndex, x, y, width) {
    width = width || 312;
    var iconBoxWidth = Window_Base._iconWidth + 4;
    this.resetTextColor();
    this.drawIcon(itemIconIndex, x + width - iconBoxWidth, y + 2);
    this.drawText(itemName, x + iconBoxWidth, y, width - iconBoxWidth);
};

Window_ShopBuy.prototype.isEnabled = function (item) {
    if (!item) return false;
    let shopCurrency = item.shopNewCurrency.filter(ncb => ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let isEnabled = true;
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;
            let type = shopCurrency[i].type;
            let id = shopCurrency[i].id;
            let currencyValue = 0;
            switch (type) {
                case "variable":
                    currencyValue = $gameVariables.value(id);
                    break;
                case "item":
                    currencyValue = $gameParty.numItems($dataItems[id]);
                    break;
                case "weapon":
                    currencyValue = $gameParty.numItems($dataWeapons[id]);
                    break;
                case "armor":
                    currencyValue = $gameParty.numItems($dataArmors[id]);
                    break;
            }

            isEnabled = isEnabled && amount <= currencyValue && !$gameParty.hasMaxItems(item);
        }
        return isEnabled;
    }
    return (this.price(item) <= $gameParty.gold() &&
        !$gameParty.hasMaxItems(item));
};

Window_ShopBuy.prototype.price = function (item) {
    if (!item) return 0;
    let shopCurrency = item.shopNewCurrency.filter(ncb => ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let amounts = [];
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;
            amounts.push(amount);
        }
        return amounts;
    }
    return this._price[this._data.indexOf(item)] || 0;
};

VynPlugin.MultipleCurrency.Window_ShopBuy_cursorDown = Window_ShopBuy.prototype.cursorDown;
Window_ShopBuy.prototype.cursorDown = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopBuy_cursorDown.apply(this, arguments);
    let item = this._data[this.index()];
    if (typeof item === "number") {
        let length = this._data[item].shopNewCurrency.length;
        let currencyOffset = length - 1;
        this._index += currencyOffset;
        this.select(this.index());
    }
    this.callChangeCurrency(this._data[this.index()]);
};

VynPlugin.MultipleCurrency.Window_ShopBuy_cursorUp = Window_ShopBuy.prototype.cursorUp;
Window_ShopBuy.prototype.cursorUp = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopBuy_cursorUp.apply(this, arguments);
    let item = this._data[this.index()];
    if (typeof item === "number") {
        let length = this._data[item].shopNewCurrency.length;
        let currencyOffset = length - 1;
        this._index -= currencyOffset;
        this.select(this.index());
    }
    this.callChangeCurrency(this._data[this.index()]);
};

Window_ShopBuy.prototype.updateCursor = function () {
    if (this._cursorAll) {
        var allRowsHeight = this.maxRows() * this.itemHeight();
        this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
        this.setTopRow(0);
    } else if (this.isCursorVisible()) {
        var rect = this.itemRect(this.index());
        let item = this._data[this.index()];
        let length = 1;
        if (item instanceof Object) {
            length = item.shopNewCurrency.filter(ncb => ncb.isBuy).length || 1;
        }
        this.setCursorRect(rect.x, rect.y, rect.width, rect.height * length);
    } else {
        this.setCursorRect(0, 0, 0, 0);
    }
};

Window_ShopBuy.prototype.callChangeCurrency = function (item) {
    if (this.isHandled('changeCurrency')) this.callHandlerWithArgs('changeCurrency', item, true);
};

//=============================================================================
// Window_ShopSell
//=============================================================================
Window_ShopSell.prototype.isEnabled = function (item) {
    if (!item) return false;
    let shopCurrency = item.shopNewCurrency.filter(ncb => !ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let isEnabled = true;
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;

            isEnabled = isEnabled && amount > 0;
        }
        return isEnabled;
    }
    return item.price > 0;
};

VynPlugin.MultipleCurrency.Window_ShopSell_cursorDown = Window_ShopSell.prototype.cursorDown;
Window_ShopSell.prototype.cursorDown = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopSell_cursorDown.apply(this, arguments);
    this.callChangeCurrency(this._data[this.index()]);
};

VynPlugin.MultipleCurrency.Window_ShopSell_cursorUp = Window_ShopSell.prototype.cursorUp;
Window_ShopSell.prototype.cursorUp = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopSell_cursorUp.apply(this, arguments);
    this.callChangeCurrency(this._data[this.index()]);
};

VynPlugin.MultipleCurrency.Window_ShopSell_cursorLeft = Window_ShopSell.prototype.cursorLeft;
Window_ShopSell.prototype.cursorLeft = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopSell_cursorLeft.apply(this, arguments);
    this.callChangeCurrency(this._data[this.index()]);
};

VynPlugin.MultipleCurrency.Window_ShopSell_cursorRight = Window_ShopSell.prototype.cursorRight;
Window_ShopSell.prototype.cursorRight = function (wrap) {
    VynPlugin.MultipleCurrency.Window_ShopSell_cursorRight.apply(this, arguments);
    this.callChangeCurrency(this._data[this.index()]);
};

Window_ShopSell.prototype.callChangeCurrency = function (item) {
    if (this.isHandled('changeCurrency')) this.callHandlerWithArgs('changeCurrency', item, false);
};

//=============================================================================
// Window_ShopNumber
//=============================================================================
Window_ShopNumber.prototype.setup = function (item, max, price, currencyUnit) {
    this._item = item;
    this._max = Math.floor(max);
    this._price = price;
    this._currencyUnit = currencyUnit;
    this._number = 1;
    this.placeButtons();
    this.updateButtonsVisiblity();
    this.refresh();
};

Window_ShopNumber.prototype.drawTotalPrice = function () {
    let price = this._price;
    let currencyUnit = this._currencyUnit;
    let total = 0;
    var width = this.contentsWidth() - this.textPadding();
    if (Array.isArray(price) && price.length > 0) {
        let total = [];
        for (let i = 0; i < price.length; i++) {
            total.push(price[i] * this._number);
        }
        this.drawMultipleCurrenciesValue(total, currencyUnit, 0, this.priceY(), width);
    } else {
        this.drawCurrencyValue(price * this._number, currencyUnit, 0, this.priceY(), width);
    }
};

//=============================================================================
// Window_ShopStatus
//=============================================================================
Window_ShopStatus.prototype.drawPossession = function (x, y) {
    var width = this.contents.width - this.textPadding() - x;
    var possessionWidth = this.textWidth('0000');
    this.changeTextColor(this.systemColor());
    this.drawText(TextManager.possession, x, y, width - possessionWidth);
    this.resetTextColor();
    var item = this._item;
    if (item.shopNewCurrency && item.shopNewCurrency.length > 0 && item.shopDupesFromId) {
        var type = item.itemTypeId;
        switch (type) {
            case 0:
                this.drawText($gameParty.numItems($dataItems[item.shopDupesFromId]), x, y, width, 'right');
                break;
            case 1:
                this.drawText($gameParty.numItems($dataWeapons[item.shopDupesFromId]), x, y, width, 'right');
                break;
            case 2:
                this.drawText($gameParty.numItems($dataArmors[item.shopDupesFromId]), x, y, width, 'right');
                break;
        }
    } else {
        this.drawText($gameParty.numItems(this._item), x, y, width, 'right');
    }
};

//=============================================================================
// Window_Gold
//=============================================================================
VynPlugin.MultipleCurrency.Window_Gold_initialize = Window_Gold.prototype.initialize;
Window_Gold.prototype.initialize = function (x, y, width = 0) {
    this._windowWidth = width > 0 ? width : 240;
    this._currencyUnit = TextManager.currencyUnit;
    this._value = $gameParty.gold();
    VynPlugin.MultipleCurrency.Window_Gold_initialize.apply(this, arguments);
};

Window_Gold.prototype.windowWidth = function () {
    return this._windowWidth;
};

Window_Gold.prototype.refresh = function () {
    var x = this.textPadding();
    var width = this.contents.width - this.textPadding() * 2;
    this.contents.clear();
    var value = this.value();
    if (Array.isArray(value)) {
        this.drawMultipleCurrenciesValue(value, this.currencyUnit(), x, 0, width);
    } else {
        this.drawCurrencyValue(value, this.currencyUnit(), x, 0, width);
    }
};

Window_Gold.prototype.currencyUnit = function () {
    return this._currencyUnit;
};

Window_Gold.prototype.value = function () {
    return this._value;
};

Window_Gold.prototype.setCurrencyUnit = function (currencyUnit) {
    this._currencyUnit = currencyUnit;
};

Window_Gold.prototype.setValue = function (value) {
    this._value = value;
};

//=============================================================================
// Scene_Shop
//=============================================================================
Scene_Shop.prototype.createGoldWindow = function () {
    this._goldWindow = new Window_Gold(0, this._helpWindow.height, Graphics.boxWidth);
    this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
    this._goldWindow.y = Graphics.boxHeight - this._goldWindow.height;
    this.addWindow(this._goldWindow);
};

Scene_Shop.prototype.createDummyWindow = function () {
    var wy = this._commandWindow.y + this._commandWindow.height;
    var wh = Graphics.boxHeight - this._goldWindow.height - wy;
    this._dummyWindow = new Window_Base(0, wy, Graphics.boxWidth, wh);
    this.addWindow(this._dummyWindow);
};

Scene_Shop.prototype.createCommandWindow = function () {
    this._commandWindow = new Window_ShopCommand(Graphics.boxWidth, this._purchaseOnly);
    this._commandWindow.y = this._helpWindow.height;
    this._commandWindow.width = Graphics.boxWidth;
    this._commandWindow.setHandler('buy', this.commandBuy.bind(this));
    this._commandWindow.setHandler('sell', this.commandSell.bind(this));
    this._commandWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._commandWindow);
};

VynPlugin.MultipleCurrency.Scene_Shop_createBuyWindow = Scene_Shop.prototype.createBuyWindow;
Scene_Shop.prototype.createBuyWindow = function () {
    VynPlugin.MultipleCurrency.Scene_Shop_createBuyWindow.call(this);
    this._buyWindow.setHandler('changeCurrency', this.changeCurrency.bind(this));
};

VynPlugin.MultipleCurrency.Scene_Shop_createSellWindow = Scene_Shop.prototype.createSellWindow;
Scene_Shop.prototype.createSellWindow = function () {
    VynPlugin.MultipleCurrency.Scene_Shop_createSellWindow.call(this);
    this._sellWindow.setHandler('changeCurrency', this.changeCurrency.bind(this));
};

VynPlugin.MultipleCurrency.Scene_Shop_activateBuyWindow = Scene_Shop.prototype.activateBuyWindow;
Scene_Shop.prototype.activateBuyWindow = function () {
    VynPlugin.MultipleCurrency.Scene_Shop_activateBuyWindow.call(this);
    var data = this._buyWindow._data[this._buyWindow.index()];
    this.changeCurrency(data, true);
};

VynPlugin.MultipleCurrency.Scene_Shop_onCategoryOk = Scene_Shop.prototype.onCategoryOk;
Scene_Shop.prototype.onCategoryOk = function () {
    VynPlugin.MultipleCurrency.Scene_Shop_onCategoryOk.call(this);
    var data = this._sellWindow._data[this._sellWindow.index()];
    this.changeCurrency(data, false);
};

Scene_Shop.prototype.onBuyOk = function () {
    this._item = this._buyWindow.item();
    this._buyWindow.hide();
    this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice(), this.currencyUnit());
    this._numberWindow.show();
    this._numberWindow.activate();
};

Scene_Shop.prototype.onSellOk = function () {
    this._item = this._sellWindow.item();
    this._categoryWindow.hide();
    this._sellWindow.hide();
    this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice(), this.currencyUnit());
    this._numberWindow.show();
    this._numberWindow.activate();
    this._statusWindow.setItem(this._item);
    this._statusWindow.show();
};

Scene_Shop.prototype.sellingPrice = function () {
    let item = this._item;
    let shopCurrency = item.shopNewCurrency.filter(ncb => !ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let amounts = [];
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;
            amounts.push(amount);
        }
        return amounts;
    }
    return Math.floor(this._item.price / 2);
};

Scene_Shop.prototype.maxBuy = function () {
    var item = this._item;
    var max = $gameParty.maxItems(item) - $gameParty.numItems(item);
    var price = this.buyingPrice();
    var money = this.money();
    if (!Array.isArray(price) && price > 0) {
        return Math.min(max, Math.floor(money / price));
    } else if (Array.isArray(price) && price.length > 0) {
        let minQuantity = Infinity;
        for (let i = 0; i < price.length; i++) {
            let currentPrice = price[i];
            let currentMoney = money[i];

            if (currentPrice > 0) {
                let currentQuantity = Math.floor(currentMoney / currentPrice);
                minQuantity = Math.min(minQuantity, currentQuantity);
            }
        }
        return Math.min(max, minQuantity);
    } else {
        return max;
    }
};

Scene_Shop.prototype.doBuy = function (number) {
    let item = this._item;
    let shopCurrency = item.shopNewCurrency.filter(ncb => ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let currentValue = [];
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;
            let type = shopCurrency[i].type;
            let id = shopCurrency[i].id;
            let totalAmount = number * amount;

            switch (type) {
                case "variable":
                    var currentMoney = $gameVariables.value(id);
                    currentMoney = currentMoney - totalAmount;
                    $gameVariables.setValue(id, currentMoney);
                    currentValue.push(currentMoney);
                    break;
                case "item":
                    $gameParty.loseItem($dataItems[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataItems[id]));
                    break;
                case "weapon":
                    $gameParty.loseItem($dataWeapons[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataWeapons[id]));
                    break;
                case "armor":
                    $gameParty.loseItem($dataArmors[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataArmors[id]));
                    break;
            }
        }

        if (item.shopDupesFromId) {
            let gainedItem;

            switch (item.itemTypeId) {
                case 0:
                    gainedItem = $dataItems[item.shopDupesFromId];
                    break;
                case 1:
                    gainedItem = $dataWeapons[item.shopDupesFromId];
                    break;
                case 2:
                    gainedItem = $dataArmors[item.shopDupesFromId];
                    break;
            }
            $gameParty.gainItem(gainedItem, number);
        } else {
            $gameParty.gainItem(item, number);
        }
        this._goldWindow.setValue(currentValue);
    } else {
        $gameParty.loseGold(number * this.buyingPrice());
        $gameParty.gainItem(item, number);
        this._goldWindow.setValue($gameParty.gold());
    }
};

Scene_Shop.prototype.doSell = function (number) {
    let item = this._item;
    let shopCurrency = item.shopNewCurrency.filter(ncb => !ncb.isBuy);
    if (shopCurrency && shopCurrency.length > 0) {
        let currentValue = [];
        for (let i = 0; i < shopCurrency.length; i++) {
            let amount = shopCurrency[i].amount;
            let type = shopCurrency[i].type;
            let id = shopCurrency[i].id;
            let totalAmount = number * amount;

            switch (type) {
                case "variable":
                    var currentMoney = $gameVariables.value(id);
                    currentMoney = currentMoney + totalAmount;
                    $gameVariables.setValue(id, currentMoney);
                    currentValue.push(currentMoney);
                    break;
                case "item":
                    $gameParty.gainItem($dataItems[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataItems[id]));
                    break;
                case "weapon":
                    $gameParty.gainItem($dataWeapons[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataWeapons[id]));
                    break;
                case "armor":
                    $gameParty.gainItem($dataArmors[id], totalAmount);
                    currentValue.push($gameParty.numItems($dataArmors[id]));
                    break;
            }
        }

        if (item.shopDupesFromId) {
            var reduceItem;

            switch (item.itemTypeId) {
                case 0:
                    reduceItem = $dataItems[item.shopDupesFromId];
                    break;
                case 1:
                    reduceItem = $dataWeapons[item.shopDupesFromId];
                    break;
                case 2:
                    reduceItem = $dataArmors[item.shopDupesFromId];
                    break;
            }
            $gameParty.loseItem(reduceItem, number);
        } else {
            $gameParty.loseItem(item, number);
        }
        this._goldWindow.setValue(currentValue);
    } else {
        $gameParty.gainGold(number * this.sellingPrice());
        $gameParty.loseItem(this._item, number);
        this._goldWindow.setValue($gameParty.gold());
    }
};

Scene_Shop.prototype.changeCurrency = function (item, isBuy) {
    if (!item) return;
    let itemCurrency = item.shopNewCurrency.filter(ncb => isBuy ? ncb.isBuy : !ncb.isBuy);
    if (itemCurrency && itemCurrency.length > 0) {
        let currencies = [];
        let amounts = [];
        for (let i = 0; i < itemCurrency.length; i++) {
            let type = itemCurrency[i].type;
            let id = itemCurrency[i].id;
            let currencyName = "";
            if (type === "variable") {
                amount = $gameVariables.value(id);
                currencyName = $dataSystem.variables[id];
            } else if (type === "item") {
                amount = $gameParty.numItems($dataItems[id]);
                currencyName = $dataItems[id].name;
            } else if (type === "weapon") {
                amount = $gameParty.numItems($dataWeapons[id]);
                currencyName = $dataWeapons[id].name;
            } else if (type === "armor") {
                amount = $gameParty.numItems($dataArmors[id]);
                currencyName = $dataArmors[id].name;
            }

            currencies.push(currencyName);
            amounts.push(amount);
        }

        this._goldWindow.setCurrencyUnit(currencies);
        this._goldWindow.setValue(amounts);
    } else {
        this._goldWindow.setCurrencyUnit(TextManager.currencyUnit);
        this._goldWindow.setValue($gameParty.gold());
    }
    this._goldWindow.refresh();
};

//=============================================================================
// Functions
//=============================================================================
function convertIntoRealItemName(text) {
    return text
        .replace(/^icon\[\d+\]/, "")
        .replace(/^<|>$/g, "");
};

function convertIntoItemNameOnly(text) {
    return text.replace(/icon\[\d+\]/g, "")
        .replace(/<[^>]*>/g, "")
        .trim()
};

function findCurrencyIcon(text) {
    return text.match(/icon\[(\d+)\]/) ? Number(text.match(/icon\[(\d+)\]/)[1]) : null;
};