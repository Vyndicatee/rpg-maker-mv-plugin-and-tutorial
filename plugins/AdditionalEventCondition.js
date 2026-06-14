//=============================================================================
// AdditionalEventCondition.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.AdditionalEventCondition = VynPlugin.AdditionalEventCondition || {};

/*:
 * Additional Event Condition
 *
 * @plugindesc v1.0.0 This plugin to add condition for map event
 * @author Vyndicate
 * 
 * 
 * ============================================================================
 * Changelog
 * v1.0.0 
 * Init plugin
 */

VynPlugin.parameters = PluginManager.parameters('AdditionalEventCondition');
VynPlugin.params = VynPlugin.params || {};

var initObject = {
    evalValid: false
}
//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------
VynPlugin.AdditionalEventCondition.Database_onLoadMap = DataManager.onLoad;
DataManager.onLoad = function(object) {
    VynPlugin.AdditionalEventCondition.Database_onLoadMap.apply(this, arguments);
    if (object === $dataMap) {
        this.processAdditionalMapEvent();
    }
};

DataManager.processAdditionalMapEvent = function () {
    if(!$dataMap || !$dataMap.events) return;
    for (var n = 1; n < $dataMap.events.length; n++) {
        var event = $dataMap.events[n];
        for (var m = 0; m < event.pages.length; m++) {
            var pageList = event.pages[m].list.filter(page => page.code == 408 || page.code == 108);
            if (pageList.length == 0) continue;
            Object.assign(event.pages[m].conditions, initObject);

            for (var o = 0; o < pageList.length; o++) {
                let parameter = pageList[o].parameters[0];
                let parameterSplit = parameter.split(/ (.+)/);
                let newObject = parameterMapProcess(parameterSplit);
                Object.assign(event.pages[m].conditions, newObject);
            }
        }
    }
}

function parameterMapProcess(parameterSplit) {
    var command = (parameterSplit.shift() || "").toLowerCase();
    var result = {};

    const handlers = {
        evaluation: function () {
            result.evalValid = true;
            result.evalCondition = parameterSplit.shift();
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
// Game_Event
//-----------------------------------------------------------------------------
Game_Event.prototype.meetsConditions = function (page) {
    var c = page.conditions;
    if (c.evalValid) {
        if (!eval(c.evalCondition)) {
            return false;
        }
    }
    if (c.switch1Valid) {
        if (!$gameSwitches.value(c.switch1Id)) {
            return false;
        }
    }
    if (c.switch2Valid) {
        if (!$gameSwitches.value(c.switch2Id)) {
            return false;
        }
    }
    if (c.variableValid) {
        if ($gameVariables.value(c.variableId) < c.variableValue) {
            return false;
        }
    }
    if (c.selfSwitchValid) {
        var key = [this._mapId, this._eventId, c.selfSwitchCh];
        if ($gameSelfSwitches.value(key) !== true) {
            return false;
        }
    }
    if (c.itemValid) {
        var item = $dataItems[c.itemId];
        if (!$gameParty.hasItem(item)) {
            return false;
        }
    }
    if (c.actorValid) {
        var actor = $gameActors.actor(c.actorId);
        if (!$gameParty.members().contains(actor)) {
            return false;
        }
    }
    return true;
};