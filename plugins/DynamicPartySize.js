//=============================================================================
// DynamicPartySize.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.DynamicPartySize = VynPlugin.DynamicPartySize || {};

/*:
 * Dynamic Party Size
 *
 * @plugindesc v1.0.0 This plugin to change party size dynamically
 * @author Vyndicate
 *
 * @param Max Battlers
 * @desc How many battlers you want to have in one party?
 * @type number
 * @default 4
 * 
 * @param Per Line Battlers
 * @desc How many battlers you want to have per line?
 * @type number
 * @default 4
 * 
 * @param Position X
 * @desc This formula determines the actor's home X position.
 * Default: 600 + index * 32
 * @default screenWidth - 16 - (perLineBattlers + 2) * 32 + index * 32
 *
 * @param Position Y
 * @desc This formula determines the actor's home Y position.
 * Default: 280 + index * 48
 * @default screenHeight - statusHeight - perLineBattlers * 48 + index * 48
 * 
 * @param Line Gap
 * @desc If party more than line maximum, it will determine how far is the gap
 * @type number
 * @default 100
 *
 * @help
 * You don't want 4 heroes in 1 party? No worries, we can add unlimited max
 * But having a lot of heroes cause position X and Y can be more or less than
 * Screen Size. This can fix your issue
 * 
 * Max Battlers:
 * How many do you want for using hero members in 1 party
 * 
 * Per Line Battlers:
 * How many do you want heroes per line if all party member exist in battle
 * 
 * Position X and Position Y:
 * Adjust position as you desire. This code originaly from YEP_BEC and add some
 * adjustment. You can use these to write the formula
 * screenWidth => Value of width screen
 * screenHeight => Value of height screen
 * maxSize => Maximum party size. Can be set through parameter
 * perLineBattlers => Maximum heroes per line. Can be set through parameter
 * statusHeight => Size of window below in battle
 * 600 + index * 32 and 280 + index * 48 is legacy default
 * 
 * Line Gap:
 * How long is the gap between line? You can set the number as you desire
 * 
 * ============================================================================
 * Changelog
 * 
 * v1.0.0 
 * Init plugin
 */

VynPlugin.parameters = PluginManager.parameters('DynamicPartySize');
VynPlugin.params = VynPlugin.params || {};

VynPlugin.params.maxBattlers = Number(VynPlugin.parameters['Max Battlers']);
VynPlugin.params.perLineBattlers = Number(VynPlugin.parameters['Per Line Battlers']);
VynPlugin.params.positionX = String(VynPlugin.parameters['Position X']);
VynPlugin.params.positionY = String(VynPlugin.parameters['Position Y']);
VynPlugin.params.lineGap = Number(VynPlugin.parameters['Line Gap']);

//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
VynPlugin.DynamicPartySize.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.DynamicPartySize.Database_Loaded.call(this)) return false;
    if (!VynPlugin.DynamicPartySize._loadAmountAdjustment) {
        this.setAmountAdjustment($dataArmors);
        this.setAmountAdjustment($dataWeapons);
        VynPlugin.DynamicPartySize._loadAmountAdjustment = true;
    }
    return true;
};

DataManager.setAmountAdjustment = function (armors) {
    for (var i = 1; i < armors.length; i++) {
        var obj = armors[i];
        var adjustPartySize = obj.meta["Adjust Party Size"];

        obj.adjustPartySize = Number(adjustPartySize) || 0;
    }
};

//-----------------------------------------------------------------------------
// Game_Actor
//-----------------------------------------------------------------------------
VynPlugin.DynamicPartySize.Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function(slotId, item) {
    VynPlugin.DynamicPartySize.Game_Actor_changeEquip.apply(this, arguments);
    var equips = this.equips().filter(equip => equip != null && equip.adjustPartySize != 0);
    var adjustPartySize = equips.reduce(function (acc, equip) {
        return acc + (equip ? equip.adjustPartySize : 0);
    }, 0);
    $gameParty.setPartySizeFromItemEffects(adjustPartySize);
};

//-----------------------------------------------------------------------------
// Game_Party
//-----------------------------------------------------------------------------
VynPlugin.DynamicPartySize.Game_Party_initialize = Game_Party.prototype.initialize;
Game_Party.prototype.initialize = function() {
    VynPlugin.DynamicPartySize.Game_Party_initialize.call(this);
    this.clearCustomMaxBattle();
};

Game_Party.prototype.maxBattleMembers = function () {
    var customMaxBattle = this.getCustomMaxBattle();
    if (this.isCustomMaxBattle() && customMaxBattle > 0) {
        return customMaxBattle;
    }
    return this.defaultBattleMembers();
};

Game_Party.prototype.setCustomBattleMembers = function (count) {
    this._customMaxBattle = count;
    this._isCustomMaxBattle = true;
}

Game_Party.prototype.isCustomMaxBattle = function () {
    return this._isCustomMaxBattle;
};

Game_Party.prototype.getCustomMaxBattle = function () {
    return this._customMaxBattle;
};

Game_Party.prototype.partySizeFromItemEffects = function () {
    return this._partySizeFromItemEffects || 0;
};

Game_Party.prototype.setPartySizeFromItemEffects = function (size) {
    this._partySizeFromItemEffects = size;
};

Game_Party.prototype.clearCustomMaxBattle = function () {
    this._customMaxBattle = 0;
    this._isCustomMaxBattle = false;
};

Game_Party.prototype.defaultBattleMembers = function () {
    return VynPlugin.params.maxBattlers + this.partySizeFromItemEffects();
}

Game_Party.prototype.perLineBattleMembers = function () {
    return VynPlugin.params.perLineBattlers;
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//-----------------------------------------------------------------------------
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    VynPlugin.TeleportStorage.Game_Interpreter_pluginCommand.apply(this, arguments);
    const com = command.trim().toLowerCase();

    switch (com) {
        case "setmaxbattlers":
            $gameParty.setCustomBattleMembers(Number(args[0]) || 0);
            break;
    }
};

//-----------------------------------------------------------------------------
// Sprite_Actor
//-----------------------------------------------------------------------------
// From YEP_BEC plugin
Sprite_Actor.prototype.setActorHome = function (index) {
    var homeX = 0;
    var homeY = 0;
    var screenWidth = Graphics.boxWidth;
    var screenHeight = Graphics.boxHeight;
    var maxSize = $gameParty.defaultBattleMembers();
    var perLineBattlers = $gameParty.perLineBattleMembers();
    // var partySize = $gameParty.battleMembers().length;
    var line = Math.ceil(maxSize / perLineBattlers) - 1;
    var statusHeight = 4 * Window_Base.prototype.lineHeight.call(this) + Window_Base.prototype.standardPadding.call(this) * 2;

    while (index + 1 > perLineBattlers) {
        index -= perLineBattlers;
        line -= 1;
    }
    
    var code = VynPlugin.params.positionX;
    try {
        homeX += eval(code);
        homeX = homeX - (line * VynPlugin.params.lineGap);
    } catch (e) {
        console.error("Position X Formula Error");
    }
    var code = VynPlugin.params.positionY;
    try {
        homeY += eval(code);
    } catch (e) {
        homeY = 0;
    }
    this.setHome(homeX, homeY);
};