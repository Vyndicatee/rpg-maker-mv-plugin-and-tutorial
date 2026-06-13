//=============================================================================
// DescriptionLine.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.DescriptionLine = VynPlugin.DescriptionLine || {};

/*:
 * Description Line
 *
 * @plugindesc v1.2.0 This plugin to change the description line based on what you want
 * @author Vyndicate
 *
 * @param Max Row Item
 * @desc How many lines you want to show in item menu? Default 2
 * @type number
 * @default 2
 * 
 * @param Max Row Skill
 * @desc How many lines you want to show in skill menu and battle? Default 2
 * @type number
 * @default 2
 * 
 * @param Max Row Equip
 * @desc How many lines you want to show in equip menu? Default 2
 * @type number
 * @default 2
 * 
 * @param Is Using Yanfly Equip Core
 * @desc Are you using this plugin?
 * @type boolean
 * @on Yes I am
 * @off No I do not
 * @default false
 * 
 * @param Is Using Yanfly Core Updates OPT
 * @desc Are you using this plugin?
 * @type boolean
 * @on Yes I am
 * @off No I do not
 * @default false
 *
 * @help
 * Max Row Description = number that maximum line to show
 * 
 * Inside plugin there's a function to support with YEP_EquipCore.js
 * 
 * If somehow there's an error about cannot read property 'width', change 
 * the param Is Using Yanfly Equip Core into true
 *
 * ============================================================================
 * Changelog
 * v1.2.0 
 * Add parameter for item and equip
 * 
 * v1.1.0 
 * Separate from monster description when targeted in battle
 * 
 * v1.0.0 
 * Init plugin
 */


var parameters = PluginManager.parameters('DescriptionLine');
var maxRowItem = Number(parameters['Max Row Item']);
var maxRowSkill = Number(parameters['Max Row Skill']);
var maxRowEquip = Number(parameters['Max Row Equip']);
var isYanflyEquipPlugin = parameters['Is Using Yanfly Equip Core'] == "true";
var isYanflyCoreUpdatePlugin = parameters['Is Using Yanfly Core Updates OPT'] == "true";

Window_Help.prototype.initialize = function (numLines = 2) {
    var width = Graphics.boxWidth;
    var height = this.fittingHeight(numLines);
    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
    this._text = '';
};

Scene_Battle.prototype.createHelpWindow = function (maxRow = 2) {
    this._helpWindow = new Window_Help(maxRow);
    this._helpWindow.visible = false;
    this.addWindow(this._helpWindow);
};

Scene_Battle.prototype.createSkillWindow = function () {
    this._skillDescriptionWindow = new Window_Help(maxRowSkill);
    this._skillDescriptionWindow.visible = false;
    this.addWindow(this._skillDescriptionWindow);
    var wy = this._skillDescriptionWindow.y + this._skillDescriptionWindow.height;
    var wh = this._statusWindow.y - wy;
    this._skillWindow = new Window_BattleSkill(0, wy, Graphics.boxWidth, wh);
    this._skillWindow.setHelpWindow(this._skillDescriptionWindow);
    this._skillWindow.setHandler('ok', this.onSkillOk.bind(this));
    this._skillWindow.setHandler('cancel', this.onSkillCancel.bind(this));
    this.addWindow(this._skillWindow);
};

Scene_MenuBase.prototype.createHelpWindow = function (numLines) {
    this._helpWindow = new Window_Help(numLines);
    this.addWindow(this._helpWindow);
};

Scene_Item.prototype.create = function () {
    Scene_ItemBase.prototype.create.call(this);
    this.createHelpWindow(maxRowItem);
    this.createCategoryWindow();
    this.createItemWindow();
    this.createActorWindow();
};

Scene_Skill.prototype.create = function() {
    Scene_ItemBase.prototype.create.call(this);
    this.createHelpWindow(maxRowSkill);
    this.createSkillTypeWindow();
    this.createStatusWindow();
    this.createItemWindow();
    this.createActorWindow();
    if(isYanflyCoreUpdatePlugin) {
        this.refreshActor();
    }
};

Scene_Equip.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow(maxRowEquip);
    if (isYanflyEquipPlugin) {
        // Yanfly Equip Plugin
        this.createCommandWindow();
        this.createStatusWindow();
        this.createSlotWindow();
        this.createItemWindow();
        this.createCompareWindow();
        this._lowerRightVisibility = true;
        this.updateLowerRightWindows();
        this.refreshActor();
    } else {
        // Non Yanfly Equip Plugin
        this.createStatusWindow();
        this.createCommandWindow();
        this.createSlotWindow();
        this.createItemWindow();
        this.refreshActor();
    }

};

