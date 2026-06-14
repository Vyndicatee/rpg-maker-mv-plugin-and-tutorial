//=============================================================================
// AdditionalTroopEvent.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.AdditionalTroopEvent = VynPlugin.AdditionalTroopEvent || {};

/*:
 * Additional Troop Event
 *
 * @plugindesc v1.0.0 This plugin to add some of troop event condition from RM2003
 * @author Vyndicate
 *
 * @help
 * Adding some original RPG Maker 2003 troop condition into MV
 * It will give additional 6 conditions: Switch 2, Variable, Actor Turn, Enemy
 * Turn, Party HP, Evaluation
 * 
 * Actor Turn and Enemy Turn only works when using YEP_BattleEngineCore
 * 
 * NOTE: Both Actor Turn and Enemy Turn doesn't work properly with
 * YEP_BattleEngineCore due to non sync turn count and multiple function hit.
 * If you know how to fix it including using ATB, CTB, and STB, 
 * please let me know
 * 
 * The requirement is you need to use comment to add condition on troop event
 * Comment
 * Switch 7 1
 * Same as original, but it has 2 value
 * 7 => Switch ID
 * 1 => Switch Value
 * Set value either 0 for false or any number for true
 * 
 * Example:
 * Switch 2 0 => Run Troop event if switchId 2 is false
 * Switch 4 999 => Run Troop event if switchId 4 is true
 * Switch 3 -872 => Run Troop event if switchId 3 is true
 * 
 * Variable 4 2 16
 * 4 => Variable ID
 * 2 => Variable Type, < 1, <= 2, == 3, > 4, >= 5
 * 16 => Variable Value
 * 
 * Example:
 * Variable 4 3 17 => Run Troop event if variableId 4 == 17
 * Variable 2 2 93 => Run Troop event if variableId 2 <= 93
 * Variable 8 4 23 => Run Troop event if variableId > 23
 * 
 * Actor 1 3 5
 * Enemy 3 2 5
 * First number is id
 * Second and third is for turn
 * 
 * The formula is basically same as original (a + b * x)
 * Second one is a, third one is b
 * 
 * PartyHp 59 80
 * 59 => Minimum HP to trigger
 * 80 => Maximum HP to trigger
 * 
 * Example:
 * PartyHp 33 70 => Run Troop event if party HP is between 33% and 70%
 * 
 * Evaluation formula
 * You can put whatever you want for formula
 * 
 * Example:
 * Evaluation $gameParty.allMembers().length < 3
 * Evaluation $gameParty.aliveMembers().some(member => member.states().includes(5))
 * ============================================================================
 * Changelog
 * v1.0.2
 * Add eval condition
 * 
 * v1.0.1
 * Adjust database loader
 * 
 * v1.0.0 
 * Initiate Plugin
 */

var initObject = {
    evalValid: false,
    switch2Valid: false,
    variableValid: false,
    actorTurnValid: false,
    enemyTurnValid: false,
    partyHpValid: false
}
//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
VynPlugin.AdditionalTroopEvent.Database_Loaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    if (!VynPlugin.AdditionalTroopEvent.Database_Loaded.call(this)) return false;
    if (!VynPlugin.AdditionalTroopEvent._loadAdditionalTroopEvent) {
        this.processAdditionalTroopEvent();
        VynPlugin.AdditionalTroopEvent._loadAdditionalTroopEvent = true;
    }
    return true;
};

DataManager.processAdditionalTroopEvent = function () {
    for (var n = 1; n < $dataTroops.length; n++) {
        var troop = $dataTroops[n];
        for (var m = 0; m < troop.pages.length; m++) {
            var pageList = troop.pages[m].list.filter(page => page.code == 408 || page.code == 108);
            if (pageList.length == 0) continue;
            Object.assign(troop.pages[m].conditions, initObject);

            for (var o = 0; o < pageList.length; o++) {
                let parameter = pageList[o].parameters[0];
                if (parameter.includes("Evaluation")) {
                    let parameterSplit = parameter.split(/ (.+)/);
                } else {
                    let parameterSplit = parameter.split(" ");
                }
                let newObject = parameterProcess(parameterSplit);
                Object.assign(troop.pages[m].conditions, newObject);
            }
        }
    }
}

function parameterProcess(parameterSplit) {
    var command = (parameterSplit.shift() || "").toLowerCase();
    var result = {};

    const handlers = {
        switch: function () {
            result.switch2Id = Number(parameterSplit.shift());
            result.switch2Value = !!Number(parameterSplit.shift());
            result.switch2Valid = true;
        },
        variable: function () {
            result.variableId = Number(parameterSplit.shift());
            result.variableType = Number(parameterSplit.shift()); // < 1, <= 2, == 3, > 4, >= 5
            result.variableValue = Number(parameterSplit.shift());
            result.variableValid = true;
        },
        actor: function () {
            result.actorTurnId = Number(parameterSplit.shift());
            result.actorTurnA = Number(parameterSplit.shift());
            result.actorTurnB = Number(parameterSplit.shift());
            result.actorTurnValid = true;
        },
        enemy: function () {
            result.enemyTurnId = Number(parameterSplit.shift());
            result.enemyTurnA = Number(parameterSplit.shift());
            result.enemyTurnB = Number(parameterSplit.shift());
            result.enemyTurnValid = true;
        },
        partyhp: function () {
            result.partyLowHp = Number(parameterSplit.shift());
            result.partyHighHp = Number(parameterSplit.shift());
            result.partyHpValid = true;
        },
        evaluation: function () {
            result.evalCondition = parameterSplit.shift();
            result.evalValid = true;
        }
    };

    try {
        if (handlers[command]) {
            handlers[command]();
        }
    } catch (e) {
        console.error("Something wrong when process the troop event: ", e.message);
    }
    return result;
}

//-----------------------------------------------------------------------------
// BattleManager
//-----------------------------------------------------------------------------
// BattleManager.updateEventMain = function () {
//     $gameTroop.updateInterpreter();
//     $gameParty.requestMotionRefresh();
//     if ($gameTroop.isEventRunning() || this.checkBattleEnd()) {
//         return true;
//     }
//     let isActor = !!this.actor();
//     $gameTroop.setupBattleEvent(isActor);
//     if ($gameTroop.isEventRunning() || SceneManager.isSceneChanging()) {
//         return true;
//     }
//     return false;
// };

//-----------------------------------------------------------------------------
// Game_Troop
//-----------------------------------------------------------------------------
// VynPlugin.AdditionalTroopEvent.Game_Troop_setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
// Game_Troop.prototype.setupBattleEvent = function (isActor) {
//     if (!Imported.YEP_BattleEngineCore) return VynPlugin.AdditionalTroopEvent.Game_Troop_setupBattleEvent.apply(this);

//     if (!this._interpreter.isRunning()) {
//         if (this._interpreter.setupReservedCommonEvent()) {
//             return;
//         }
//         var pages = this.troop().pages;
//         for (var i = 0; i < pages.length; i++) {
//             var page = pages[i];
//             if (isActor) {
//                 if (!this.isActorTurnActived() && this.meetsConditions(page) && !this._eventFlags[i]) {
//                     this._interpreter.setup(page.list);
//                     if (page.span <= 1) {
//                         this._eventFlags[i] = true;
//                     }
//                     break;
//                 }
//             } else {
//                 if (!this.isEnemyTurnActived() && this.meetsConditions(page) && !this._eventFlags[i]) {
//                     this._interpreter.setup(page.list);
//                     if (page.span <= 1) {
//                         this._eventFlags[i] = true;
//                     }
//                     break;
//                 }
//             }
//         }
//     }
// };

// VynPlugin.AdditionalTroopEvent.Game_Troop_meetsConditions = Game_Troop.prototype.meetsConditions;
Game_Troop.prototype.meetsConditions = function (page) {
    // VynPlugin.AdditionalTroopEvent.Game_Troop_meetsConditions.apply(this, arguments);
    var c = page.conditions;
    if (!c.turnEnding &&
        !c.turnValid &&
        !c.enemyValid &&
        !c.actorValid &&
        !c.switchValid &&
        !c.switch2Valid &&
        !c.variableValid &&
        // !c.actorTurnValid &&
        // !c.enemyTurnValid && 
        !c.partyHpValid &&
        !c.evalValid) {
        return false;  // Conditions not set
    }
    if (c.evalValid) {
        if (!eval(c.evalCondition)) {
            return false;
        }
    }
    if (c.turnEnding) {
        if (!BattleManager.isTurnEnd()) {
            return false;
        }
    }
    if (c.turnValid) {
        var n = this._turnCount;
        var a = c.turnA;
        var b = c.turnB;
        if ((b === 0 && n !== a)) {
            return false;
        }
        if ((b > 0 && (n < 1 || n < a || n % b !== a % b))) {
            return false;
        }
    }
    if (c.enemyValid) {
        var enemy = $gameTroop.members()[c.enemyIndex];
        if (!enemy || enemy.hpRate() * 100 > c.enemyHp) {
            return false;
        }
    }
    if (c.actorValid) {
        var actor = $gameActors.actor(c.actorId);
        if (!actor || actor.hpRate() * 100 > c.actorHp) {
            return false;
        }
    }
    if (c.switchValid) {
        if (!$gameSwitches.value(c.switchId)) {
            return false;
        }
    }
    if (c.switch2Valid) {
        if (!($gameSwitches.value(c.switch2Id) == c.switch2Value)) {
            return false;
        }
    }
    if (c.variableValid) {
        switch (c.variableType) {
            case 1:
                if (!($gameVariables.value(c.variableId) < c.variableValue)) {
                    return false;
                }
                break;
            case 2:
                if (!($gameVariables.value(c.variableId) <= c.variableValue)) {
                    return false;
                }
                break;
            case 3:
                if (!($gameVariables.value(c.variableId) == c.variableValue)) {
                    return false;
                }
                break;
            case 4:
                if (!($gameVariables.value(c.variableId) > c.variableValue)) {
                    return false;
                }
                break;
            case 5:
                if (!($gameVariables.value(c.variableId) >= c.variableValue)) {
                    return false;
                }
                break;
            default:
                return false;
        }
    }
    // if (Imported.YEP_BattleEngineCore && c.actorTurnValid) {
    //     if(this.isActorTurnActived()) return false;
    //     var n = $gameActors.actor(c.actorTurnId).turnCount();
    //     var a = c.actorTurnA;
    //     var b = c.actorTurnB;
    //     if ((b === 0 && n !== a)) {
    //         return false;
    //     }
    //     if ((b > 0 && (n < 1 || n < a || n % b !== a % b))) {
    //         return false;
    //     }
    //     this.setActorTurnActived(true);
    // }
    // if (Imported.YEP_BattleEngineCore && c.enemyTurnValid) {
    //     if(this.isEnemyTurnActived()) return false;
    //     var n = $gameTroop.members()[c.enemyTurnId].turnCount();
    //     var a = c.enemyTurnA;
    //     var b = c.enemyTurnB;
    //     if ((b === 0 && n !== a)) {
    //         return false;
    //     }
    //     if ((b > 0 && (n < 1 || n < a || n % b !== a % b))) {
    //         return false;
    //     }
    //     this.setEnemyTurnActived(true);
    // }
    if (c.partyHpValid) {
        var partyHp = $gameParty.totalHp();
        var partyMaxHp = $gameParty.totalMaxHp();
        var currentPartyHp = partyHp / partyMaxHp
        if (!(currentPartyHp >= c.partyLowHp / 100 && currentPartyHp <= c.partyHighHp / 100)) {
            return false;
        }
    }

    return true;
};

// Game_Troop.prototype.isActorTurnActived = function () {
//     return !!this._actorActiveTurn;
// };

// Game_Troop.prototype.setActorTurnActived = function (isActive, actorId) {
//     this._actorActiveTurn = isActive;
//     this._actorTurnId = actorId
// }

// Game_Troop.prototype.isEnemyTurnActived = function () {
//     return !!this._enemyActiveTurn;
// };

// Game_Troop.prototype.setEnemyTurnActived = function (isActive, enemyId) {
//     this._enemyActiveTurn = isActive;
//     this._enemyTurnId = enemyId
// }

//-----------------------------------------------------------------------------
// Game_Battler
//-----------------------------------------------------------------------------
// VynPlugin.AdditionalTroopEvent.Game_Battler_performActionStart = Game_Battler.prototype.performActionStart;
// Game_Battler.prototype.performActionStart = function (action) {
//     VynPlugin.AdditionalTroopEvent.Game_Battler_performActionStart.apply(this, arguments);
//     if (this.isEnemy()) {
//         $gameTroop.setEnemyTurnActived(false);
//     } else {
//         $gameTroop.setActorTurnActived(false);
//     }
// };

//-----------------------------------------------------------------------------
// Game_Party
//-----------------------------------------------------------------------------
Game_Party.prototype.totalHp = function () {
    return this.allMembers().reduce(function (a, b) {
        return a + b.hp;
    }, 0);
};

Game_Party.prototype.totalMaxHp = function () {
    return this.allMembers().reduce(function (a, b) {
        return a + b.mhp;
    }, 0);
};