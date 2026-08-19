//=============================================================================
// AdditionalBattleReward.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.AdditionalBattleReward = VynPlugin.AdditionalBattleReward || {};

/*:
 * Addition Battle Reward
 *
 * @plugindesc v1.1.0 This plugin add additional reward after win battle
 * @author Vyndicate
 *
 * @help
 * Item drop can be useful on most of the cases. But on RMMV, it was limited
 * into 3 drops only and you can only drop 1 item per monster per battle
 * 
 * With this, you can drop more than one item and also you can have multiple
 * of items that not just limited by 3 drops
 * 
 * Enemies Notetag:
 * <Drop Item/Armor/Weapon x: y>
 * This will drop any specified with id x and denominator y (Chance getting
 * the drop with 1/y like the engine intended)
 * 
 * <Drop Multiple x Item/Armor/Weapon y: z>
 * Same as normal one, but with multiple, you can get more than 1 drop per monster
 * per battle
 * This can be good if you have other currency to exchange some item in game
 * 
 * <Drop Multiple Random x-y Item/Armor/Weapon z: w>
 * Same as multiple drop, but with random, you can get random drop between x-y
 * ============================================================================
 * v1.1.0
 * Add random number, now you can get amount of reward randomly
 * 
 * v1.0.0
 * Initiate Plugin
 */

VynPlugin.parameters = PluginManager.parameters('AdditionalBattleReward');

//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
VynPlugin.AdditionalBattleReward.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.AdditionalBattleReward.Database_Loaded.call(this)) return false;
    if (!VynPlugin.AdditionalBattleReward._loadAdditionalBattleReward) {
        this.processAdditionalBattleReward($dataEnemies);
        VynPlugin.AdditionalBattleReward._loadAdditionalBattleReward = true;
    }
    return true;
};

DataManager.processAdditionalBattleReward = function (enemies) {
    for (let n = 1; n < enemies.length; n++) {
        let enemy = enemies[n];
        let object = { kind: 0, dataId: 1, denominator: 1 };
        Object.entries(enemy.meta).forEach(([key, value]) => {
            let denominator = Number(value);
            let index = 0;
            if (!denominator) {
                return;
            }
            if (denominator < 1) {
                denominator = 1;
            }
            let tempObject = Object.assign({}, object);
            tempObject.denominator = denominator;

            let metaText = key.split(" ");
            if (metaText[index].toLowerCase() !== "drop") {
                return;
            }

            index++;

            if (!Number(metaText[index])) {
                if (metaText[index].toLowerCase() == "multiple") {
                    index++;
                    let multiple = Number(metaText[index]);
                    if (isNaN(multiple)) {
                        if (metaText[index].toLowerCase() == "random") {
                            index++;
                            let randomBetween = metaText[index].split("-");
                            tempObject.randomLow = Number(randomBetween[0]);
                            tempObject.randomHigh = Number(randomBetween[1]);
                            index++;
                        }
                    } else {
                        if (multiple < 1) multiple = 1;
                        tempObject.multiple = multiple;
                        index++
                    }
                }
            }

            let type = metaText[index].toLowerCase();
            switch (type) {
                case "item":
                    tempObject.kind = 1;
                    break;
                case "weapon":
                    tempObject.kind = 2;
                    break;
                case "armor":
                    tempObject.kind = 3;
                    break;
                default:
                    return;
            }

            index++;
            let dataId = Number(metaText[index])
            if (!dataId) {
                return;
            }

            tempObject.dataId = dataId;

            enemy.dropItems.push(tempObject);
        });
    }
};

//-----------------------------------------------------------------------------
// BattleManager
//-----------------------------------------------------------------------------
BattleManager.displayDropItems = function () {
    var items = this._rewards.items;
    if (items.length > 0) {
        $gameMessage.newPage();
        items.forEach(function (item) {
            if (item.multipleDrops) {
                $gameMessage.add(item.multipleDrops + " " + TextManager.obtainItem.format(item.name));
            } else {
                $gameMessage.add(TextManager.obtainItem.format(item.name));
            }
        });
    }
};

BattleManager.gainDropItems = function () {
    var items = this._rewards.items;
    items.forEach(function (item) {
        if (item.multipleDrops) {
            $gameParty.gainItem(item, item.multipleDrops);
            delete item.multipleDrops;
        } else {
            $gameParty.gainItem(item, 1);
        }

    });
};

VynPlugin.AdditionalBattleReward.BattleManager_makeRewards = BattleManager.makeRewards;
BattleManager.makeRewards = function () {
    VynPlugin.AdditionalBattleReward.BattleManager_makeRewards.call(this);
    this._rewards.items = this._rewards.items.reduce(function (result, obj) {
        let existing = result.find(function (item) {
            return item.id === obj.id;
        });

        let multipleDrops = obj.multipleDrops || 1;

        if (existing) {
            existing.multipleDrops += multipleDrops;
        } else {
            result.push(Object.assign({}, obj, {
                multipleDrops: multipleDrops
            }));
        }

        return result;
    }, []);
};

//-----------------------------------------------------------------------------
// Game_Enemy
//-----------------------------------------------------------------------------
Game_Enemy.prototype.makeDropItems = function () {
    return this.enemy().dropItems.reduce(function (r, di) {
        if (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) {
            if (di.multiple) {
                return r.concat(this.itemObjectMultiple(di.kind, di.dataId, di.multiple));
            } else if (di.randomLow && di.randomHigh) {
                return r.concat(this.itemObjectRandom(di.kind, di.dataId, di.randomLow, di.randomHigh));
            } else {
                return r.concat(this.itemObject(di.kind, di.dataId));
            }
        } else {
            return r;
        }
    }.bind(this), []);
};

Game_Enemy.prototype.itemObjectMultiple = function (kind, dataId, multiple) {
    let data = null;
    if (kind === 1) {
        data = $dataItems[dataId];
        data.multipleDrops = multiple;
    } else if (kind === 2) {
        data = $dataWeapons[dataId];
        data.multipleDrops = multiple;
    } else if (kind === 3) {
        data = $dataArmors[dataId];
        data.multipleDrops = multiple;
    }
    return data;
};

Game_Enemy.prototype.itemObjectRandom = function (kind, dataId, randomLow, randomHigh) {
    let data = null;
    if (kind === 1) {
        data = $dataItems[dataId];
        data.multipleDrops = Math.randomInt(randomHigh - randomLow) + randomLow;
    } else if (kind === 2) {
        data = $dataWeapons[dataId];
        data.multipleDrops = Math.randomInt(randomHigh - randomLow) + randomLow;
    } else if (kind === 3) {
        data = $dataArmors[dataId];
        data.multipleDrops = Math.randomInt(randomHigh - randomLow) + randomLow;
    }
    return data;
};