//=============================================================================
// TeleportStorage.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.TeleportStorage = VynPlugin.TeleportStorage || {};

/*:
 * Teleport Storage
 *
 * @plugindesc v1.0.0 This plugin to add teleport system thingy from RM2003
 * @author Vyndicate
 * 
 * @param Variable Index
 * @desc A value you want to push into that variable. Mandatory
 * @type number
 * @default 1
 * 
 * @param Animation Index
 * @desc A value you want to give some animation for teleport. Optional
 * @type number
 * @default 0
 *
 * @help
 * Adding some original RPG Maker 2003 set teleportation point into MV
 * 
 * These command available through Plugin Command
 * 
 * Thanks to Novalife for simplicity code!
 * 
 * PushValue id mapName mapId xPos yPos facing fadeType
 * id => Determine the id of the object (Map10, IncredibleMap, etc)
 * mapName => Name of the map you want to show in choices
 * Note: Use underscore (_) to separate with space
 * mapId => Map ID you want to teleport
 * xPos, yPos => The position of x and y in specific Map ID
 * facing => 0 (no change), 2 (down), 4 (left), 6 (right), or 8 (up)
 * fadeType => 0 (Black), 1 (White), or 2 (No Fade)
 * 
 * Both facing and fadeType are optional, but so far you need to either put
 * both or not put all of them at all
 * Ex:
 * PushVariable MapId Map_Test 1 4 5
 * PushVariable MapIds Lantania_Village 11 7 13 0 0
 * 
 * FlushVariable
 * Re-initiate the variable into empty []
 * 
 * DeleteValue id
 * Delete the id from list in specified variable
 * Ex:
 * DeleteValue MapIds
 * 
 * TransferPlayer
 * Open choices of listed in specified variable and teleport into the picked
 * choices
 * ============================================================================
 * v1.0.0 
 * Initiate Plugin
 */

var parameters = PluginManager.parameters('TeleportStorage');

var variableId = Number(parameters['Variable Index']);
var animationId = Number(parameters['Animation Index']);
//-----------------------------------------------------------------------------
// Game_Message
//-----------------------------------------------------------------------------
// Make choice and do warp
Game_Interpreter.prototype.choiceForTransfer = function () {
    const list = $gameVariables.getMapObjects();

    if (list.length == 0) {
        console.warn("No available map objects");
        return;
    }

    const mapNameList = list.map(o => o.mapName);
    const mapList = list.map(o => o.mapList);

    $gameMessage.setChoices(mapNameList, 0, -2);
    $gameMessage.setChoiceBackground(0);
    $gameMessage.setChoicePositionType(1);
    $gameMessage.setChoiceCallback(i => {
        const usedMapList = mapList[i];
        this._character = $gamePlayer;

        // If animationId 0 or less, immediately teleport
        if (animationId <= 0) {
            this._character.reserveTransfer(usedMapList[0], usedMapList[1], usedMapList[2], usedMapList[3] || 0, usedMapList[4] || 0);
            this.setWaitMode('transfering');
        } else {
            this._transferIdList = usedMapList;
            this._character.setTransparent(true)
            this._character.requestAnimation(animationId);
            this.setWaitMode('animationing');
        }
    });
    this.setWaitMode('message');
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//-----------------------------------------------------------------------------
VynPlugin.TeleportStorage.updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode = function () {
    const character = this._character;
    const isTransferMode = this._waitMode === 'transfering';
    const isAnimationMode = this._waitMode === 'animationing';

    let waiting = (isTransferMode && character.isTransferring()) || (isAnimationMode && character.isAnimationPlaying());
    if (waiting) return true;

    if (isTransferMode) {
        if (animationId <= 0) {
            this._waitMode = '';
            return false;
        }
        character.requestAnimation(animationId);
        character.setTransparent(false);
        return false;
    }

    if (isAnimationMode) {
        const mapLists = this._transferIdList;
        character.reserveTransfer(mapLists[0], mapLists[1], mapLists[2], mapLists[3] || 0, mapLists[4] || 0);
        this.setWaitMode('transfering');
        waiting = true;
        return true;
    }
    return VynPlugin.TeleportStorage.updateWaitMode.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Game_Variables
//-----------------------------------------------------------------------------
// Get all Map Objects
Game_Variables.prototype.getMapObjects = function () {
    if (!$gameVariables.value(variableId)) {
        this.flushValue()
    }
    return $gameVariables.value(variableId);
};

// Get all Map Name
Game_Variables.prototype.getMapNames = function () {
    if (!$gameVariables.value(variableId)) {
        this.flushValue()
    }
    return $gameVariables.value(variableId).map(o => o.mapName);
};

// Get all Map List
Game_Variables.prototype.getMapLists = function () {
    if (!$gameVariables.value(variableId)) {
        this.flushValue()
    }
    return $gameVariables.value(variableId).map(o => o.mapList);
};

// Remove all value from variableId
Game_Variables.prototype.flushValue = function () {
    $gameVariables.setValue(variableId, []);
};

// Remove specific value from variableId
Game_Variables.prototype.deleteValue = function (args) {
    if (!$gameVariables.value(variableId)) {
        this.flushValue()
    }

    try {
        if (args.length != 1) {
            throw new Error("The args length is not 1");
        }
        const mapId = args.shift()
        const varValue = $gameVariables.value(variableId);

        const index = varValue.findIndex(item => item.mapId === mapId);

        if (index === -1) {
            throw new Error(`Cannot delete — mapId '${mapId}' not found.`);
        }

        varValue.splice(index, 1)[0];

        $gameVariables.setValue(variableId, varValue);
    } catch (e) {
        console.error("Error: ", e.message)
    }
};

// Push value into variableId
Game_Variables.prototype.pushValue = function (args) {
    if (!$gameVariables.value(variableId)) {
        this.flushValue()
    }

    try {
        if (args.length != 5 && args.length != 7) {
            throw new Error("The args length is neither 5 nor 7");
        }
        const varValue = $gameVariables.value(variableId);
        const mapId = args.shift();
        const mapName = args.shift().replace("_", " ");;
        const matches = varValue.filter(item => item.mapId === mapId);

        if (matches.length >= 1) {
            throw new Error(`Duplicate mapId detected: '${mapId}'`);
        }

        const numbersList = args.map(Number);

        ValidateArgsForPush(numbersList);

        const result = {
            mapId: mapId,
            mapName: mapName,
            mapList: numbersList
        }

        varValue.push(result);

        $gameVariables.setValue(variableId, varValue);
    } catch (e) {
        console.error("Error: ", e.message)
    }
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//-----------------------------------------------------------------------------
VynPlugin.TeleportStorage.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    VynPlugin.TeleportStorage.Game_Interpreter_pluginCommand.apply(this, arguments);
    const com = command.trim().toLowerCase();

    switch (com) {
        case "pushvariable":
            $gameVariables.pushValue(args);
            break;
        case "flushvariable":
            $gameVariables.flushValue();
            break;
        case "deletevalue":
            $gameVariables.deleteValue(args);
            break;
        case "transferplayer":
            this.choiceForTransfer();
            break;
        case "mapobjects":
            $gameVariables.getMapObjects();
            break;
        case "mapnames":
            $gameVariables.getMapNames();
            break;
        case "maplists":
            $gameVariables.getMapLists();
            break;
    }
};

//-----------------------------------------------------------------------------
// Validator
//-----------------------------------------------------------------------------
function ValidateArgsForPush(list) {
    if (list.some(isNaN)) {
        throw new Error("Some value are resulting NaN");
    }
    for (var i = 0; i < list.length; i++) {
        if (i == 0 && list[i] <= 0) {
            throw new Error("Index " + i + " must more than 0");
        }
        if (i > 0 && i <= 2 && list[i] < 0) {
            throw new Error("Index " + i + " must be positive numbers");
        }
        if (i == 3 && list[i] != 0 && list[i] != 2 && list[i] != 4 && list[i] != 6 && list[i] != 8) {
            throw new Error("Index " + i + " must be either 0 (Retain), 2 (Down), 4 (Left), 6 (Right), 8 (Up)");
        }
        if (i == 4 && (list[i] < 0 || list[i] > 2)) {
            throw new Error("Index " + i + " must between 0 - 2");
        }
        if (i > 4) {
            console.warn("Index " + i + " is skipped due to unnecesary");
        }
    }

}