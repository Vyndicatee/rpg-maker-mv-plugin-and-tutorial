//=============================================================================
// CritControl.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.Crits = VynPlugin.Crits || {};

/*:
 * Crit Control
 *
 * @plugindesc v1.2.0 This plugin to rework regarding crit damage. Made for myself
 * @author Vyndicate
 *
 * @param Crit Damage Multiplier
 * @desc Set multiplier when crit while dealing damage. Default 3
 * @type number
 * @default 3
 * 
 * @param Minimum Crit Damage
 * @desc Set the lowest minimum crit damage will dealt. Default 1.5
 * @type number
 * @default 1.5
 *
 * @help
 * Crit damage were static with 3x, which is quite annoying. I made myself
 * to make crit damage more dynamic
 * 
 * I also made some states can deal higher crit rate
 * 
 * ============================================================================
 * Actor, Enemy, Skill, Status, Armor, Weapon, Item Notetag
 * <CDMG: x / +x / -x>
 * <PCDMG: x / +x / -x>
 * <MCDMG: x / +x / -x>
 * 
 * This will change regarding Crit Damages for dealing damage
 * 
 * Replace x with any number you want to put
 * Example: <CDMG: 2> means 2x or 200% multiplier, damage will deal 2x
 * You can use decimal as well
 * 
 * For Physical and Magical same as above, but on different element
 * If the magic / special attack hit type is physical based damage, it will 
 * deal Physical Crit Damage, otherwise Magical Crit Damage
 * 
 * If these not set, it will automatically set from plugin parameter
 * ============================================================================
 * Skill, Status, Item Notetag
 * <CR: x / +x / -x>
 * 
 * This will change crit rate behaviour when using skill / items
 * Example:
 * Attacker using skill 1 that has <CR: 0.2> (20%)
 * His skill 1 will increase crit rate by 20%, while other skill/item/attack
 * doesn't changed if there's no Notetags
 * 
 * Or target has affect state that can increase attacker crit rate
 * 
 * Example: 
 * Enemy 1 has state 4, Enemy 2 doesn't have states
 * State 4 cause any attacker will increase crit rate to this target 
 * (Assume +10%)
 * If attacker target Enemy 1, attacker crit rate will be increased by 10%
 * 
 * Replace x with any number you want to put
 * Example: <CR: 2> means 200% higher
 * ============================================================================
 * Minimum crit damage setup
 * The lowest damage multiplier based on parameter setup. If any modifier that
 * cause the total multiplier less than parameter setup, it will reset the 
 * value into those settings instead
 * 
 * ============================================================================
 * Crit calculation
 * Crit damage = minimum / actor notetag + crit damage other source (enemy
 * give field effect, etc) + crit damage from armor, weapon, skill, status
 * 
 * If it's certain hit, it will get normal crit dmg instead physical / magical
 * crit damage
 * ============================================================================
 * The value order
 * 
 * PCDMG & MCDMG > CDMG > Parameter Plugin
 * 
 * If PCDMG and MCDMG exist, it will use those instead CDMG
 * If PCDMG and MCDMG doesn't exist, it will replaced by CDMG or using default 
 * value depends on parameter setting
 * 
 * ============================================================================
 * Crit damage from other source
 * 
 * Pair with yanfly plugin, you can manipulate crit damage in _cdmgOtherSource.
 * Most common is on Skill and Status tab
 * 
 * NOTE:
 * If you use custom apply and remove status, make sure you use like this
 * <Custom Apply Effect>
 * if(!target._critBuffed) { Important!
 *    target._cdmgOtherSource += 1
 *    target._critBuffed = true; Important!
 * }
 * </Custom Apply Effect>
 * 
 * <Custom Remove Effect>
 * if(target._critBuffed) { Important!
 *    target._cdmgOtherSource -= 1
 *    target._critBuffed = false; Important!
 * }
 * </Custom Remove Effect>
 * 
 * This will prevent reapply buff multiple times
 * ============================================================================
 * Additional Function
 * 
 * $gameParty.averageCritRateParty() => Calculate battle member crit rate
 * $gameParty.averageCritDamageParty() => Calculate battle member crit damage
 * 
 * NOTE:
 * All Physical and Magical crit damage is deprecated. You can readd it if you
 * want and know what you're doing
 * 
 * ============================================================================
 * v1.2.0
 * Deprecate whole Physical and Magical Crits
 * 
 * v1.0.0
 * Initiate Plugin
 * 
 */

//=============================================================================
// Parameter Variables
//=============================================================================
VynPlugin.Crits.parameters = PluginManager.parameters('CritControl');
VynPlugin.Crits.critDamageMultiplier = Number(VynPlugin.Crits.parameters['Crit Damage Multiplier']) || 3;
VynPlugin.Crits.minimumCritDamage = Number(VynPlugin.Crits.parameters['Minimum Crit Damage']) || 1.5;

//=============================================================================
// DataManager
//=============================================================================
VynPlugin.Crits.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.Crits.Database_Loaded.call(this)) return false;
    if (!VynPlugin.Crits._loadCritDmg) {
        this.setCrits($dataWeapons, false);
        this.setCrits($dataArmors, false);
        this.setCrits($dataStates, true);
        this.setCrits($dataSkills, true);
        this.setCrits($dataEnemies, false);
        this.setCrits($dataActors, false);
        VynPlugin.Crits._loadCritDmg = true;
    }
    return true;
};

DataManager.setCrits = function (items, isSkillAndStates) {
    for (var i = 1; i < items.length; i++) {
        var obj = items[i];
        var cdmg = Number(obj.meta.CDMG);
        // var pcdmg = Number(obj.meta.PCDMG);
        // var mcdmg = Number(obj.meta.MCDMG);

        obj.critDamage = cdmg || 0;
        // obj.physicalCritDamage = pcdmg || 0;
        // obj.magicalCritDamage = mcdmg || 0;
        // obj.isPhysicalCritExist = obj.meta.PCDMG !== undefined;
        // obj.isMagicalCritExist = obj.meta.MCDMG !== undefined;

        if (isSkillAndStates) {
            var cr = Number(obj.meta.CR);
            obj.critRate = cr || 0;
            obj.isCritRateModified = obj.meta.CR !== undefined;
        }
    }
};

//=============================================================================
// Game Actor
//=============================================================================
VynPlugin.Crits.Game_Actor_Setup_Crit = Game_Actor.prototype.setup
Game_Actor.prototype.setup = function (actorId) {
    VynPlugin.Crits.Game_Actor_Setup_Crit.call(this, actorId);
    var actor = $dataActors[actorId];
    this._critDamage = actor.critDamage;
    // this._physicalCritDamage = actor.physicalCritDamage;
    // this._magicalCritDamage = actor.magicalCritDamage;
    // this._isPhysicalCritExist = actor.isPhysicalCritExist;
    // this._isMagicalCritExist = actor.isMagicalCritExist;
    this._cdmgOtherSource = 0; // Other than Weapon and Armor
};

VynPlugin.Crits.Game_Enemy_Setup = Game_Enemy.prototype.setup
Game_Enemy.prototype.setup = function (enemyId, x, y) {
    VynPlugin.Crits.Game_Enemy_Setup.call(this, enemyId, x, y);
    var enemy = $dataEnemies[enemyId];
    this._critDamage = enemy.critDamage;
    // this._physicalCritDamage = enemy.physicalCritDamage;
    // this._magicalCritDamage = enemy.magicalCritDamage;
    // this._isPhysicalCritExist = enemy.isPhysicalCritExist;
    // this._isMagicalCritExist = enemy.isMagicalCritExist;
};

//=============================================================================
// Function
//=============================================================================
(function () {
    Game_Item.prototype.getSkill = function (skillId) {
        return $dataSkills[skillId]
    }

    Game_Item.prototype.getItem = function (skillId) {
        return $dataItems[skillId]
    }

    Game_Actor.prototype.getCritDamage = function (critType) {
        return critType === 'normal' ? this._critDamage || 0 : critType === 'physical' ? this._physicalCritDamage || 0 : critType === 'magical' ? this._magicalCritDamage || 0 : 0;
    }

    Game_Actor.prototype.getCritDamageFromAllSource = function (critType = 'normal') {
        var critDamages = VynPlugin.Crits.critDamageMultiplier;
        if (!isNaN(this._critDamage) && this._critDamage != 0) {
            // critDamages = critType === 'normal' ? this._critDamage || 0 : critType === 'physical' ? this._physicalCritDamage || this._critDamage || 0 : critType === 'magical' ? this._magicalCritDamage || this._critDamage || 0 : 0;
            critDamages = this._critDamage;
        }
        var equips = this.equips();
        var states = this.states();
        for (var i = 0; i < equips.length; i++) {
            if (equips[i] == null) continue;
            // critDamages = critDamages + (critType === 'normal' ? equips[i].critDamage || 0 : critType === 'physical' ? equips[i].physicalCritDamage || equips[i].critDamage || 0 : critType === 'magical' ? equips[i].magicalCritDamage || equips[i].critDamage || 0 : 0);
            critDamages = critDamages + (equips[i].critDamage || 0);
        }
        for (var i = 0; i < states.length; i++) {
            if (states[i] == null) continue;
            // critDamages = critDamages + (critType === 'normal' ? states[i].critDamage || 0 : critType === 'physical' ? states[i].physicalCritDamage || states[i].critDamage || 0 : critType === 'magical' ? states[i].magicalCritDamage || states[i].critDamage || 0 : 0);
            critDamages = critDamages + (equips[i].critDamage || 0);
        }
        if (critDamages < VynPlugin.Crits.minimumCritDamage) {
            critDamages = VynPlugin.Crits.minimumCritDamage;
        }
        return Number(critDamages.toFixed(1));
    }

    Game_Action.prototype.applyCritical = function (target, damage) {
        let critMultiplier = VynPlugin.Crits.critDamageMultiplier;
        let itemId = this._item.itemId();
        let item = this._item._dataClass == 'skill' ? this._item.getSkill(itemId) : this._item.getItem(itemId);
        let hitType = item.hitType;
        let stateFromEnemyBadStatus = this.critCalcs(target.states(), hitType);
        let critFromSkills = this.selfCritDmgSkill(this.item(), hitType);
        if (this._subjectActorId != 0) {
            let actor = this.subject();

            let equipmentCrit = this.critCalcs(actor.equips(), hitType);
            let stateFromSelfStatus = this.critCalcs(actor.states(), hitType);
            // let initCrit = hitType == 1 && actor._isPhysicalCritExist ? actor._physicalCritDamage : hitType == 2 && actor._isMagicalCritExist ? actor._magicalCritDamage : actor._critDamage != 0 ? actor._critDamage : VynPlugin.Crits.minimumCritDamage;
            let initCrit = actor._critDamage != 0 ? actor._critDamage : VynPlugin.Crits.minimumCritDamage;
            critMultiplier = initCrit + equipmentCrit + stateFromEnemyBadStatus + stateFromSelfStatus + critFromSkills + actor._cdmgOtherSource;
            critMultiplier = critMultiplier < VynPlugin.Crits.minimumCritDamage ? VynPlugin.Crits.minimumCritDamage : critMultiplier;
        } else {
            let enemy = this.subject()

            let stateFromSelfStatus = this.critCalcs(enemy.states(), hitType);
            // let initCrit = hitType == 1 && enemy._isPhysicalCritExist ? enemy._physicalCritDamage : hitType == 2 && enemy._isMagicalCritExist ? enemy._magicalCritDamage : enemy._critDamage != 0 ? enemy._critDamage : VynPlugin.Crits.minimumCritDamage;
            let initCrit = actor._critDamage != 0 ? actor._critDamage : VynPlugin.Crits.minimumCritDamage;

            critMultiplier = initCrit + stateFromEnemyBadStatus + stateFromSelfStatus + critFromSkills;
            critMultiplier = critMultiplier < VynPlugin.Crits.minimumCritDamage ? VynPlugin.Crits.minimumCritDamage : critMultiplier;
        }
        return damage * Number(critMultiplier.toFixed(1));
    };

    Game_Action.prototype.critCalcs = function (data, hitType) {
        var dataCrits = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i] == null) continue;
            // dataCrits = dataCrits + (hitType == 1 && data[i].isPhysicalCritExist ? data[i].physicalCritDamage : hitType == 2 && data[i].isMagicalCritExist ? data[i].magicalCritDamage : data[i].critDamage);
            dataCrits = dataCrits + data[i].critDamage;
        }
        return Number(dataCrits.toFixed(1));
    }

    Game_Action.prototype.selfCritDmgSkill = function (skill, hitType) {
        var skillCrit = 0;
        // skillCrit = skillCrit + (hitType == 1 && skill.isPhysicalCritExist ? skill.physicalCritDamage : hitType == 2 && skill.isMagicalCritExist ? skill.magicalCritDamage : skill.critDamage);
        skillCrit = skillCrit + skill.critDamage;

        return Number(skillCrit.toFixed(1));
    }

    Game_Action.prototype.itemCri = function (target) {
        if (!this.item().damage.critical) return 0;
        var enemyStates = target.states();
        var crBuffStates = this.critRateBuffFromStates(enemyStates);
        var crBuffSkill = this.item().critRate;

        return (this.subject().cri + crBuffStates + crBuffSkill) * (1 - target.cev);
    };

    Game_Action.prototype.critRateBuffFromStates = function (states) {
        var crBuff = 0;
        for (var i = 0; i < states.length; i++) {
            if (states[i] == null) continue;
            crBuff = crBuff + states[i].critRate;
        }
        return crBuff;
    }

    Game_Action.prototype.makeDamageValue = function (target, critical) {
        var item = this.item();
        var baseValue = this.evalDamageFormula(target);
        var value = baseValue * this.calcElementRate(target);
        if (this.isPhysical()) {
            value *= target.pdr;
        }
        if (this.isMagical()) {
            value *= target.mdr;
        }
        if (baseValue < 0) {
            value *= target.rec;
        }
        if (critical) {
            value = this.applyCritical(target, value);
        }
        value = this.applyVariance(value, item.damage.variance);
        value = this.applyGuard(value, target);
        value = Number(value.toFixed(0));
        return value;
    };

    Game_Party.prototype.averageCritRateParty = function () {
        var battler = this.battleMembers();
        var critRates = 0;
        for (var i = 0; i < battler.length; i++) {
            critRates = critRates + battler[i].cri;
        }
        return Number((critRates / battler.length).toFixed(1));
    }

    Game_Party.prototype.averageCritDamageParty = function (critType = 'normal') {
        var battler = this.battleMembers();
        var critDamages = 0;
        for (var i = 0; i < battler.length; i++) {
            critDamages = critDamages + battler[i].getCritDamageFromAllSource(critType);
        }
        return Number((critDamages / battler.length).toFixed(1));
    }
}());

