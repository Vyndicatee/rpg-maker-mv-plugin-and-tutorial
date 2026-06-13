//=============================================================================
// Shield.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.Shield = VynPlugin.Shield || {};

/*:
 * Shield
 *
 * @plugindesc v1.1.5 This plugin to add shield and team shield
 * @author Vyndicate
 * 
 * @param Reset Shield
 * @desc Define if you want to reset shield after end battle
 * @type boolean
 * @default true
 * 
 * @param Allies Gauge Shield
 * @desc Define if you want to use gauge or just number
 * @type boolean
 * @default true
 * 
 * @param Party Shield Percentage
 * @desc Define if you want to display the number as percentage. Only for actors
 * @type boolean
 * @default false
 * 
 * @param Troop Shield Percentage
 * @desc Define if you want to display the number as percentage. Only for enemies
 * @type boolean
 * @default false
 * 
 * @param Width Party
 * @desc Define Width for Party
 * @default 186
 * 
 * @param Width Troop
 * @desc Define Width for Troop
 * @default 186
 * 
 * @param X Position Party
 * @desc Define X Position for Party
 * @default 0
 * 
 * @param Maximum Text Width Party
 * @desc Define the maximum width for the text display
 * @default 0
 * 
 * @param Y Position Party
 * @desc Define Y Position for Party
 * @default index * (this.lineHeight() + 5)
 * 
 * @param Y Offset Party
 * @desc Define Y Offest text for Party
 * @default (this.lineHeight() + 5) / 2
 * 
 * @param X Position Troop
 * @desc Define X Position for Troop
 * @default Graphics.boxWidth - this.widthShield()
 * 
 * @param Maximum Text Width Troop
 * @desc Define the maximum width for the text display
 * @default Graphics.boxWidth - this.widthShield() / 2 + 40
 * 
 * @param Y Position Troop
 * @desc Define Y Position for Troop
 * @default index * (this.lineHeight() + 5)
 * 
 * @param Y Offset Troop
 * @desc Define Y Offest text for Troop
 * @default (this.lineHeight() + 5) / 2
 *
 * @help
 * This will add shield feature into the battle
 * The ui a bit messy because I'm not really pro about it. But mostly it's
 * functional
 * 
 * The gauge is based on ally available shield / max hp. Currently only for
 * allies. Party, Troop, and Enemies will not have gauge and they will have
 * text instead
 * 
 * Skill Notetag:
 * <Shield: x>
 * <Shield: formula>
 * Gain of x amount of shield for each target
 * You can put either flat amount or using formula with a is user and 
 * b is target
 * 
 * <Team Shield: x>
 * <Team Shield: formula>
 * Gain of x amount of shield for team, either troop or party
 * You can put either flat amount or using formula with a is user and 
 * b is target
 * 
 * <Target Shield: x>
 * Target you want to add shield using scope from game + additional scope
 * 
 * Scope from game:
 * 0: None
 * 1: 1 Enemy
 * 2: All Enemies
 * 3: 1 Random Enemy
 * 4: 2 Random Enemies
 * 5: 3 Random Enemies
 * 6: 4 Random Enemies
 * 7: 1 Ally
 * 8: All Allies
 * 9: 1 Ally (Dead)
 * 10: All Allies (Dead)
 * 11: User
 * 
 * Additional Scope:
 * 12: All Allies (Excluding User)
 * 13: Team (Either Party or Troop)
 * 
 * Available to use Target Shield Notetag => 2, 8, 11, 12, 13
 * 
 * Scope 13 is for gainTeamShield only
 * 
 * If using number other that mentioned above, it will use default scope from
 * what database has been set
 * 
 * <Shield Drain: x>
 * When using skill to damage, it will drain some of the shield from opponent
 * to user or any ally targeted scope. Number is percentage, x is value from 0
 * to 100. If you put more than 100, it will more than 100% technically
 * 
 * <Pierce: x>
 * When using skill to damage, it will bypass the damage straight to decrease HP
 * instead of decrease shield. Number is percentage, x is value from 0 to 100. 
 * If you put more than 100, it will more than 100% technically
 * 
 * State Notetag:
 * <Block Shield>
 * Using this in state will block all shield that gain with positive value, including
 * from drain shield
 * Negative value or getting damage by opponents will not affected by this
 * 
 * YEP_X_ActSeqPack1:
 * You can use inside action sequence provided by Yanfly Plugin Action Sequence Pack 1
 * 
 * =============================================================================
 * ADD SHIELD: (target), (value)
 *- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Add the amount of value to desired target. Target is same as what mentioned
 * in YEP_X_ActSeqPack1. The value can be either flat number or formula with 
 * a is user and b is target
 *- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Usage Example: add shield: actors, 300
 *                add shield: enemies, b.mhp / 4
 *                add shield: all members, a.atk * 2
 * =============================================================================
 * ADD (PARTY/TROOP) TEAM SHIELD: (value), true/false
 *- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Add the amount of value to either for party or troop. The value can be either 
 * flat number or formula with a is user and b is alive member of the team.
 * Set true if you want to calculate only from user without other party members.
 * It will set to false if using flat number or not write the boolean value
 *- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Usage Example: add party team shield: 250
 *                add troop team shield: b.mhp / 4, false
 *                add party team shield: a.mhp / 2, true
 * =============================================================================
 * 
 * Script Calls:
 * You can directly call through script call. The available functions are:
 * (actor/enemy).getShield()
 * Get current shield of character
 * 
 * (actor/enemy).setShield(value)
 * Adjust shield of character
 * 
 * (actor/enemy).addShield(value)
 * Add shield of character. Value can be negative
 * Minimum value result is 0
 * 
 * (actor/enemy).removeShield(value)
 * Remove shield of character
 * Minimum value result is 0
 * 
 * (party/troop).getTeamShield()
 * Get current team shield of party or troop
 * 
 * (party/troop).setTeamShield(value)
 * Adjust team shield of party or troop
 * 
 * (party/troop).addTeamShield(value)
 * Add team shield of party or troop. Value can be negative
 * Minimum value result is 0
 * 
 * (party/troop).removeTeamShield(value)
 * Remove team shield of party or troop
 * Minimum value result is 0
 * 
 * (actor/enemy).shieldRate()
 * Get current shield rate of character. It will return based on 
 * current shield / max hp. In code, mostly used for gauge display
 * Return between 0 to 1
 * To make it percentage. You can use like this
 * Math.floor(actor.shieldRate() * 100)
 * use + "%" if you want to make it display
 * 
 * (actor/enemy).shieldRateWithoutLimit()
 * Same as above, but it will show more than 1 instead 
 * between 0 and 1
 * 
 * From predefined variables, can be used anywhere when script call is allowed,
 * including debugging:
 * $gameParty.setTeamShield(value);
 * $gameParty.getTeamShield();
 * $gameTroop.setTeamShield(value);
 * $gameTroop.getTeamShield();
 * $gameActors.actor(id).setShield(value);
 * $gameActors.actor(id).getShield();
 * $gameTroop.aliveMembers()[index].setShield(value);
 * $gameTroop.aliveMembers()[index].getShield();
 * $gameActors.actor(id).shieldRate();
 * $gameActors.actor(id).shieldRateWithoutLimit();
 * $gameTroop.aliveMembers()[index].shieldRate();
 * $gameTroop.aliveMembers()[index].shieldRateWithoutLimit();
 * 
 * Enemy doesn't have predefined variable, so it needs to called through 
 * $gameTroop and do either a loop or direct index call
 * The function of enemy list can be anything like allMembers(), 
 * members(), aliveMembers(), etc
 * 
 * From damage formula:
 * a.getShield()
 * b.getShield()
 * a.removeShield(value)
 * b.removeShield(value)
 * 
 * Example:
 * a.atk * 4 - b.def * 2 + a.getShield() / 2
 * a.atk * 4 - b.def * 2; b.removeShield(a.atk * 3)
 * 
 * From eval on Yanfly. This might be very rare situation, but can be very 
 * useful too:
 * this._action.subject().getShield()
 * "this" is refer to BattleManager
 * _action is currently doing action
 * subject is the user who use it
 * 
 * Example
 * <target action>
 *    eval: $gameVariables.setValue(1, this._action.subject().getShield() * 2);
 * </target action>
 * 
 * ============================================================================
 * You can also set it to variables or switch depend on what your need
 * $gameVariables.setValue(1, $gameActors.actor(id).getShield());
 * $gameSwitches.setValue(1, $gameTroop.aliveMembers()[index].getShield() > 0);
 * 
 * Note: You can adjust the code as you desire. The shield calculation should be
 * work as intended
 * ============================================================================
 * Terms of Use:
 * Free for commercial and non commercial use with credits
 * 
 * ============================================================================
 * Changelog
 * v1.1.5
 * Fix static number value cause NaN error
 * Fix shield will not retain if the battler has shield, killed, and revived 
 * from death
 * Add block shield state notetag, prevent gain positive shield
 * 
 * v1.1.4
 * Add shieldRateWithoutLimit()
 * Add complete description
 * Add new parameter, display with percentage or not. Only used for actors 
 * and enemies
 * 
 * v1.1.1
 * Prevent wrong value for boolean and fix troop position shield text
 * 
 * v1.1.0
 * Add YEP_X_ActSeqPack1 compatibility
 * 
 * v1.0.2 
 * Prevent negative shield
 * 
 * v1.0.1 
 * Add battle end reset option
 * 
 * v1.0.0 
 * Init plugin
 */

VynPlugin.parameters = PluginManager.parameters('Shield');
VynPlugin.params = VynPlugin.params || {};

VynPlugin.params.ResetShield = JSON.parse(VynPlugin.parameters['Reset Shield']);
VynPlugin.params.AlliesGaugeShield = JSON.parse(VynPlugin.parameters['Allies Gauge Shield']);
VynPlugin.params.PartyShieldPercentage = JSON.parse(VynPlugin.parameters['Party Shield Percentage']);
VynPlugin.params.TroopShieldPercentage = JSON.parse(VynPlugin.parameters['Troop Shield Percentage']);
VynPlugin.params.WidthParty = VynPlugin.parameters['Width Party'];
VynPlugin.params.WidthTroop = VynPlugin.parameters['Width Troop'];
VynPlugin.params.XPositionParty = VynPlugin.parameters['X Position Party'];
VynPlugin.params.MaximumTextWidthParty = VynPlugin.parameters['Maximum Text Width Party'];
VynPlugin.params.XPositionParty = VynPlugin.parameters['X Position Party'];
VynPlugin.params.YPositionParty = VynPlugin.parameters['Y Position Party'];
VynPlugin.params.YOffsetParty = VynPlugin.parameters['Y Offset Party'];
VynPlugin.params.XPositionTroop = VynPlugin.parameters['X Position Troop'];
VynPlugin.params.MaximumTextWidthTroop = VynPlugin.parameters['Maximum Text Width Troop'];
VynPlugin.params.YPositionTroop = VynPlugin.parameters['Y Position Troop'];
VynPlugin.params.YOffsetTroop = VynPlugin.parameters['Y Offset Troop'];


//=============================================================================
// DataManager
//=============================================================================
VynPlugin.Shield.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.Shield.Database_Loaded.call(this)) return false;
    if (!VynPlugin.Shield._loadShielding) {
        this.setShield($dataSkills);
        this.setStateShield($dataStates);
        VynPlugin.Shield._loadShielding = true;
    }
    return true;
};

DataManager.setShield = function (items) {
    for (var i = 1; i < items.length; i++) {
        var obj = items[i];
        var gainShield = obj.meta["Shield"];
        var gainTeamShield = obj.meta["Team Shield"];
        var targetGainShield = Number(obj.meta["Target Shield"]) || 0;
        var drainShield = Number(obj.meta["Shield Drain"]) || 0;
        var pierce = Number(obj.meta["Pierce"]) || 0;

        obj.gainShield = gainShield;
        obj.gainTeamShield = gainTeamShield;
        obj.targetGainShield = targetGainShield;
        obj.drainShield = drainShield;
        obj.pierce = pierce;
    }
};

DataManager.setStateShield = function (items) {
    for (var i = 1; i < items.length; i++) {
        var obj = items[i];
        var blockShield = !!obj.meta["Block Shield"];

        obj.blockShield = blockShield;
    }
};

//=============================================================================
// Game_Battler
//=============================================================================
// To calculate between current shield and max hp when displaying gauge
Game_BattlerBase.prototype.shieldRate = function () {
    return Math.min(this.getShield(), this.mhp) / this.mhp;
};

// The difference is it can show more than 1 instead of only between 0 and 1
Game_BattlerBase.prototype.shieldRateWithoutLimit = function () {
    return this.getShield() / this.mhp;
};

//=============================================================================
// Game_Battler
//=============================================================================
VynPlugin.Shield.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers = function () {
    VynPlugin.Shield.Game_Battler_initMembers.call(this);
    this._shield = 0;
};

// Can be used for actor or enemy who deal damage when having amount of shield
Game_Battler.prototype.getShield = function () {
    return this._shield;
};

// Can be used to make it static value of some conditions
// Also easy to adjust shield for testing purpose
Game_Battler.prototype.setShield = function (value) {
    this._shield = value;
};

// Gain shield either using formula or flat amount
// Can use negative value too. If it's too low until reach negative, it will keep value at 0
Game_Battler.prototype.addShield = function (value) {
    if (this.isDead()) return;
    if (value > 0 && this.states().some(o => o.blockShield)) return;
    this._shield += value;
    if (this._shield < 0) this._shield = 0;
};

// Reduce available shield until minimum 0
Game_Battler.prototype.removeShield = function (value) {
    this._shield = Math.max(this.getShield() - value, 0);
};

VynPlugin.Shield.Game_Battler_performCollapse = Game_Battler.prototype.performCollapse;
Game_Battler.prototype.performCollapse = function () {
    this._shield = 0;
    VynPlugin.Shield.Game_Battler_performCollapse.call(this);
};
//=============================================================================
// Game_Unit
//=============================================================================
VynPlugin.Shield.Game_Unit_initialize = Game_Unit.prototype.initialize;
Game_Unit.prototype.initialize = function () {
    VynPlugin.Shield.Game_Unit_initialize.call(this);
    this._teamShield = 0;
};

// Can be used for actor or enemy who deal damage when having amount of team shield
Game_Unit.prototype.getTeamShield = function () {
    return this._teamShield;
}

// Can be used to make it static value of some conditions
// Also easy to adjust shield for testing purpose
Game_Unit.prototype.setTeamShield = function (value) {
    this._teamShield = value;
};

// Gain shield either using formula or flat amount
// Can use negative value too. If it's too low until reach negative, it will keep value at 0
Game_Unit.prototype.addTeamShield = function (value) {
    this._teamShield += value;
    if (this._teamShield < 0) this._teamShield = 0;
};

// Reduce available shield until minimum 0
Game_Unit.prototype.removeTeamShield = function (value) {
    this._teamShield = Math.max(this.getTeamShield() - value, 0);
};

//=============================================================================
// Game_Action
//=============================================================================
VynPlugin.Shield.Game_Action_initialize = Game_Action.prototype.initialize;
Game_Action.prototype.initialize = function (subject, forcing) {
    VynPlugin.Shield.Game_Action_initialize.apply(this, arguments);
    this.resetDrainShield();
};

VynPlugin.Shield.Game_Action_executeDamage = Game_Action.prototype.executeDamage;
Game_Action.prototype.executeDamage = function (target, value) {
    // Shield Damage => Damage will be taken from shield first before HP. Use notetag pierce to bypass this
    if (value > 0) {
        var piercePercentage = Math.min(this.item().pierce || 0, 100);
        var pierceValue = Math.floor(value * piercePercentage / 100);
        var drainShieldPercentage = Math.min(this.item().drainShield || 0, 100);

        value -= pierceValue;
        value = this.shieldCalculation(target, value, drainShieldPercentage, target.isEnemy() ? $gameTroop : $gameParty);
        value += pierceValue;
    }

    VynPlugin.Shield.Game_Action_executeDamage.apply(this, arguments);
};

Game_Action.prototype.applyShield = function (targets) {
    var item = this.item();
    var subject = this.subject();
    var targetGainShield = item.targetGainShield;
    var isEnemy = subject.isEnemy();
    var team = !isEnemy && this.isForFriend() ? $gameParty : $gameTroop;
    var scopedTargets;

    switch (targetGainShield) {
        case 0: // Default, depend on applied scope
        default:
            this.calculateDrainedShield(subject);
            for (var target of targets) {
                this.gainShield(target, subject, item);
                this.gainTeamShield(target, subject, item, team);
            }
            break;
        case 2: // All enemies
            scopedTargets = !isEnemy ? $gameTroop.aliveMembers() : $gameParty.aliveMembers();
            for (var target of scopedTargets) {
                this.gainShield(target, subject, item);
                this.gainTeamShield(target, subject, item, team);
            }
            break;
        case 8: // All Allies
            scopedTargets = !isEnemy ? $gameParty.aliveMembers() : $gameTroop.aliveMembers();
            for (var target of scopedTargets) {
                this.calculateDrainedShield(target);
                this.gainShield(target, subject, item);
                this.gainTeamShield(target, subject, item, team);
            }
            break;
        case 11: // User
            this.calculateDrainedShield(target);
            this.gainShield(subject, subject, item);
            break;
        case 12: // All Allies other than user
            scopedTargets = !isEnemy ? $gameParty.aliveMembers() : $gameTroop.aliveMembers();
            scopedTargets = scopedTargets.filter(target => target != subject);
            for (var target of scopedTargets) {
                this.calculateDrainedShield(target);
                this.gainShield(target, subject, item);
                this.gainTeamShield(target, subject, item, team);
            }
            break;
        case 13: // Team (Party / Troop)
            this.gainTeamShield(target, subject, item, team);
            break;
    }

    this.resetDrainShield();
};

// When hitting opponent, it will drain some shield and add shield to hitter
Game_Action.prototype.calculateDrainedShield = function (target) {
    target.addShield(this.getDrainShield());
};

Game_Action.prototype.gainShield = function (target, subject, item) {
    if (item.gainShield) {
        if (isNaN(Number(item.gainShield))) {
            var a = subject;
            var b = target;

            result = Math.floor(eval(item.gainShield));
            target.addShield(result);
        } else {
            target.addShield(Number(item.gainShield));
        }
    }
};

Game_Action.prototype.gainTeamShield = function (target, subject, item, team) {
    if (item.gainTeamShield) {
        if (isNaN(Number(item.gainTeamShield))) {
            var a = subject;
            var b = target;

            result = Math.floor(eval(item.gainTeamShield));
            team.addTeamShield(result);
        } else {
            team.addTeamShield(Number(item.gainTeamShield));
        }
    }
};

// Calculate shield damage when hitting opponent
Game_Action.prototype.shieldCalculation = function (target, value, drainPercentage, team) {
    var teamShield = team.getTeamShield();
    var drainShield = 0;
    if (teamShield > 0) {
        if (value >= teamShield) {
            team.removeTeamShield(teamShield);
            value -= teamShield;
            drainShield += teamShield;
            teamShield = 0;
        } else {
            team.removeTeamShield(value);
            drainShield += value;
            value = 0;
        }
    }
    if (teamShield <= 0) {
        var shield = target.getShield();
        if (value >= shield) {
            target.removeShield(shield);
            value -= shield;
            drainShield += shield;
        } else {
            target.removeShield(value);
            drainShield += value;
            value = 0;
        }
    }
    if (drainPercentage != 0) {
        this.addDrainShield(Math.floor(drainShield * drainPercentage / 100))
    }
    return value;
};

// Reset to 0
Game_Action.prototype.resetDrainShield = function () {
    this._drainShield = 0;
};

// Can be used for condition checks
Game_Action.prototype.getDrainShield = function () {
    return this._drainShield;
};

// Can be used for testing purpose
Game_Action.prototype.setDrainShield = function (drainAmount) {
    this._drainShield = drainAmount;
};

Game_Action.prototype.addDrainShield = function (drainAmount) {
    this._drainShield += drainAmount;
};

// =============================================================================
// Window_Base
// =============================================================================
Window_Base.prototype.drawShieldWithoutGauge = function (x, y, yOffset, text, currentValue, alignToRight = false) {
    var textWidth = this.textWidth(text);
    var valueWidth = this.textWidth(currentValue.toString());
    var gap = 0;
    var maximumTextWidth = this._maximumTextWidth;
    if (alignToRight) {
        gap = Math.abs(this._maximumTextWidth - (x + textWidth + valueWidth));
    }
    this.changeTextColor(this.systemColor());
    this.contents.fillRect(x - gap, y + yOffset, textWidth, this.lineHeight(), this.gaugeBackColor());
    this.drawText(text, x - gap, y + yOffset, textWidth);
    this.drawCurrentWithoutGauge(currentValue, x + textWidth - gap, y, valueWidth, this.normalColor());
}

Window_Base.prototype.drawShieldWithGauge = function (x, y, yOffset, width, text, currentValue, rate, color1, color2) {
    var textWidth = this.textWidth(text);
    this.drawShieldGauge(x + textWidth, y, width, rate, color1, color2);
    this.changeTextColor(this.systemColor());
    this.contents.fillRect(x, y + yOffset, textWidth, this.lineHeight(), this.gaugeBackColor());
    this.drawText(text, x, y + yOffset, textWidth);
    this.drawCurrentWithGauge(currentValue, x + textWidth, y, yOffset, width, this.normalColor());
}

Window_Base.prototype.drawCurrentWithGauge = function (current, x, y, yOffset, width, color) {
    var valueWidth = this.textWidth(current.toString());
    var x1 = x + width - valueWidth;
    this.changeTextColor(color);
    this.drawText(current, x1, y + yOffset, valueWidth, 'right');
};

Window_Base.prototype.drawCurrentWithoutGauge = function (current, x, y, valueWidth, color1) {
    var y1 = y + this.lineHeight() - 8;
    this.contents.fillRect(x, y1, valueWidth, this.lineHeight(), this.gaugeBackColor());
    this.changeTextColor(color1);
    this.drawText(current, x, y1, valueWidth, 'right');
};

Window_Base.prototype.drawShieldGauge = function (x, y, width, rate, color1, color2) {
    var fillW = Math.floor(width * rate);
    var gaugeY = y + this.lineHeight() - 8;
    this.contents.fillRect(x, gaugeY, width, this.lineHeight(), this.gaugeBackColor());
    this.contents.gradientFillRect(x, gaugeY, fillW, this.lineHeight(), color1, color2);
};

// =============================================================================
// Window_ShieldBars
// =============================================================================
function Window_ShieldBars() {
    this.initialize.apply(this, arguments);
}

Window_ShieldBars.prototype = Object.create(Window_Base.prototype);
Window_ShieldBars.prototype.constructor = Window_ShieldBars;

Window_ShieldBars.prototype.initialize = function () {
    Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this.opacity = 0;
    this._partyShield = 0;
    this._maximumTextWidth = eval(VynPlugin.params.MaximumTextWidthParty);
};

Window_ShieldBars.prototype.widthShield = function () {
    return eval(VynPlugin.params.WidthParty);
};

Window_ShieldBars.prototype.refresh = function (actor, index) {
    this.drawItem(actor, index);
};

Window_ShieldBars.prototype.update = function () {
    Window_Base.prototype.update.call(this);
    var actors = $gameParty.aliveMembers();
    this._partyShield = $gameParty.getTeamShield();
    this.contents.clearRect(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    var index = 0;
    if (this._partyShield > 0) {
        this.drawPartyShield(index);
        index++;
    }
    for (var i = 0; i < actors.length; i++) {
        if (!actors[i]) continue;
        if (actors[i].isDead()) continue;
        if (actors[i].getShield() <= 0) continue;
        var actor = actors[i];
        this.refresh(actor, i + index);
    }
};

Window_ShieldBars.prototype.drawItem = function (actor, index) {
    this.drawActorShield(actor, index);
};

Window_ShieldBars.prototype.drawPartyShield = function (index) {
    var partyName = "Party Shield: ";
    var x = eval(VynPlugin.params.XPositionParty);
    var y = eval(VynPlugin.params.YPositionParty);
    var yOffset = eval(VynPlugin.params.YOffsetParty);
    this.drawShieldWithoutGauge(x, y, yOffset, partyName, this._partyShield);
};

Window_ShieldBars.prototype.drawActorShield = function (actor, index) {
    var width = this.widthShield();
    var actorName = actor.name() + " Shield: ";
    var x = eval(VynPlugin.params.XPositionParty);
    var y = eval(VynPlugin.params.YPositionParty);
    var yOffset = eval(VynPlugin.params.YOffsetParty);
    var currentShield = actor.getShield();
    if (VynPlugin.params.PartyShieldPercentage) {
        currentShield = Math.floor(actor.shieldRateWithoutLimit() * 100) + "%";
    }
    if (VynPlugin.params.AlliesGaugeShield) {
        this.drawShieldWithGauge(x, y, yOffset, width, actorName, currentShield, actor.shieldRate(), this.hpGaugeColor1(), this.hpGaugeColor2());
    } else {
        this.drawShieldWithoutGauge(x, y, yOffset, actorName, currentShield);
    }
};

Window_ShieldBars.prototype.lineHeight = function () {
    return 22;
};

Window_ShieldBars.prototype.standardFontSize = function () {
    return 20;
};

// =============================================================================
// Window_EnemyShieldBars
// =============================================================================
function Window_EnemyShieldBars() {
    this.initialize.apply(this, arguments);
}

Window_EnemyShieldBars.prototype = Object.create(Window_Base.prototype);
Window_EnemyShieldBars.prototype.constructor = Window_EnemyShieldBars;

Window_EnemyShieldBars.prototype.initialize = function () {
    Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this.opacity = 0;
    this._troopShield = 0;
    this._maximumTextWidth = eval(VynPlugin.params.MaximumTextWidthTroop);
};

Window_EnemyShieldBars.prototype.refresh = function (enemy, index) {
    this.drawItem(enemy, index);
};

Window_EnemyShieldBars.prototype.widthShield = function () {
    return eval(VynPlugin.params.WidthTroop);
};

Window_EnemyShieldBars.prototype.update = function () {
    Window_Base.prototype.update.call(this);
    var enemies = $gameTroop.aliveMembers();
    this._troopShield = $gameTroop.getTeamShield();
    this.contents.clearRect(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    var index = 0;
    if (this._troopShield > 0) {
        this.drawTroopShield(index);
        index++;
    }
    for (var i = 0; i < enemies.length; i++) {
        if (!enemies[i]) continue;
        if (enemies[i].isDead()) continue;
        if (enemies[i].getShield() <= 0) continue;
        var enemy = enemies[i];
        this.refresh(enemy, i + index);
    }
};

Window_EnemyShieldBars.prototype.drawItem = function (enemy, index) {
    this.drawEnemyShield(enemy, index);
};

Window_EnemyShieldBars.prototype.drawTroopShield = function (index) {
    var troopName = "Troop Shield: ";
    var x = eval(VynPlugin.params.XPositionTroop);
    var y = eval(VynPlugin.params.YPositionTroop);
    var yOffset = eval(VynPlugin.params.YOffsetTroop);
    this.drawShieldWithoutGauge(x, y, yOffset, troopName, this._troopShield, true);
}

Window_EnemyShieldBars.prototype.drawEnemyShield = function (enemy, index) {
    var enemyName = enemy.name() + " Shield: ";
    var valueWidth = this.textWidth(enemy.getShield());
    var x = eval(VynPlugin.params.XPositionTroop);
    var y = eval(VynPlugin.params.YPositionTroop);
    var yOffset = eval(VynPlugin.params.YOffsetTroop);
    var currentShield = enemy.getShield();
    if (VynPlugin.params.TroopShieldPercentage) {
        currentShield = Math.floor(enemy.shieldRateWithoutLimit() * 100) + "%";
    }
    this.drawShieldWithoutGauge(x, y, yOffset, enemyName, currentShield, true);
}

Window_EnemyShieldBars.prototype.drawCurrent = function (current, x, y, valueWidth, color1) {
    var gaugeY = y + this.lineHeight() - 8;
    this.contents.fillRect(x, gaugeY, valueWidth, this.lineHeight(), this.gaugeBackColor());
    this.changeTextColor(color1);
    this.drawText(current, x, y + (this.lineHeight() + 5) / 2, valueWidth, 'right');
};

Window_EnemyShieldBars.prototype.lineHeight = function () {
    return 22;
};

Window_EnemyShieldBars.prototype.standardFontSize = function () {
    return 20;
};

// =============================================================================
// BattleManager
// =============================================================================
VynPlugin.Shield.BattleManager_endAction = BattleManager.endAction;
BattleManager.endAction = function () {
    VynPlugin.Shield.BattleManager_endAction.call(this);
    this._action.applyShield(this._targets);
};

VynPlugin.Shield.BattleManager_endBattle = BattleManager.endBattle;
BattleManager.endBattle = function (result) {
    if (VynPlugin.params.ResetShield) {
        $gameParty.setTeamShield(0);
        $gameTroop.setTeamShield(0);
        for (var actor of $gameParty.allMembers()) {
            actor.setShield(0);
        }
        for (var enemy of $gameTroop.allMembers()) {
            enemy.setShield(0);
        }
    }
    VynPlugin.Shield.BattleManager_endBattle.apply(this, arguments);
};

// If YEP_X_ActSeqPack1 is used
if (Imported.YEP_X_ActSeqPack1) {
    VynPlugin.Shield.BattleManager_processActionSequence = BattleManager.processActionSequence;
    BattleManager.processActionSequence = function (actionName, actionArgs) {
        // ADD SHIELD AMOUNT
        if (actionName.match(/ADD\s*SHIELD/i) || actionName.match(/REMOVE\s*SHIELD/i) || actionName.match(/SET\s*SHIELD/i)) {
            return this.actionAdjustShield(actionName, actionArgs);
        }

        // ADD TEAM SHIELD
        if (actionName.match(/ADD\s*PARTY\s*TEAM\s*SHIELD/i) || actionName.match(/ADD\s*TROOP\s*TEAM\s*SHIELD/i)) {
            return this.actionAdjustTeamShield(actionName, actionArgs);
        }
        return VynPlugin.Shield.BattleManager_processActionSequence.apply(this, arguments);
    };

    BattleManager.actionAdjustShield = function (actionName, actionArgs) {
        var targets = this.makeActionTargets(actionArgs[0]);
        if (targets.length < 1) return false;
        if (actionArgs.length < 2) {
            console.error(actionName + " action requires a shield amount argument.");
            return false;
        }
        var shieldAmount = actionArgs[1];
        var a = this._action.subject();
        targets.forEach(function (target) {
            var b = target;
            var result = Math.floor(eval(shieldAmount));
            if (actionName.match(/ADD\s*SHIELD/i)) {
                target.addShield(result);
            } else if (actionName.match(/REMOVE\s*SHIELD/i)) {
                target.removeShield(result);
            } else if (actionName.match(/SET\s*SHIELD/i)) {
                target.setShield(result);
            }
        }, this);
        return true;
    };

    BattleManager.actionAdjustTeamShield = function (actionName, actionArgs) {
        var result;
        var team = actionName.match(/PARTY/) ? $gameParty : $gameTroop;

        try {
            if (isNaN(Number(actionArgs[0]))) { // If use formula
                var isUserOnly = actionArgs.length > 1 && actionArgs[1] == "true";
                var a = this._action.subject();
                if (!isUserOnly) {
                    // When calculating from whole party
                    for (var target of team.aliveMembers()) {
                        var b = target;
                        result = Math.floor(eval(actionArgs[0]));
                        team.addTeamShield(result);
                    }
                } else {
                    // When calulating from user only
                    result = Math.floor(eval(actionArgs[0]));
                    team.addTeamShield(result);
                }
            } else {
                result = Number(actionArgs[0]);
                team.addTeamShield(result);
            }
        } catch (error) {
            console.error("Something went wrong for " + actionName + " action. Please check your notetag and make sure the formula is correct.");
            return false;
        }

        return true;
    };
}


// =============================================================================
// Scene_Battle
// =============================================================================
// For create window with behind index
VynPlugin.Shield.Scene_Battle_createSpriteset = Scene_Battle.prototype.createSpriteset;
Scene_Battle.prototype.createSpriteset = function () {
    VynPlugin.Shield.Scene_Battle_createSpriteset.call(this);
    this.createShieldBarsWindow();
};

Scene_Battle.prototype.createShieldBarsWindow = function () {
    this._shieldBarsWindow = new Window_ShieldBars();
    this._enemyShieldBarsWindow = new Window_EnemyShieldBars();
    this.addChild(this._shieldBarsWindow);
    this.addChild(this._enemyShieldBarsWindow);
};
