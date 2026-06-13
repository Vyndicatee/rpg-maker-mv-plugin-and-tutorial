//=============================================================================
// StrongerMonster.js
//=============================================================================

var VynPlugin = VynPlugin || {};
VynPlugin.StrongerMonster = VynPlugin.StrongerMonster || {};

/*:
 * Stronge rMonster
 *
 * @plugindesc v1.3.0 This plugin to change enemy parameter based on the settings
 * @author Vyndicate
 *
 * @param Per Battle
 * @desc How many battle to increase when reach the numbers? (Required for win based)
 * @type number
 * @default 5
 * 
 * @param Multiplier
 * @desc How much multiplier to increase the stats?
 * @type number
 * @decimals 3
 * @default 0.04
 * 
 * @param Is using randomEnemies
 * @desc Is the game also using RandomEnemies plugin by Rexal?
 * @type boolean
 * @on Yes I am
 * @off No I do not
 * @default false
 * 
 * @param Multiplier Work
 * @desc How do you want to work regarding multiplier?
 * @type select
 * @option Multiply multiplier
 * @value 1
 * @option Addition multiplier
 * @value 2
 * @option Custom multiplier
 * @value 3
 * @default 1
 * 
 * @param Custom Multiplier
 * @desc Input multiplier formula you want to use. See help below for detail
 * @default Math.floor(enemyStat * Math.pow(multiplier, times - 1))
 * 
 * @param Multiplier source
 * @desc To increase enemy stat, based on what?
 * @type select
 * @option Based on how much battle win
 * @value 1
 * @option Based on character level
 * @value 2
 * @default 1
 * 
 * @param Character level based
 * @desc To increase enemy stat, based on what (Required Based on character level)?
 * @type select
 * @option Highest party member level
 * @value 1
 * @option Average party member level
 * @value 2
 * @option Lowest party member level
 * @value 3
 * @default 1
 * 
 * @param Param No Upgrade
 * @desc Set Param that keep the value without upgrade, separate with comma. 0: MHP, 1: MMP, 2: ATK, 3: DEF, 4: MAT, 5: MDF, 6: AGI, 7: LUK
 * @type number[]
 * @default [6]
 *
 * @help
 * This plugin is to increase enemy stats based on how much battle you've
 * encounter (Count from winning battle. Escape or aborted doesn't count)
 * or based on how much character level in the party
 * 
 * For character level, you can also set between highest, average, or lowest
 * The multiplier will be param multiplier
 * For example, highest level is 4, multiplier will be 4 * (param multiplier)
 * 
 * Multiplier Work concept:
 * Multiply multiplier: enemyStat * Math.pow(multiplier, n - 1)
 * Addition multiplier: enemyStat * multiplier * (n - 1)
 * Custom multiplier: See below
 * 
 * n - 1 to make monster stat doesn't change at lv 1
 * 
 * You can also add with Custom Multiplier, make sure you choose Multiplier
 * Work into Custom Multiplier
 * 
 * enemyStat: The base of enemy stats, it will iterate from param 0 into last 
 * param
 * multiplier: From parameter Multiplier
 * times: How much multiply it will happen
 * Example: Character level based and it's on level 50, times will be 50
 *
 * if you don't want change on certain enemies, use <NotChanged> in enemy note
 * 
 * NOTE:
 * Multiply Multiplier will cause huge inflation stats on higher n value, do it
 * at your own risk
 * For custom multiplier, highly suggest use desmos
 * ============================================================================
 * Changelog
 * v1.4.0
 * Add option to prevent upgrading certain parameters
 * 
 * v1.3.0
 * Add custom multiplier work
 * 
 * v1.2.0
 * Add character level based multiplier
 * 
 * v1.1.0 
 * Add multiplier option wether multiply it or add it
 * 
 * v1.0.0 
 * Init plugin
 */


var parameters = PluginManager.parameters('StrongerMonster');
var perBattle = Number(parameters['Per Battle']);
var multiplier = Number(parameters['Multiplier']);
var multiplierWork = Number(parameters['Multiplier Work']);
var multiplierSource = Number(parameters['Multiplier source']);
var characterLevelBased = Number(parameters['Character level based']);
var customMultiplier = String(parameters['Custom Multiplier'])
var isUsingRandomEnemiesPlugin = parameters['Is using randomEnemies'] == "true";
var paramNoUpgrade = JSON.parse(parameters['Param No Upgrade']).map(Number);

Game_Troop.prototype.setup = function (troopId) {
    if (isUsingRandomEnemiesPlugin) {
        this.clear();
        this._troopId = troopId;
        this._enemies = [];
        this.troop().members.forEach(function (member) {
            if ($dataEnemies[member.enemyId]) {
                var el = [];
                el = Rexal.RE.processEnemyNoteTag($dataEnemies[member.enemyId]);

                var enemyId = member.enemyId;

                var x = member.x;
                var y = member.y;
                var enemy;

                if (el.length != 0) {
                    var rand = Math.randomInt(Math.floor(el.length));
                    if (el[rand]) enemy = this.makeEnemiesStronger(el[rand].id, x, y);
                }
                else {
                    enemy = this.makeEnemiesStronger(enemyId, x, y);
                }

                if (member.hidden) {
                    enemy.hide();
                }
                if (enemy) this._enemies.push(enemy);

            }
        }, this);
        this.makeUniqueNames();

        if (this._enemies.length == 0)
            this.setup(troopId);
    } else {
        this.clear();
        this._troopId = troopId;
        this._enemies = [];
        this.troop().members.forEach(function (member) {
            if ($dataEnemies[member.enemyId]) {
                var enemyId = member.enemyId;
                var x = member.x;
                var y = member.y;
                var enemy = this.makeEnemiesStronger(enemyId, x, y);
                if (member.hidden) {
                    enemy.hide();
                }
                this._enemies.push(enemy);
            }
        }, this);
        this.makeUniqueNames();
    }
};

Game_Troop.prototype.makeEnemiesStronger = function (enemyId, x, y) {
    let enemy = new Game_Enemy(enemyId, x, y);
    if (!$dataEnemies[enemy._enemyId].meta.NotChanged) {
        let times = 1;
        if (multiplierSource == 1) {
            let winCount = $gameSystem.winCount();
            times = Math.floor(winCount / perBattle);
        } else if (multiplierSource == 2) {
            if (characterLevelBased == 1) {
                let highestLevel = $gameParty.allMembers().reduce(function (prev, current) {
                    return (prev && prev.level > current.level) ? prev : current
                }).level;
                times = highestLevel;
            } else if(characterLevelBased == 2) {
                let averageLevel = $gameParty.allMembers().reduce((sum, actor) => sum + actor.level, 0) / $gameParty.allMembers().length;
                times = Math.floor(averageLevel)
            } else if(characterLevelBased == 3) {
                let lowestLevel = $gameParty.allMembers().reduce(function (prev, current) {
                    return (prev && prev.level < current.level) ? prev : current
                });
                times = lowestLevel;
            }
        }

        if (multiplierWork == 1) {
            for (let j = 0; j <= 7; j++) {
                if(paramNoUpgrade.includes(j)) continue;
                let enemyStat = enemy.param(j);
                let multiplierTotal = Math.pow(multiplier, times - 1);
                if(multiplierTotal < 1) multiplierTotal = 0;
                enemyStat = Math.floor(enemyStat * multiplierTotal);
                enemy.addParam(j, enemyStat);
            }
        } else if (multiplierWork == 2) {
            for (let j = 0; j <= 7; j++) {
                if(paramNoUpgrade.includes(j)) continue;
                let enemyStat = enemy.param(j);
                let multiplierTotal = multiplier * (times - 1);
                if(multiplierTotal < 0) multiplierTotal = 0;
                enemyStat = Math.floor(enemyStat * multiplierTotal);
                enemy.addParam(j, enemyStat);
            }
        } else if (multiplierWork == 3) {
            for (let j = 0; j <= 7; j++) {
                if(paramNoUpgrade.includes(j)) continue;
                let enemyStat = enemy.param(j);
                enemyStat = eval(customMultiplier);
                enemy.addParam(j, enemyStat);
            }
        }

        enemy.recoverAll();
    }

    return enemy;
};
