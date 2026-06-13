//=============================================================================
// EventCaller.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.EventCaller = VynPlugin.EventCaller || {};

/*:
 * Event Caller
 *
 * @plugindesc v1.0.0 This plugin to add call event system like in RM2003
 * @author Vyndicate
 *
 * @help
 * Adding some original RPG Maker 2003 calling event into MV
 * 
 * These command available through Plugin Command
 * 
 * PluginCommand
 * ECall Event x Page y MapId z
 * Event (Mandatory): The event ID you want to call
 * Page (Optional): Page you want to call from specific Event ID. Default 1
 * MapId (Optional): The event you call from specific Map. Default current map
 * 
 * Example:
 * ECall Event 22 Page 1 MapId 1
 * 
 * This will call the Event ID number 22, page number 1, and mapId number 1
 * 
 * ============================================================================
 * v1.0.0 
 * Initiate Plugin
 */

var $mapEvent;
//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
DataManager.loadEventMapData = function (index) {
    if (index < 1) {
        this.makeEmptyEventMap();
        return;
    };
    const mapIndex = index.padZero(3);
    const mapSource = "Map" + mapIndex + ".json";

    this.loadDataFile('$mapEvent', mapSource);
};

DataManager.makeEmptyEventMap = function () {
    $mapEvent = {};
    $mapEvent.data = [];
    $mapEvent.events = [];
    $mapEvent.width = 100;
    $mapEvent.height = 100;
    $mapEvent.scrollType = 3;
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//-----------------------------------------------------------------------------
VynPlugin.EventCaller.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    VynPlugin.EventCaller.Game_Interpreter_pluginCommand.apply(this, arguments);
    const com = command.trim().toLowerCase();

    if (com === "ecall") {
        this.eventProcessing(args);
    }
};

Game_Interpreter.prototype.eventProcessing = function (args) {
    if (this.eventCallerRunning) {
        this.eventCaller();
        return;
    };
    ValidateEventProcess(args);

    const data = {};
    for (let i = 0; i < args.length; i += 2) {
        data[args[i]] = args[i + 1];
    }

    let eventId = Number(data["Event"]);
    let mapId = !!data["MapId"] ? data["MapId"] : $gameMap.mapId();
    let pageId = !!data["Page"] ? Number(data["Page"]) : 1;

    $mapEvent = undefined;
    DataManager.loadEventMapData(mapId);
    this.eventCallerEventId = eventId;
    this.eventCallerPageId = pageId;
    this.eventCallerRunning = true;
    this.eventCaller();
}

Game_Interpreter.prototype.eventCaller = function () {
    if ($mapEvent) {
        this.eventCallerRunning = false;
        let eventId = this.eventCallerEventId;
        let pageId = this.eventCallerPageId;
        let event = $mapEvent.events[eventId];
        if (event) {
            let page = event.pages[pageId - 1];
            if (page) {
                this.setupChild(page.list, eventId);
            }
        }
    } else {
        this.wait(1);
        this._index--;
    }
}

function ValidateEventProcess(args) {
    if (args.length != 2 && args.length != 4 && args.length != 6) {
        throw new Error("Length must be either 2, 4, and 6!")
    }
    if ((args.length >= 2 && Number.isNaN(Number(args[1]))) || (args.length >= 4 && Number.isNaN(Number(args[3]))) || (args.length >= 6 && Number.isNaN(Number(args[5])))) {
        throw new Error("Invalid type of value! Put a number value after text value!")
    }
    if (!args.some(o => o == "Event")) {
        throw new Error("Event doesn't exist!")
    }
}