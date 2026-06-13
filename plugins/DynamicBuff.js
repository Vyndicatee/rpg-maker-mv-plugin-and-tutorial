//=============================================================================
// DynamicBuff.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.DynamicBuff = VynPlugin.DynamicBuff || {};

/*:
 * Dynamic Buff
 *
 * @plugindesc v1.3.1 This plugin to make buff increase dynamically
 * @author Vyndicate
 *
 * @help
 * Create a dynamic buff based on state you use
 * 
 * Notetag (States):
 * <BUFFS: [
 * {"paramId": 0, "buff": 2, "based": true, "type": 0},
 * {"paramId": 1, "buff": 1.3}
 * ]>
 * 
 * paramId (Mandatory) => parameter id (Refer to game data)
 * buff (Optional) => Multiplier or Flat, depends on type, default will 
 * multiplied by 1 or added by 0. Can use negative value
 * based (Optional) => Whether you want multiply from base only or with other calc
 * type (Optional) => between 0 and 1 (Only when based = false)
 * if 0, The buff will do multiplication
 * if 1, The buff will do addition
 * 
 * Default value:
 * based = false
 * type = 0
 * 
 * In that example, paramId 0 and 1 is Max HP and Max MP
 * 
 * Example of using based = true:
 * Def from stats = 10, def from other source (Armor, weapon, etc) = 20
 * Total def = 30
 * Buff = 2x
 * Total def after buff = 10 * 2 + 20 = 40
 * if based false, it will like this => (10 + 20) * 2 = 60
 * 
 * You can write either in one line or like example above
 * 
 * You can also write string like:
 * <BUFFS: [
 * {"paramId": 0, "buff": "v[3] + value / 200 + this.paramOrigin(4) / 5"},
 * {"paramId": 1, "buff": 1.3}
 * ]>
 *
 * v => variable value
 * value => param value of that id (in this case is mhp)
 * this.paramOrigin(x) => parameter value, same as param but in other function
 * to avoid recursive loop
 * 
 * You can use other like this.paramBase, this.paramPlus, etc. But avoid
 * this.param(), use this.paramOrigin() instead
 * 
 * Notetag (Weapon, Armor):
 * <BUFFS: [
 * {"paramId": 2, "buff": 0.5, "type": 0, "armorId": 2, "armorSlot": 2},
 * {"paramId": 2, "buff": -0.5, "type": 0, "armorId": 2, "armorSlot": 3}
 * ]>
 * 
 * Pretty much similar to states but without based, with addition armorId,
 * armorSlot, weaponId, and weaponSlot
 * 
 * Buff value 0 is neutral, buff value 1 will double the value (Ex: atk +15,
 * buff: 1 will become atk +30). Remove the upgrade, set to -1. Assuming all
 * of this using type: 0
 * 
 * armorId can exist alone, but armorSlot need armorId. Similar to weapon
 * 
 * So far, the usage between armor and weapon separated. So it will like this
 * <BUFFS: [
 * {"paramId": 2, "buff": 0.5, "type": 0, "armorId": 2, "armorSlot": 2},
 * {"paramId": 2, "buff": -0.5, "type": 0, "weaponId": 2, "weaponSlot": 3}
 * ]>
 * 
 * Regarding how big the value is, you can go crazy whatever you want
 * 
 * From changelog 1.3.3: Thank you for someone mentioned me in Discord
 * regarding this bug
 * 
 * ============================================================================
 * Terms of Use:
 * Free for commercial and non commercial use with credits
 * 
 * ============================================================================
 * Changelog
 * v1.3.3
 * Simplified code
 * Fix multiple state use the latest one
 * 
 * v1.3.1
 * Fix enemy cause error when get .equips()
 * 
 * v1.3.0
 * Add notetag for weapon and armor
 * 
 * v1.2.0
 * Add type, change buff between flat add or multiply it, and this.paramOrigin() 
 * function
 * 
 * v1.1.0 
 * Add custom value, multiplier based on what you need, with variable and value
 * 
 * v1.0.0 
 * Init plugin
 */

var parameters = PluginManager.parameters('DynamicBuff');

//=============================================================================
// DataManager
//=============================================================================
VynPlugin.DynamicBuff.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.DynamicBuff.Database_Loaded.call(this)) return false;
    if (!VynPlugin.DynamicBuff._loadStateBuff) {
        this.setBuffs($dataStates, false, "states");
        this.setBuffs($dataWeapons, true, "weapons");
        this.setBuffs($dataArmors, true, "armors");
        VynPlugin.DynamicBuff._loadStateBuff = true;
    }
    return true;
};

DataManager.setBuffs = function (items, isWeaponAndArmor, dataType) {
    for (var i = 1; i < items.length; i++) {
        var obj = items[i];
        var buffs = obj.meta.BUFFS;
        let parsedBuffs = undefined;

        try {
            parsedBuffs = buffs != undefined ? JSON.parse(buffs) : undefined;
        } catch (error) {
            console.error("Error! the notetag cannot be parsed!");
            let errorExpected = "Expected format: " + isWeaponAndArmor ? "[{\"paramId\": Number, \"buff\": Number / String, \"type\": Number, \"armorId\": Number, \"armorSlot\": Number}, {same format}, ...]" : "[{\"paramId\": Number, \"buff\": Number / String, \"based\": Boolean, \"type\": Number}, {same format}, ...]";
            console.error(errorExpected);
            console.error(error);
        }
        if (!isWeaponAndArmor && parsedBuffs && parsedBuffs.some(obj => obj.paramId == undefined)) {
            let errorFrom = (isWeaponAndArmor ? "weapon / armor " : "states ");
            throw new Error("paramId for id " + i + " in " + errorFrom + "does not exist! Please add it first");
        }
        if (isWeaponAndArmor && parsedBuffs && parsedBuffs.some(obj => !obj.armorId && obj.armorSlot)) {
            console.warn("The mandatory slot doesn't exist! => armorId");
            console.warn("Buff will not set");
            return;
        }
        obj.buffs = parsedBuffs;
        obj.itemType = dataType;
    }
};

//=============================================================================
// Game BattlerBase
//=============================================================================
Game_BattlerBase.prototype.param = function (paramId) {
    var value = this.paramBase(paramId) + this.paramPlus(paramId);
    value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
    value = this.paramStateBuff(paramId, value);
    value = this.paramArmorWeaponBuff(paramId, value);
    var maxValue = this.paramMax(paramId);
    var minValue = this.paramMin(paramId);
    return Math.round(value.clamp(minValue, maxValue));
};

// Prevent recursive from original code
Game_BattlerBase.prototype.paramOrigin = function (paramId) {
    var value = this.paramBase(paramId) + this.paramPlus(paramId);
    value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
    var maxValue = this.paramMax(paramId);
    var minValue = this.paramMin(paramId);
    return Math.round(value.clamp(minValue, maxValue));
};

Game_BattlerBase.prototype.paramStateBuff = function (paramId, value) {
    let states = this.states();
    if (!(states && states.length != 0)) return value;

    let buffedMultiplier = 1;
    let buffedBased = 0;
    let tempValue = 0;
    let result = value;

    for (const state of states) {
        if (!state.buffs) continue;

        const buffedState = state.buffs.filter(o => o.paramId == paramId);
        if (buffedState.length == 0) continue;

        let type = buffedState[0].type || 0;
        let buff = buffedState[0].buff;
        let based = buffedState[0].based || false;

        if (typeof buff == "number") {
            if (based) {
                let buffedBased = this.paramBase(paramId) * buff;
                if (isNaN(buffedBased)) buffedBased = 0;
            } else {
                buffedMultiplier = buff;
            }
        } else if (typeof buff == "string") {
            let v = $gameVariables._data;
            let evalBuff = eval(buff);
            if (isNaN(evalBuff)) evalBuff = 1;
            if (based) {
                buffedBased = this.paramBase(paramId) * evalBuff;
            } else {
                buffedMultiplier = evalBuff;
            }
        }

        if (based) {
            tempValue = tempValue + buffedBased;
            result = tempValue + value;
        } else {
            if (type == 1) {
                tempValue = tempValue + buffedMultiplier;
                result = tempValue + value;
            } else {
                tempValue = tempValue + value * buffedMultiplier;
                result = tempValue;
            }
        }

    }

    return result;
};

Game_BattlerBase.prototype.paramArmorWeaponBuff = function (paramId, value) {
    if (this.isActor() && this.equips()) {
        let equips = this.equips();
        for (const equip of equips) {
            if (!equip || !equip.buffs) continue;
            let filteredBuffs = equip.buffs.filter(o => o.paramId == paramId);

            for (const filteredBuff of filteredBuffs) {
                let armorId = filteredBuff.armorId;
                let armorSlot = filteredBuff.armorSlot;
                let weaponId = filteredBuff.weaponId;
                let weaponSlot = filteredBuff.weaponSlot;
                let equippedArmorId;
                let equippedWeaponId;

                if (armorSlot) {
                    equippedArmorId = equips.findIndex((equip, index) => equip != null && equip.itemType == "armors" && equip.id == armorId && armorSlot - 1 == index);
                } else {
                    equippedArmorId = equips.findIndex((equip) => equip != null && equip.itemType == "armors" && equip.id == armorId);
                }
                if (weaponSlot) {
                    equippedWeaponId = equips.findIndex((equip, index) => equip != null && equip.itemType == "weapons" && equip.id == weaponId && weaponSlot - 1 == index);
                } else {
                    equippedWeaponId = equips.findIndex((equip) => equip != null && equip.itemType == "weapons" && equip.id == weaponId);
                }

                if ((armorSlot || !armorSlot && armorId) && equippedArmorId != -1 || (weaponSlot || !weaponSlot && weaponId) && equippedWeaponId != -1) {
                    let buffJson = filteredBuff.buff;
                    if (typeof buffJson == "number") {
                        if (filteredBuff.type == 0) {
                            let buffedValue = equip.params[paramId] * buffJson;
                            value += buffedValue
                        } else if (filteredBuff.type == 1) {
                            value += buffJson;
                        }
                    } else if (typeof buffJson == "string") {
                        let v = $gameVariables._data;
                        let evalBuff = eval(buffJson);
                        if (filteredBuff.type == 0) {
                            if (isNaN(evalBuff)) evalBuff = 1;
                            let buffedValue = equip.params[paramId] * evalBuff;
                            value += buffedValue
                        } else if (filteredBuff.type == 1) {
                            if (isNaN(evalBuff)) evalBuff = 0;
                            value += evalBuff;
                        }
                    }
                }
            }
        }
    }
    return value;
};