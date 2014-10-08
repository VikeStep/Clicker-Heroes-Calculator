//This was made by VikeStep and stennett
//If you wish to assist in the creation of this site

/*
 TODO:

 MAJOR
 - Ancient Data and Efficiencies (THIS WILL BE LEFT FOR VERSION 2)
 - Fix Clicking and Critical Clicking calculations in regards to efficiency when enabled. (VERSION 2)

 MINOR:
 - Convert large numbers to run off Base64 Maths
 - Add in Max DPS using Skills
 - Timer that recalculates every specified time (configurable)
 - Option to use scientific notation for numbering
 - FAQ
 - Secondary Efficiency for when your money is able to purchase the best cost/dps (ultimately better formula as the current efficiency formula takes into consideration time taken to buy hero)
 */

//Initialising Global Variables
var userSave = Object(); //Holds all current info - can possibly request off people for debugging purposes

var impAch = chdata.achievements; //Imported Achievements etc...
var impHer = chdata.heroes;
var impAnc = chdata.ancients;
var impUpg = chdata.upgrades;

var achievKeys = Object.keys(impAch);
var heroKeys = Object.keys(impHer);
var ancientKeys = Object.keys(impAnc);
var upgradeKeys = Object.keys(impUpg);

var achievData = Object(); //Combines impAch with imported save data etc...
var heroData = Object();
var ancientData = Object();
var upgradeData = Object();
var efficiencyData = [];

var saveData = ""; //Encoded Save Data
var parsedSaveData = Object(); //Decoded Save Data

var totalDPS = 0;
var totalGPS = 0;
var heroDPS = 0;
var heroSouls = 0;
var currentZone = 1;
var currentHighestZone = 1;
var highestZoneReached = 1;
var next20Purchases = [];
var enableClicking = false;
var enableCritical = false;
var clickSpeed = 0;
var clickDamage = 0;
var criticalClickDamage = 0;
var criticalClickChance = 0;
var criticalClickMultiplier = 10;
var clickDPS = 0;
var criticalClickDPS = 0;
var enableHeroSouls = false;
var desiredHeroSouls = 0;
var openedHeroSoulsPopup = false;
var heroSoulsLevels = [];
var requiredGPS = Infinity;
var upgradeClickDPS = 1;
var upgradeClickMultiplier = 0;
var darkRitualsCalculated = false;
var darkRitualsUsed = 0;
var energizedDarkRitualsUsed = 0;
var achievementMultiplier = 1;
var darkRitualMultiplier = 1;
var allHeroMultiplier = 1;
var heroSoulsMultiplier = 1;
var allDPSMultiplier = 1;
var goldMultiplier = 1;
var isPopupOpen = false;
var sortedAchievements = [];
var efficiencyType = 1;
var effMult = 0.005;
var scientificNotation = false;

//Functions for PreInit Phase - Loading all the data from local storage
function loadLocalStorage() { //Will grab the data from local storage
    if (typeof(Storage) != "undefined") {
        if (localStorage.getItem("save") != null) {
            userSave = JSON.parse(localStorage.getItem("save"));
        }
    }
}

function preInit() { 	//PreInit Phase
    loadLocalStorage();
}

preInit();

//Functions For Init Phase - Assigning loaded data to variables, Calculating values for variables
function logBase(b, n) {
    return Math.log(n) / Math.log(b);
}

function calculateBaseDPS(cost, id) {	//The base DPS for a hero is calculated by a formula of the cost and its ID. ID for Cid is 1, ID for Treebeast is 2 and so on.
    return Math.ceil((cost / 10) * Math.pow(1 - (0.0188 * Math.min(id, 14)), id));
}

function calculateUpgradeCost(level, heroID) { //Will find cost of upgrade given the level needed for it and the Hero's ID
    return heroData[heroID - 1]["baseCost"] * [10, 25, 100, 800, 8000, 40000, 400000][[10, 25, 50, 75, 100, 125, 150].indexOf(level)];
}

function calculateLevelUpCost(heroID, level) {
    if (heroData[heroID]["id"] == 1 && level <= 15) {
        return Math.floor((5 + level) * Math.pow(1.07, level) * (1 - (ancientData[8]["level"] * 0.02)));
    } else if (heroData[heroID]["id"] == 1) {
        return Math.floor(20 * Math.pow(1.07, level) * (1 - (ancientData[8]["level"] * 0.02)));
    } else {
        return Math.floor(heroData[heroID]["baseCost"] * Math.pow(1.07, level) * (1 - (ancientData[8]["level"] * 0.02)));
    }
}

function calculateCostUpToLevel(heroID, level1, level2) {
    var sum = 0;
    for (var levelnum = level1; levelnum < level2; levelnum++) {
        sum = sum + calculateLevelUpCost(heroID, levelnum);
    }
    return sum;
}

function splitParams(param) { //Simply splits a string into array where ", " or "," occurs
    return param.split(" ").join("").split(",");
}

//Populates the 4 main arrays with data from the json and with placeholders for fillInData()
function populateArrays() {
    //Hero Data
    for (var i = 0; i < heroKeys.length; i++) {
        //Static Data
        heroData[i] = [];
        var impHeroData = impHer[heroKeys[i]];
        heroData[i]["name"] = impHeroData.name;
        heroData[i]["baseCost"] = impHeroData.baseCost;
        heroData[i]["id"] = impHeroData.id;
        if (heroData[i]["id"] != 1) { //Calculates base DPS
            heroData[i]["baseDPS"] = calculateBaseDPS(heroData[i]["baseCost"], heroData[i]["id"]);
        } else {
            heroData[i]["baseDPS"] = 0;
        }
        heroData[i]["baseClickDamage"] = impHeroData.baseClickDamage;
        //Dynamic Data
        heroData[i]["level"] = 0;
        heroData[i]["gilded"] = 0;
        heroData[i]["currentDPS"] = 0;
        heroData[i]["nextCost"] = 0;
        heroData[i]["nextDPSChange"] = 0;
        heroData[i]["efficiency1"] = 0;
        heroData[i]["efficiency4x"] = 0;
        heroData[i]["efficiency10x"] = 0;
        heroData[i]["levelMultiplier"] = 1;
        heroData[i]["upgradeMultiplier"] = 1;
        heroData[i]["currentClickDamge"] = 0;
        heroData[i]["upgrades"] = [];
    }
    //Upgrade Data
    for (var i = 0; i < upgradeKeys.length; i++) {
        //Static Data
        upgradeData[i] = [];
        var impUpgradeData = impUpg[upgradeKeys[i]];
        upgradeData[i]["id"] = impUpgradeData.id;
        upgradeData[i]["heroID"] = impUpgradeData.heroId;
        upgradeData[i]["name"] = impUpgradeData.name;
        upgradeData[i]["level"] = impUpgradeData.heroLevelRequired;
        upgradeData[i]["type"] = impUpgradeData.upgradeFunction;
        upgradeData[i]["upgradeParams"] = splitParams(impUpgradeData.upgradeParams);
        upgradeData[i]["cost"] = calculateUpgradeCost(upgradeData[i]["level"], upgradeData[i]["heroID"]);
        heroData[upgradeData[i]["heroID"] - 1]["upgrades"].push(i);
        //Dynamic Data
        upgradeData[i]["owned"] = false;
        upgradeData[i]["totalCost"] = 0;
        upgradeData[i]["DPSChange"] = 0;
        upgradeData[i]["efficiency"] = 0;
    }
    //Achievement Data
    for (var i = 0; i < achievKeys.length; i++) {
        //Static Data
        achievData[i] = [];
        var impAchievData = impAch[achievKeys[i]];
        achievData[i]["name"] = impAchievData.name;
        achievData[i]["id"] = impAchievData.id;
        achievData[i]["type"] = impAchievData.rewardFunction;
        achievData[i]["rewardParams"] = splitParams(impAchievData.rewardParams);
        achievData[i]["checkFunction"] = impAchievData.checkFunction;
        achievData[i]["checkParams"] = impAchievData.checkParams;
        achievData[i]["description"] = impAchievData.description;
        //Dynamic Data
        achievData[i]["owned"] = false;
        achievData[i]["DPSChange"] = 0;
        achievData[i]["efficiency"] = 0;
    }
    //Ancient Data
    for (var i = 0; i < ancientKeys.length; i++) {
        //Static Data
        ancientData[i] = [];
        var impAncientData = impAnc[ancientKeys[i]];
        ancientData[i]["name"] = impAncientData.name;
        ancientData[i]["id"] = impAncientData.id;
        ancientData[i]["maxLevel"] = impAncientData.maxLevel;
        ancientData[i]["levelCostFormula"] = impAncientData.levelCostFormula;
        ancientData[i]["levelAmountFormula"] = impAncientData.levelAmountFormula;
        //Dynamic Data
        ancientData[i]["level"] = 0;
        ancientData[i]["nextCost"] = 0;
        ancientData[i]["DPSChange"] = 0;
    }
}

function fillInData() { //Puts data from userSave into the 4 arrays
    if (Object.keys(userSave).length != 0) {
        for (var i = 0; i < heroKeys.length; i++) {
            heroData[i]["level"] = userSave.heroes[i][0];
            heroData[i]["gilded"] = userSave.heroes[i][1];
        }
        for (var i = 0; i < achievKeys.length; i++) {
            achievData[i]["owned"] = userSave.achievements[i];
        }
        for (var i = 0; i < upgradeKeys.length; i++) {
            upgradeData[i]["owned"] = userSave.upgrades[i];
        }
        for (var i = 0; i < ancientKeys.length; i++) {
            ancientData[i]["level"] = userSave.ancients[i];
        }
        heroSouls = userSave.heroSouls;
        allDPSMultiplier = userSave.allDPSMultiplier;
        highestZoneReached = userSave.highestZone;
        currentHighestZone = userSave.currentHighestZone;
        currentZone = userSave.currentZone;
        document.getElementById("currentZone").value = currentZone;
    }
}

function costToDesiredHeroSouls() {
    if (enableHeroSouls) {
        var multTotal = 1;
        var totalLevels = 0;
        var indexCheapest = 0;
        var totalCost = 0;
        var difference = 0;
        heroSoulsLevels = [];
        for (i = 0; i < 26; i++) {
            multTotal = multTotal * heroData[i]["baseCost"];
            heroSoulsLevels[i] = heroData[i]["level"];
            totalLevels += heroData[i]["level"];
        }
        if (totalLevels < (2000 * desiredHeroSouls)) {
            difference = (2000 * desiredHeroSouls) - totalLevels;
        }
        for (var i = 0; i < difference; i++) {
            var currentCosts = [];
            for (var j = 0; j < 26; j++) {
                currentCosts[j] = calculateLevelUpCost(j, heroSoulsLevels[j]);
            }
            indexCheapest = currentCosts.indexOf(Math.min.apply(Math, currentCosts));
            heroSoulsLevels[indexCheapest] += 1;
        }
        for (var i = 0; i < 26; i++) {
            totalCost += calculateCostUpToLevel(i, heroData[i]["level"], heroSoulsLevels[i]);
        }
        requiredGPS = totalCost / 300; //This will start building towards the hero count when it will finish in 5 minutes
    }
}

function calculateDarkRitualInfo() { //Will reverse engineer to find the amount of dark rituals used comparing save data to calculated data
    if (allDPSMultiplier != 0) {
        var unknownMult = allDPSMultiplier / (allHeroMultiplier * achievementMultiplier);
        var maxA = Math.floor(logBase(1.05, unknownMult));
        var maxB = Math.floor(logBase(1.1, unknownMult));
        var closest = [0, 0, 1, unknownMult];
        for (var k = 0; k <= maxA; k++) {
            for (var l = 0; l <= maxB; l++) {
                var mult = Math.pow(1.05, k) * Math.pow(1.1, l);
                if (Math.abs(mult - unknownMult) < closest[3]) {
                    closest = [k, l, mult, Math.abs(mult - unknownMult)];
                }
            }
        }
        darkRitualsUsed = closest[0];
        energizedDarkRitualsUsed = closest[1];
        darkRitualMultiplier = Math.pow(1.05, darkRitualsUsed) * Math.pow(1.1, energizedDarkRitualsUsed);
    } else {
        darkRitualsUsed = 0;
        energizedDarkRitualsUsed = 0;
        darkRitualMultiplier = 1;
    }
    darkRitualsCalculated = true;
}

function calculateGlobalMultipliers() { //Calculates global multipliers that cover all heroes. These come from achievements, upgrades and hero souls
    darkRitualsCalculated = false;
    darkRitualsUsed = 0;
    energizedDarkRitualsUsed = 0;
    achievementMultiplier = 1;
    for (var i = 0; i < achievKeys.length; i++) {
        if (achievData[i]["type"] == "addDps" && achievData[i]["owned"] == true) {
            achievementMultiplier = achievementMultiplier * (1 + (Number(achievData[i]["rewardParams"][0]) / 100));
        }
    }
    allHeroMultiplier = 1;
    goldMultiplier = 1;
    for (var i = 0; i < upgradeKeys.length; i++) {
        if (upgradeData[i]["type"] == "upgradeEveryonePercent" && upgradeData[i]["owned"] == true) {
            allHeroMultiplier = allHeroMultiplier * (1 + (Number(upgradeData[i]["upgradeParams"][0]) / 100));
        } else if (upgradeData[i]["type"] == "upgradeGoldFoundPercent" && upgradeData[i]["owned"] == true) {
            goldMultiplier = goldMultiplier * (1 + (Number(upgradeData[i]["upgradeParams"][0]) / 100));
        }
    }
    heroSoulsMultiplier = 1 + (heroSouls / 10) + (ancientData[13]["level"] * 0.11);
    darkRitualMultiplier = Math.pow(1.05, darkRitualsUsed) * Math.pow(1.1, energizedDarkRitualsUsed);
}

function calculateNextDPSChange(heroID, level) {
    if ((level + 1) % 1000 == 0) {
        return ((9 * level) + 10) * (heroData[heroID]["currentDPS"] / level);
    } else if ((level + 1) % 25 == 0 && level >= 199) {
        return ((3 * level) + 4) * (heroData[heroID]["currentDPS"] / level);
    } else if (level != 0) {
        return heroData[heroID]["currentDPS"] / level;
    } else {
        return heroData[heroID]["baseDPS"];
    }
}

function calculateHeroData() { //Calculates levelMultiplier, nextCost, currentDPS and nextDPSChange for the heroes
    for (var i = 0; i < heroKeys.length; i++) {
        //Calculate levelMultiplier
        if (heroData[i]["level"] >= 200 && heroData[i]["id"] != 1 && heroData[i]["level"] < 4000) {
            var thousandCount = 0;
            var multiCount = Math.floor(1 + ((heroData[i]["level"] - 200) / 25));
            if (heroData[i]["level"] >= 1000) {
                thousandCount = Math.floor(heroData[i]["level"] / 1000);
            }
            heroData[i]["levelMultiplier"] = Math.pow(4, multiCount - thousandCount) * Math.pow(10, thousandCount);
        } else if (heroData[i]["level"] >= 200 && heroData[i]["id"] != 1 && heroData[i]["level"] < 4100) {
            var multiCount = Math.ceil((4100 - heroData[i]["level"]) / 25);
            heroData[i]["levelMultiplier"] = Math.pow(10, 3) * Math.pow(4, 140 + multiCount);
        } else if (heroData[i]["level"] >= 200) {
            heroData[i]["levelMultiplier"] = Math.pow(10, 3) * Math.pow(4, 144);
        } else {
            heroData[i]["levelMultiplier"] = 1;
        }
        //Calculate nextCost
        heroData[i]["nextCost"] = calculateLevelUpCost(i, heroData[i]["level"]);
    }
    var loopFlag = true;
    while (loopFlag) {
        heroDPS = 0;
        for (var i = 0; i < heroKeys.length; i++) {

            heroData[i]["currentDPS"] = heroData[i]["level"] * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * heroData[i]["levelMultiplier"] * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
            for (var j = 0; j < heroData[i]["upgrades"].length; j++) {
                var upgradeDetails = upgradeData[heroData[i]["upgrades"][j]];
                if (upgradeDetails["type"] == "upgradeHeroPercent" && upgradeDetails["owned"] == true) {
                    heroData[i]["currentDPS"] = heroData[i]["currentDPS"] * (1 + (upgradeDetails["upgradeParams"][1] / 100));
                }
            }
            heroDPS = heroDPS + heroData[i]["currentDPS"];
        }
        if (darkRitualsCalculated == false) {
            calculateDarkRitualInfo();
        } else {
            loopFlag = false;
        }
    }
    for (var i = 0; i < heroKeys.length; i++) {
        heroData[i]["nextDPSChange"] = calculateNextDPSChange(i, heroData[i]["level"]);
    }
}

function calculateClickingInfo() {
    //Calculate Cid Click Damage
    var value1 = 1;
    for (var i = 0; i < upgradeKeys.length; i++) {
        var upgradeA = upgradeData[i];
        if (upgradeA["type"] == "upgradeClickPercent" && upgradeA["owned"] == true) {
            value1 = value1 * (1 + (Number(upgradeA["upgradeParams"][0]) / 100));
        }
    }
    heroData[0]["currentClickDamage"] = heroData[0]["baseClickDamage"] * heroData[0]["level"] * value1 * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier * heroSoulsMultiplier; //Cid's Click Damage

    //Calculate Click Damage from Upgrades
    upgradeClickMultiplier = 0;
    for (var i = 0; i < upgradeKeys.length; i++) {
        var upgradeB = upgradeData[i];
        if (upgradeB["type"] == "upgradeClickDpsPercent" && upgradeB["owned"] == true) {
            upgradeClickMultiplier = upgradeClickMultiplier + Number(upgradeB["upgradeParams"][0]);
        }
    }
    upgradeClickDPS = heroDPS * (upgradeClickMultiplier / 100);

    var baseClickDamage = 1;
    for (var i = 0; i < achievKeys.length; i++) {
        var achievA = achievData[i];
        if (achievA["type"] == "addClickDamage" && achievA["owned"] == true) {
            baseClickDamage = baseClickDamage + Number(achievA["rewardParams"][0]);
        }
    }

    clickDamage = Math.floor((Math.ceil(heroData[0]["currentClickDamage"]) + Math.floor(upgradeClickDPS)) * (1 + (ancientData[16]["level"] * 0.2))) + baseClickDamage;
    var cid1LevelDamageChange;
    if (heroData[0]["level"] != 0) {
        cid1LevelDamageChange = (heroData[0]["currentClickDamage"] / heroData[0]["level"]) * ((ancientData[16]["level"] * 0.2) + 1);
    } else {
        cid1LevelDamageChange = heroData[0]["baseClickDamage"] * value1 * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier * heroSoulsMultiplier;
    }

    if (cid1LevelDamageChange == 0) {//This is a safeguard for integer precision issues
        cid1LevelDamageChange = ((1 + (ancientData[16]["level"] * 0.2)) * (heroData[0]["currentClickDamage"])) / heroData[0]["level"]; //Simplified form of previous calculations without Ceil or Floor
    }
    //Calculate Critical Click Chance
    var value3 = 0;
    for (var i = 0; i < upgradeKeys.length; i++) {
        var upgradeC = upgradeData[i];
        if (upgradeC["type"] == "upgradeCriticalChance" && upgradeC["owned"] == true) {
            value3 = value3 + Number(upgradeC["upgradeParams"][0]);
        }
    }
    criticalClickChance = value3 / 100;

    //Calculate Critical Click Damage
    var value4 = 10; //Critical Multiplier
    for (var i = 0; i < upgradeKeys.length; i++) {
        var upgradeD = upgradeData[i];
        if (upgradeD["type"] == "upgradeCriticalDamage" && upgradeD["owned"] == true) {
            value4 = value4 + Number(upgradeD["upgradeParams"][0]);
        }
    }
    criticalClickMultiplier = value4;
    criticalClickDamage = clickDamage * ((criticalClickChance * (criticalClickMultiplier - 1)) + 1);
    var cid1LevelCriticalDamageChange = (criticalClickDamage * cid1LevelDamageChange) / clickDamage; //Simplified Formula for Damage Difference

    clickDPS = clickDamage * clickSpeed * enableClicking;
    var cidNextClickDPSChange = clickSpeed * cid1LevelDamageChange * enableClicking;
    criticalClickDPS = criticalClickDamage * clickSpeed * enableClicking;
    var cidNextCriticalClickDPSChange = cid1LevelCriticalDamageChange * clickSpeed * enableClicking;

    if (enableClicking == true) {
        if (enableCritical == true) {
            if (criticalClickDPS == 0) {
                criticalClickDPS = 1;
            }
            totalDPS = criticalClickDPS + heroDPS;
            heroData[0]["nextDPSChange"] = cidNextCriticalClickDPSChange;
        } else {
            if (clickDPS == 0) {
                clickDPS = 1;
            }
            totalDPS = clickDPS + heroDPS;
            heroData[0]["nextDPSChange"] = cidNextClickDPSChange;
        }
    } else {
        if (heroDPS == 0) {
            heroDPS = 1;
        }
        totalDPS = heroDPS;
        heroData[0]["nextDPSChange"] = 0;
    }
}

function calculateDPStoGoldRatio(level) {
    var monsterLife = Math.ceil((10 * (Math.pow(1.6, Math.min(140, level) - 1) + Math.min(140, level) - 1)) * Math.pow(1.15, Math.max(140, level) - 140));
    var averageGold = 0;
    if (level % 5 == 0) {
        monsterLife = Math.ceil((1 - (0.02 * ancientData[15]["level"])) * ((10 * (Math.pow(1.6, Math.min(140, level) - 1) + Math.min(140, level) - 1)) * Math.pow(1.15, Math.max(140, level) - 140)) * 10);
        averageGold = Math.ceil((monsterLife / 15) * goldMultiplier * Math.min(3, Math.pow(1.025, Math.max(0, level - 75))) * (1 + (0.05 * ancientData[5]["level"])) * (1 + (0.225 * ancientData[9]["level"])));
    } else {
        var monsterGold = Math.ceil((monsterLife / 15) * goldMultiplier * Math.min(3, Math.pow(1.025, Math.max(0, level - 75))) * (1 + (0.05 * ancientData[5]["level"])));
        var treasureChestGold = monsterGold * 10 * (1 + (0.5 * ancientData[6]["level"]));
        var treasureChestChance = 0.01 * (1 + (ancientData[11]["level"] * 0.2));
        averageGold = ((treasureChestChance * treasureChestGold) + ((1 - treasureChestChance) * monsterGold)) * (1 + (0.225 * ancientData[9]["level"]));
    }
    var timeTaken = (monsterLife / totalDPS) + 0.5;
    totalGPS = averageGold / timeTaken;
    return totalGPS / totalDPS;
}

function calculateEfficiency(cost, change) {
    if (change != 0) {
        if (efficiencyType == 1) {
            return (1.15 * (cost / totalDPS)) + (cost / change);
        } else if (efficiencyType == 2) {
            return cost / change;
        } else if (efficiencyType == 3) {
            if (change > (totalDPS * effMult)) {
                return cost / change;
            } else {
                return Infinity;
            }
        } else {
            if (change > (totalDPS * effMult)) {
                return (1.15 * (cost / totalDPS)) + (cost / change);
            } else {
                return Infinity;
            }
        }
    } else {
        return Infinity;
    }
}

function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function updateEfficiencyData() {
    efficiencyData.length = 0;
    for (var i = 1; i < heroKeys.length; i++) {
        efficiencyData.push(["Hero", heroData[i]["efficiency1"], 1, i, 0]);
        if (heroData[i]["efficiency4x"] != Infinity) {
            efficiencyData.push(["Hero", heroData[i]["efficiency4x"], 4, i, 0]);
        }
        if (heroData[i]["efficiency10x"] != Infinity) {
            efficiencyData.push(["Hero", heroData[i]["efficiency10x"], 10, i, 0]);
        }
    }
    if (heroData[0]["efficiency1"] != 0 && heroData[0]["efficiency1"] != Infinity) {
        efficiencyData.push(["Hero", heroData[0]["efficiency1"], 1, 0, 0]);
    }
    for (var i = 0; i < upgradeKeys.length; i++) {
        if (upgradeData[i]["owned"] == false) {
            efficiencyData.push(["Upgrade", upgradeData[i]["efficiency"], 1, i, 1]);
        }
    }
    efficiencyData.sort(compareSecondColumn);
}

function calculateUpgradeTotalCost(heroID, upgradeID) {
    var hero1 = heroData[heroID];
    var upgrade1 = upgradeData[upgradeID];
    return calculateCostUpToLevel(heroID, hero1["level"], upgrade1["level"]) + upgrade1["cost"];
}

/**
 * @return {number}
 */
function DPSGainedHero(heroID, level) {
    var heroB = heroData[heroID];
    var heroBDPS = heroB["currentDPS"];
    if (heroB["level"] != 0 && heroB["level"] < level) {
        return heroBDPS * ((level / heroB["level"]) - 1);
    } else if (heroB["level"] < level) {
        return level * heroB["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * (1 + (heroB["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
    } else {
        return 0
    }
}

function calculateAllEfficiencies() {
    calculateDPStoGoldRatio(currentZone);
    var infLoop = true;
    effMult = 0.005;
    while (infLoop) {
        //Heroes (minus Cid)
        for (var i = 1; i < heroKeys.length; i++) {
            var cost4xMult = 0;
            var DPS4xChange = 0;
            var cost10xMult = 0;
            var DPS10xChange = 0;
            //1 Level
            heroData[i]["efficiency1"] = calculateEfficiency(heroData[i]["nextCost"], heroData[i]["nextDPSChange"]);
            //Next 4x and 10x Multiplier
            if (heroData[i]["level"] < 200 && heroData[i]["level"] != 0) {
                cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], 200);
                DPS4xChange = (4 * (heroData[i]["currentDPS"] * (200 / heroData[i]["level"]))) - heroData[i]["currentDPS"];
                cost10xMult = calculateCostUpToLevel(i, heroData[i]["level"], 1000);
                DPS10xChange = (10 * Math.pow(4, 32) * (heroData[i]["currentDPS"] * (1000 / heroData[i]["level"]))) - heroData[i]["currentDPS"];
            } else if (heroData[i]["level"] != 0 && heroData[i]["level"] < 4100) {
                var next4xlevel = Math.ceil((heroData[i]["level"] + 1) / 25) * 25;
                cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
                var other10xbonus = 0;
                if (next4xlevel % 1000 == 0 && next4xlevel <= 3000) {
                    next4xlevel = next4xlevel + 25;
                    cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
                    other10xbonus = 1;
                }
                DPS4xChange = (Math.pow(10, other10xbonus) * 4 * (heroData[i]["currentDPS"] * (next4xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
                if (heroData[i]["level"] < 3000) {
                    var next10xlevel = Math.ceil((heroData[i]["level"] + 1) / 1000) * 1000;
                    cost10xMult = calculateCostUpToLevel(i, heroData[i]["level"], next10xlevel);
                    var other4xbonus = Math.floor((next10xlevel - (heroData[i]["level"] + 1)) / 25);
                    DPS10xChange = (Math.pow(4, other4xbonus) * 10 * (heroData[i]["currentDPS"] * (next10xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
                }
            } else if (heroData[i]["level"] < 4100) {
                cost4xMult = calculateCostUpToLevel(i, 0, 200);
                cost10xMult = calculateCostUpToLevel(i, 0, 1000);
                DPS4xChange = 200 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 4 * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
                DPS10xChange = 1000 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 10 * Math.pow(4, 32) * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
            }
            heroData[i]["efficiency4x"] = calculateEfficiency(cost4xMult, DPS4xChange);
            heroData[i]["efficiency10x"] = calculateEfficiency(cost10xMult, DPS10xChange);
        }
        heroData[0]["efficiency1"] = calculateEfficiency(heroData[0]["nextCost"], heroData[0]["nextDPSChange"]);

        //Upgrades
        for (var i = 0; i < upgradeKeys.length; i++) {
            if (upgradeData[i]["owned"] == false) {
                upgradeData[i]["totalCost"] = calculateUpgradeTotalCost(upgradeData[i]["heroID"] - 1, i);
                var heroA = heroData[upgradeData[i]["heroID"] - 1];
                var DPSFromHero = DPSGainedHero(upgradeData[i]["heroID"] - 1, upgradeData[i]["level"]);
                switch (upgradeData[i]["type"]) {
                    //Should work, I need to make some documentation on how these formulas were made to make this clear
                    case "upgradeClickPercent":
                        var upgradeCidChange;
                        if (heroData[0]["level"] < upgradeData[i]["level"] && heroData[0]["level"] != 0) {
                            upgradeCidChange = heroData[0]["currentClickDamage"] * (((upgradeData[i]["level"] / heroData[0]["level"]) * (1 + (Number(upgradeData[i]["upgradeParams"][0]) / 100))) - 1);
                        } else if (heroData[0]["level"] < upgradeData[i]["level"]) {
                            upgradeCidChange = upgradeData[i]["level"] * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier * heroSoulsMultiplier * (1 + (Number(upgradeData[i]["upgradeParams"][0]) / 100));
                        } else {
                            upgradeCidChange = ((heroData[0]["currentClickDamage"] * Number(upgradeData[i]["upgradeParams"][0])) / 100);
                        }
                        upgradeData[i]["DPSChange"] = 0.2 * (ancientData[16]["level"] + 5) * upgradeCidChange * clickSpeed * enableClicking;
                        if (enableCritical && enableClicking) {
                            upgradeData[i]["DPSChange"] = (upgradeData[i]["DPSChange"] * criticalClickDamage) / clickDamage;
                        }
                        break;

                    case "upgradeHeroPercent":
                        var heroDPSIncrease = (0.01 * Number(upgradeData[i]["upgradeParams"][1]) * (heroA["currentDPS"] + DPSFromHero)) + DPSFromHero;
                        /*if (enableCritical && enableClicking) {
                         var clickChange = ((0.002 * ancientData[16]["level"]) + 0.01) * heroDPSIncrease * upgradeClickDPS;
                         heroDPSIncrease += (clickChange * criticalClickDamage) / clickDamage;
                         } else {
                         heroDPSIncrease += enableClicking * clickSpeed * (((0.002 * ancientData[16]["level"]) + 0.01) * heroDPSIncrease * upgradeClickMultiplier);
                         }*/
                        upgradeData[i]["DPSChange"] = heroDPSIncrease;
                        break;

                    case "upgradeGoldFoundPercent": //Assuming DPS and GPS are directly proportional this will work(which they are)
                        upgradeData[i]["DPSChange"] = (0.01 * Number(upgradeData[i]["upgradeParams"][0]) * (totalDPS + DPSFromHero)) + DPSFromHero;

                    case "upgradeEveryonePercent": //THIS NEEDS FIXING FOR CLICK STUFF - Formula For now: http://imgur.com/pmP2JEK
                        var heroDPSIncrease = (0.01 * Number(upgradeData[i]["upgradeParams"][0]) * (heroDPS + DPSFromHero)) + DPSFromHero; //Simplified Calculation that avoids problems with integer precision
                        //var clickDPSIncrease = Number(upgradeData[i]["upgradeParams"][0]); //0.01 * Number(upgradeData[i]["upgradeParams"][0]) * heroData[0]["currentClickDamage"] * (1 + (ancientData[16]["level"] * 0.2));
                        //var criticalDPSIncrease = (clickDPSIncrease * criticalClickDamage) / clickDamage;
                        upgradeData[i]["DPSChange"] = heroDPSIncrease; // + (enableClicking * ((!enableCritical * clickDPSIncrease) + (enableCritical * criticalDPSIncrease)));
                        break;

                    case "upgradeCriticalChance":
                        upgradeData[i]["DPSChange"] = enableClicking * enableCritical * 0.01 * clickSpeed * (criticalClickMultiplier - 1) * clickDamage * Number(upgradeData[i]["upgradeParams"][0]);
                        break;

                    case "upgradeCriticalDamage":
                        upgradeData[i]["DPSChange"] = enableClicking * enableCritical * clickSpeed * criticalClickChance * clickDamage * Number(upgradeData[i]["upgradeParams"][0]);
                        break;

                    case "upgradeClickDpsPercent":
                        var clickDPSIncrease = heroDPS * 0.01 * Number(upgradeData[i]["upgradeParams"][0]) * (1 + (ancientData[16]["level"] * 0.2));
                        var criticalDPSIncrease = (clickDPSIncrease * criticalClickDamage) / clickDamage;
                        upgradeData[i]["DPSChange"] = enableClicking * ((!enableCritical * clickDPSIncrease * clickSpeed) + (enableCritical * criticalDPSIncrease * clickSpeed));
                        break;

                    case "upgradeGetSkill":
                    case "finalUpgrade":
                    default:
                        upgradeData[i]["DPSChange"] = 0;
                        break;
                }
                upgradeData[i]["efficiency"] = calculateEfficiency(upgradeData[i]["totalCost"], upgradeData[i]["DPSChange"])
            } else {
                upgradeData[i]["efficiency"] = "N/A";
            }
        }
        updateEfficiencyData();
        if (efficiencyData[1][1] == Infinity) {
            console.log(effMult);
            effMult = effMult * 0.005;
        } else {
            infLoop = false;
        }
    }
}

function nextMultiplierLevel(curlevel, multiplier) {
    switch (multiplier) {
        case 1:
            return curlevel + 1;
        case 4:
            if (curlevel < 200) {
                return 200;
            } else {
                return Math.ceil((curlevel + 1) / 25) * 25
            }
        case 10:
            return Math.ceil((curlevel + 1) / 1000) * 1000;
        default:
            window.alert("Invalid Multiplier" + multiplier.toString());
            break;
    }
}

function tempPurchase() {
    var tempPur = efficiencyData[0];
    if (tempPur[0] == "Hero") {
        heroData[tempPur[3]]["level"] = tempPur[4];
    } else if (tempPur[0] == "Upgrade") {
        upgradeData[tempPur[3]]["owned"] = true;
        if (heroData[upgradeData[tempPur[3]]["heroID"] - 1]["level"] < upgradeData[tempPur[3]]["level"]) {
            heroData[upgradeData[tempPur[3]]["heroID"] - 1]["level"] = upgradeData[tempPur[3]]["level"];
        }
    } else {
        window.alert("Invalid Efficiency Type" + tempPur[0].toString());
    }
}

function findNext20Purchases() {
    var savedHeroData = jQuery.extend(true, {}, heroData);
    var savedUpgradeData = jQuery.extend(true, {}, upgradeData);
    var prevPurchase = [0, 0, 0, 0, 0];
    var newPurchase;
    next20Purchases = [];
    while (next20Purchases.length < 20) {
        newPurchase = efficiencyData[0];
        if (prevPurchase[0] != 0 && (prevPurchase[0] != newPurchase[0] || prevPurchase[3] != newPurchase[3])) {
            next20Purchases.push(prevPurchase)
        }
        if (newPurchase[0] == "Hero") {
            newPurchase[4] = nextMultiplierLevel(heroData[newPurchase[3]]["level"], newPurchase[2])
        }
        tempPurchase();
        calculateGlobalMultipliers();
        calculateHeroData();
        calculateClickingInfo();
        calculateAllEfficiencies();
        updateEfficiencyData();
        prevPurchase = newPurchase;
    }
    heroData = savedHeroData;
    upgradeData = savedUpgradeData;
    calculateGlobalMultipliers();
    calculateHeroData();
    calculateClickingInfo();
    calculateAllEfficiencies();
    updateEfficiencyData();
}

function recalculate() { //Will be called initially to calculate everything and whenever
    calculateGlobalMultipliers();
    calculateHeroData();
    calculateClickingInfo();
    calculateAllEfficiencies();
    updateEfficiencyData();
    costToDesiredHeroSouls();
    findNext20Purchases();
}

function init() { //Init Phase
    populateArrays();
    fillInData();
    recalculate();
}

init();

//Functions for PostInit Phase - Updating DOM elements, Adding Event Listeners
function decodeSave() {
    var str = "";
    var antiCheat = "Fe12NAfA3R6z4k0z";
    if (saveData.search(antiCheat) != -1) {
        var firstSection = saveData.split(antiCheat)[0];
        for (var i = 0; i < firstSection.length; i++) {
            if (i % 2 == 0) {
                str += firstSection[i];
            }
        }
        if (typeof(JSON.parse(atob(str))) == "object") {
            parsedSaveData = JSON.parse(atob(str));
        } else {
            window.alert("Invalid Save File (Was not an Object), please create the save again");
            parsedSaveData = {};
        }
    } else {
        window.alert("Invalid Save File (Anti-Cheat String not Found)");
        parsedSaveData = {};
    }
}

function updateUserSave() { //after decoding a save this will put that decoded info into userSave
    if (parsedSaveData != {}) {
        userSave.heroes = [];
        for (var i = 0; i < heroKeys.length; i++) {
            var heroID = Number(heroData[i]["id"]);
            userSave.heroes[i] = [parsedSaveData.heroCollection.heroes[heroID].level, parsedSaveData.heroCollection.heroes[heroID].epicLevel];
        }
        userSave.achievements = [];
        var keys = Object.keys(parsedSaveData.achievements);
        for (var i = 0; i < achievKeys.length; i++) {
            var achievID = Number(achievData[i]["id"]);
            userSave.achievements[i] = keys.indexOf(achievID.toString()) > -1;
        }
        userSave.upgrades = [];
        var keys = Object.keys(parsedSaveData.upgrades);
        for (var i = 0; i < upgradeKeys.length; i++) {
            var upgradeID = Number(upgradeData[i]["id"]);
            userSave.upgrades[i] = keys.indexOf(upgradeID.toString()) > -1;
        }
        userSave.ancients = [];
        var keys = Object.keys(parsedSaveData.ancients.ancients);
        for (var i = 0; i < ancientKeys.length; i++) {
            var ancientID = Number(ancientData[i]["id"]);
            if (keys.indexOf(ancientID.toString()) > -1) {
                userSave.ancients[i] = parsedSaveData.ancients.ancients[ancientID].level;
            } else {
                userSave.ancients[i] = 0;
            }
        }
        userSave.heroSouls = parsedSaveData.heroSouls;
        userSave.allDPSMultiplier = parsedSaveData.allDpsMultiplier;
        userSave.highestZone = parsedSaveData.highestFinishedZonePersist;
        userSave.currentHighestZone = parsedSaveData.highestFinishedZone;
        userSave.currentZone = parsedSaveData.currentZoneHeight;
    }
}

function getOptions() {
    enableClicking = document.getElementById("enableClicking").checked;
    enableCritical = document.getElementById("enableCritical").checked;
    clickSpeed = document.getElementById("clickSpeed").value;
    if (isNaN(clickSpeed) || clickSpeed < 0) {
        clickSpeed = 0;
        document.getElementById("clickSpeed").value = 0;
    } else if (clickSpeed > 40) {
        clickSpeed = 40;
        document.getElementById("clickSpeed").value = 40;
    } else {
        clickSpeed = Number(clickSpeed);
    }
    currentZone = document.getElementById("currentZone").value;
    if (isNaN(currentZone) || Number(currentZone) <= 0) {
        currentZone = 1;
    } else {
        currentZone = Number(currentZone);
    }
    if (document.getElementById("enableHeroSouls").checked && document.getElementById("enableHeroSouls").checked != enableHeroSouls) {
        openedHeroSoulsPopup = false;
    }
    enableHeroSouls = document.getElementById("enableHeroSouls").checked;
    desiredHeroSouls = document.getElementById("desiredHeroSouls").value;
    if (isNaN(desiredHeroSouls) || desiredHeroSouls < 0) {
        desiredHeroSouls = 0;
        document.getElementById("desiredHeroSouls").value = 0;
    } else if (desiredHeroSouls > 25) {
        desiredHeroSouls = 25;
        document.getElementById("desiredHeroSouls").value = 25;
    } else {
        desiredHeroSouls = Number(desiredHeroSouls);
    }
}

function updateAll() {
    saveData = document.getElementById("savedata").value.toString();
    if (saveData != "") {
        decodeSave();
        updateUserSave();
        fillInData();
    }
    getOptions();
    recalculate();
    updateDOM();
}

function updateValues() {
    getOptions();
    recalculate();
    updateDOM();
}

function numberWithCommas(number) { //Converts 1234567 into 1,234,567. Also is compatible with decimals: 1234567.8910 -> 1,234,567.8910
    var parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function formatNumber(num) { //Converts a number into what is shown InGame
    if (!scientificNotation) {

        // Avoid divide-by-zero
        if (!num) {
          return '0';
        }

        // Negative powers
        if (num > -1 || num < 1) {
            return num.toPrecision(4);
        }

        var SIUnits = ["K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U", "D", "!", "@", "#", "$", "%", "^", "&", "*"];

        var original = num;

        var sign = num / Math.abs(num);
        num = Math.abs(num);

        var exponential = num.toExponential().split('e+');
        var power = +exponential[1];

        var digitsShown = 0;
        while (power >= 5) {
          power -= 3;
          digitsShown++;
        }

        var truncNumber = sign * exponential[0] * Math.pow(10, power);

        var str = numberWithCommas(Math.floor(truncNumber));

        if (digitsShown > SIUnits.length) {
            return original.toPrecision(4);
        }

        // Add sign
        if (digitsShown) {
            str += SIUnits[digitsShown - 1];
        }

        return str;
    } else {
        return num.toPrecision(4);
    }
}

function saveSaveData() { //Will save the data to local storage
    userSave.heroes = [];
    for (var i = 0; i < heroKeys.length; i++) {
        var heroID = Number(heroData[i]["id"]);
        userSave.heroes[i] = [heroData[i]["level"], heroData[i]["gilded"]];
    }
    userSave.achievements = [];
    for (var i = 0; i < achievKeys.length; i++) {
        userSave.achievements[i] = achievData[i]["owned"];
    }
    userSave.upgrades = [];
    for (var i = 0; i < upgradeKeys.length; i++) {
        userSave.upgrades[i] = upgradeData[i]["owned"];
    }
    userSave.ancients = [];
    for (var i = 0; i < ancientKeys.length; i++) {
        userSave.ancients[i] = ancientData[i]["level"];
    }
    userSave.heroSouls = heroSouls;
    userSave.allDPSMultiplier = allDPSMultiplier;
    userSave.highestZone = highestZoneReached;
    userSave.currentHighestZone = currentHighestZone;
    userSave.currentZone = currentZone;
    if (typeof(Storage) != "undefined" && Object.keys(userSave).length != 0) {
        localStorage.setItem("save", JSON.stringify(userSave));
    }
}

function updateEfficiencyTable() {
    var efficiencyTable = document.getElementById("efficiencyTableOut");
    if (efficiencyTable.rows.length == 0) {
        var headerRow = efficiencyTable.insertRow(0);
        headerRow.insertCell(0).appendChild(document.createTextNode("Name"));
        headerRow.insertCell(1).appendChild(document.createTextNode("Level"));
        headerRow.insertCell(2).appendChild(document.createTextNode("Buy"));
        for (var rownum = 0; rownum < 20; rownum++) {
            var insertingRow = efficiencyTable.insertRow(rownum + 1);
            if (next20Purchases[rownum][0] == "Hero") {
                insertingRow.insertCell(0).appendChild(document.createTextNode(heroData[next20Purchases[rownum][3]]["name"]));
                insertingRow.insertCell(1).appendChild(document.createTextNode(next20Purchases[rownum][4]));
            } else {
                var upgradeDiv = document.createElement("div");
                upgradeDiv.innerHTML = upgradeData[next20Purchases[rownum][3]]["name"] + "<br/>" + heroData[Number(upgradeData[next20Purchases[rownum][3]]["heroID"]) - 1]["name"];
                insertingRow.insertCell(0).appendChild(upgradeDiv);
                insertingRow.insertCell(1).appendChild(document.createTextNode("N/A"));
            }
            var insertingButton = document.createElement("input");
            insertingButton.setAttribute("type", "button");
            insertingButton.setAttribute("name", "buy" + rownum);
            insertingButton.setAttribute("value", "Buy");
            insertingButton.onclick = function (newrownum) {
                return function () {
                    purchaseFromEfficiency(newrownum);
                };
            }(rownum);
            insertingRow.insertCell(2).appendChild(insertingButton);
        }
    } else {
        for (var rownum = 0; rownum < 20; rownum++) {
            var rowchanging = efficiencyTable.rows[rownum + 1];
            if (next20Purchases[rownum][0] == "Hero") {
                rowchanging.cells[0].innerHTML = heroData[next20Purchases[rownum][3]]["name"];
                rowchanging.cells[1].innerHTML = next20Purchases[rownum][4];
            } else {
                var upgradeDiv = document.createElement("div");
                upgradeDiv.innerHTML = upgradeData[next20Purchases[rownum][3]]["name"] + "<br/>" + heroData[Number(upgradeData[next20Purchases[rownum][3]]["heroID"]) - 1]["name"];
                rowchanging.cells[0].innerHTML = "";
                rowchanging.cells[0].appendChild(upgradeDiv);
                rowchanging.cells[1].innerHTML = "N/A";
            }
        }
    }
    if (totalGPS > requiredGPS && enableHeroSouls && !isPopupOpen) {
        createPopup("Hero Souls");
    }
}

function updateAchievement(achievID) {
    achievData[achievID]["owned"] = document.getElementById("achievementIn" + achievID).checked;
    recalculate();
    updateDOM();
}

function updateAchievementInTable() {
    var achievementTable = document.getElementById("achievTableIn");
    if (achievementTable.rows.length == 0) {
        for (var i = 0; i < Object.keys(achievData).length; i++) {
            sortedAchievements[i] = [achievData[i]["name"], i]
        }
        sortedAchievements.sort();
        for (var rownum = 0; rownum < Object.keys(achievData).length; rownum++) {
            var insertingRow = achievementTable.insertRow(rownum);
            var achievNameElem = document.createTextNode(sortedAchievements[rownum][0]);
            var achievCheckBox = document.createElement("input");
            achievCheckBox.setAttribute("type", "checkbox");
            achievCheckBox.setAttribute("id", "achievementIn" + sortedAchievements[rownum][1]);
            if (achievData[sortedAchievements[rownum][1]]["owned"]) {
                achievCheckBox.setAttribute("checked", "checked");
            }
            achievCheckBox.onchange = function (newrownum) {
                return function () {
                    updateAchievement(sortedAchievements[newrownum][1]);
                };
            }(rownum);
            insertingRow.insertCell(0).appendChild(achievNameElem);
            insertingRow.insertCell(1).appendChild(achievCheckBox);
        }
    } else {
        for (var i = 0; i < achievementTable.rows.length; i++) {
            document.getElementById("achievementIn" + sortedAchievements[i][1]).checked = achievData[sortedAchievements[i][1]]["owned"];
        }
    }
}

function purchaseFromEfficiency(num) {
    var pur = next20Purchases[num];
    if (pur[0] == "Hero") {
        heroData[pur[3]]["level"] = pur[4];
    } else if (pur[0] == "Upgrade") {
        upgradeData[pur[3]]["owned"] = true;
        if (heroData[upgradeData[pur[3]]["heroID"] - 1]["level"] < upgradeData[pur[3]]["level"]) {
            heroData[upgradeData[pur[3]]["heroID"] - 1]["level"] = upgradeData[pur[3]]["level"];
        }
    } else {
        window.alert("Invalid Efficiency Type" + pur[0].toString());
    }
    getOptions();
    recalculate();
    updateDOM();
}

function updateStats() {
    document.getElementById("statstotaldps").innerHTML = formatNumber(heroDPS);
    document.getElementById("statsclickdamage").innerHTML = formatNumber(clickDamage);
    if (totalGPS < 100000) {
        var gpsDigitCount = totalGPS && Math.floor(1 + (Math.log(totalGPS) / Math.LN10));
        document.getElementById("statstotalgps").innerHTML = numberWithCommas(totalGPS.toFixed(5 - gpsDigitCount));
    } else {
        document.getElementById("statstotalgps").innerHTML = formatNumber(totalGPS);
    }
    document.getElementById("statsherosouls").innerHTML = heroSouls.toString();
    document.getElementById("statsdarkrituals").innerHTML = darkRitualsUsed.toString();
    document.getElementById("statsenergizeddarkrituals").innerHTML = energizedDarkRitualsUsed.toString();
    var achievcount = 0;
    for (var achievnum = 0; achievnum < Object.keys(achievData).length; achievnum++) {
        achievcount += achievData[Object.keys(achievData)[achievnum]]["owned"];
    }
    document.getElementById("statsachievementsunlocked").innerHTML = achievcount.toString() + "/87";
    var levelcount = 0;
    for (var heronum = 0; heronum < Object.keys(heroData).length; heronum++) {
        levelcount += heroData[Object.keys(heroData)[heronum]]["level"];
    }
    document.getElementById("statsherolevels").innerHTML = levelcount.toString();
    document.getElementById("statsgainedherosouls").innerHTML = Math.floor(levelcount / 2000).toString();
    document.getElementById("statsachievementmultiplier").innerHTML = (+achievementMultiplier.toFixed(4)).toString();
    document.getElementById("statsupgrademultiplier").innerHTML = (+allHeroMultiplier.toFixed(4)).toString();
    document.getElementById("statsherosoulsmultiplier").innerHTML = (+heroSoulsMultiplier.toFixed(4)).toString();
    document.getElementById("statsdarkritualmultiplier").innerHTML = (+darkRitualMultiplier.toFixed(4)).toString();
    document.getElementById("statsefficiencyType").innerHTML = (efficiencyType.toString());
}

function updateHeroDataOutTable() {
    var heroTable = document.getElementById("heroTableOut");
    if (heroTable.rows.length == 0) {
        var headerRow = heroTable.insertRow(0);
        headerRow.insertCell(0).appendChild(document.createTextNode("Hero Name"));
        headerRow.insertCell(1).appendChild(document.createTextNode("Level"));
        headerRow.insertCell(2).appendChild(document.createTextNode("Gilds"));
        headerRow.insertCell(3).appendChild(document.createTextNode("DPS"));
        for (var rownum = 1; rownum <= heroKeys.length; rownum++) {
            var insertingRow = heroTable.insertRow(rownum);
            insertingRow.insertCell(0).appendChild(document.createTextNode(heroData[rownum - 1]["name"]));
            insertingRow.insertCell(1).appendChild(document.createTextNode(heroData[rownum - 1]["level"]));
            insertingRow.insertCell(2).appendChild(document.createTextNode(heroData[rownum - 1]["gilded"]));
            insertingRow.insertCell(3).appendChild(document.createTextNode(formatNumber(heroData[rownum - 1]["currentDPS"])));
        }
    } else {
        for (var rownum = 1; rownum <= heroKeys.length; rownum++) {
            var rowchanging = heroTable.rows[rownum];
            rowchanging.cells[0].innerHTML = heroData[rownum - 1]["name"];
            rowchanging.cells[1].innerHTML = heroData[rownum - 1]["level"];
            rowchanging.cells[2].innerHTML = heroData[rownum - 1]["gilded"];
            rowchanging.cells[3].innerHTML = formatNumber(heroData[rownum - 1]["currentDPS"]);
        }
    }
}

function createPopup(type, id) {
    isPopupOpen = true;
    var popupDiv = document.getElementById("popupdiv");
    popupDiv.innerHTML = "";
    if (type == "Hero") {
        popupDiv.style.display = "block";
        var linebreak = document.createElement("br");
        //Hero Name Element
        var heroNameElem = document.createTextNode("Name: " + heroData[id]["name"]);
        //Level Input Element
        var levelDescElem = document.createTextNode("Level: ");
        var levelInputElem = document.createElement("input");
        levelInputElem.setAttribute("type", "number");
        levelInputElem.setAttribute("value", heroData[id]["level"]);
        levelInputElem.setAttribute("id", "heroLevelInput");
        //Gilded Input Element
        var gildDescElem = document.createTextNode("Gilds: ");
        var gildInputElem = document.createElement("input");
        gildInputElem.setAttribute("type", "number");
        gildInputElem.setAttribute("value", heroData[id]["gilded"]);
        gildInputElem.setAttribute("id", "heroGildInput");
        //Hero Upgrades Element
        var upgradeDescElem = document.createTextNode("Upgrades: ");
        var upgradeNamesArray = [];
        var upgradeElemArray = [];
        for (var i = 0; i < heroData[id]["upgrades"].length; i++) {
            upgradeNamesArray[i] = document.createTextNode(upgradeData[heroData[id]["upgrades"][i]]["name"]);
            upgradeElemArray[i] = document.createElement("input");
            upgradeElemArray[i].setAttribute("type", "checkbox");
            if (upgradeData[heroData[id]["upgrades"][i]]["owned"]) {
                upgradeElemArray[i].setAttribute("checked", "checked");
            }
            upgradeElemArray[i].setAttribute("id", "upgradeInput" + i);
        }
        //Append all Elements
        popupDiv.appendChild(heroNameElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(levelDescElem);
        popupDiv.appendChild(levelInputElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(gildDescElem);
        popupDiv.appendChild(gildInputElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(upgradeDescElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        var upgradeLevelsOrder = [];
        for (var j = 0; j < upgradeElemArray.length; j++) {
            upgradeLevelsOrder.push([j, upgradeData[heroData[id]["upgrades"][j]]["level"]]);
            upgradeLevelsOrder.sort(compareSecondColumn);
        }
        for (var k = 0; k < upgradeElemArray.length; k++) {
            var curUpg = upgradeLevelsOrder[k];
            popupDiv.appendChild(upgradeNamesArray[curUpg[0]]);
            popupDiv.appendChild(upgradeElemArray[curUpg[0]]);
            popupDiv.appendChild(linebreak.cloneNode(true));
        }
        var closeButton = document.createElement("input");
        closeButton.setAttribute("type", "button");
        closeButton.setAttribute("value", "Close and Save");
        closeButton.onclick = function (heroID) {
            return function () {
                closePopup("Hero", heroID)
            };
        }(id);
        popupDiv.appendChild(closeButton);
    } else if (type == "Ancient") {
        popupDiv.style.display = "block";
        var linebreak = document.createElement("br");
        //Ancient Name
        var ancientNameElem = document.createTextNode("Name: " + ancientData[id]["name"]);
        //Level Input Element
        var levelDescElem = document.createTextNode("Level: ");
        var levelInputElem = document.createElement("input");
        levelInputElem.setAttribute("type", "number");
        levelInputElem.setAttribute("value", ancientData[id]["level"]);
        levelInputElem.setAttribute("id", "ancientLevelInput");
        popupDiv.appendChild(ancientNameElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(levelDescElem);
        popupDiv.appendChild(levelInputElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        var closeButton = document.createElement("input");
        closeButton.setAttribute("type", "button");
        closeButton.setAttribute("value", "Close and Save");
        closeButton.onclick = function (heroID) {
            return function () {
                closePopup("Ancient", heroID)
            };
        }(id);
        popupDiv.appendChild(closeButton);
    } else if (type == "Hero Souls" && !openedHeroSoulsPopup) {
        openedHeroSoulsPopup = true;
        popupDiv.style.display = "block";
        var linebreak = document.createElement("br");
        var heroSoulsDescElem = document.createTextNode("You are up the stage in this world where you can start buying enough heroes to get the desired amount of " + desiredHeroSouls + " hero souls. If you wish to continue on without ascending you can click on the Ignore button below. If you wish to change the number of hero souls you desire you can type that in the box and press close. Please note that this box will be based off your current zone so please make sure to set the current zone to what you are actually on. If you would like to go ahead with ascending then use the hero level distribution below to aid you in buying the heroes so they are the right level");
        popupDiv.appendChild(heroSoulsDescElem);
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(linebreak.cloneNode(true));
        for (var i = 0; i < 26; i++) {
            var heroLevelElem = document.createTextNode(heroData[i]["name"] + " Level: " + heroSoulsLevels[i]);
            popupDiv.appendChild(heroLevelElem);
            popupDiv.appendChild(linebreak.cloneNode(true));
        }
        popupDiv.appendChild(linebreak.cloneNode(true));
        var heroSoulsInputDescElem = document.createTextNode("Desired Hero Souls: ");
        var heroSoulsInputElem = document.createElement("input");
        heroSoulsInputElem.setAttribute("type", "number");
        heroSoulsInputElem.setAttribute("value", desiredHeroSouls.toString());
        heroSoulsInputElem.setAttribute("id", "popupDesiredHeroSouls");
        popupDiv.appendChild(heroSoulsInputDescElem);
        popupDiv.appendChild(heroSoulsInputElem);
        var ignoreButton = document.createElement("input");
        ignoreButton.setAttribute("type", "button");
        ignoreButton.setAttribute("value", "Ignore and continue");
        ignoreButton.onclick = function () {
            closePopup("Hero Souls", 2)
        };
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(ignoreButton);
        var closeButton = document.createElement("input");
        closeButton.setAttribute("type", "button");
        closeButton.setAttribute("value", "Close and Save");
        closeButton.onclick = function () {
            closePopup("Hero Souls", 1);
            openedHeroSoulsPopup = false;
        };
        popupDiv.appendChild(linebreak.cloneNode(true));
        popupDiv.appendChild(closeButton);
    }
}

function closePopup(type, id) {
    isPopupOpen = false;
    var isValid = true;
    var timesAlerted = 0;
    if (type == "Hero") {
        heroData[id]["level"] = Number(document.getElementById("heroLevelInput").value);
        heroData[id]["gilded"] = Number(document.getElementById("heroGildInput").value);
        for (var i = 0; i < heroData[id]["upgrades"].length; i++) {
            if (document.getElementById("upgradeInput" + i).checked && heroData[id]["level"] < upgradeData[heroData[id]["upgrades"][i]]["level"]) {
                if (timesAlerted == 0) {
                    window.alert("Hero can not be level " + heroData[id]["level"] + " if you have " + upgradeData[heroData[id]["upgrades"][i]]["name"] + " which requires at least level " + upgradeData[heroData[id]["upgrades"][i]]["level"]);
                    isValid = false;
                }
            }
            upgradeData[heroData[id]["upgrades"][i]]["owned"] = document.getElementById("upgradeInput" + i).checked;
        }
    } else if (type == "Ancient") {
        if (ancientData[id]["maxLevel"] == 0 || Number(document.getElementById("ancientLevelInput").value) <= ancientData[id]["maxLevel"]) {
            ancientData[id]["level"] = Number(document.getElementById("ancientLevelInput").value);
        } else {
            window.alert(ancientData[id]["name"] + "can't be higher than level " + ancientData[id]["maxLevel"]);
            isValid = false;
        }
    } else if (type == "Hero Souls") {
        if (id == 2) {
            document.getElementById("enableHeroSouls").checked = false;
            enableHeroSouls = false;
        }
        desiredHeroSouls = document.getElementById("popupDesiredHeroSouls").value;
        if (isNaN(desiredHeroSouls) || desiredHeroSouls < 0) {
            desiredHeroSouls = 0;
        } else if (desiredHeroSouls > 25) {
            desiredHeroSouls = 25;
        } else {
            desiredHeroSouls = Number(desiredHeroSouls);
        }
        document.getElementById("desiredHeroSouls").value = desiredHeroSouls;
    }
    if (isValid) {
        document.getElementById("popupdiv").style.display = "none";
        recalculate();
        updateDOM();
    }
}

function graph() {
    google.load('visualization', '1.0', {
        packages: ['corechart'],
        callback: function drawChart() {
            var data = new google.visualization.arrayToDataTable([
                ["Hero", "DPS"],
                ["Cid", heroData[0]["currentClickDamage"] * clickSpeed],
                ["Treebeast", heroData[1]["currentDPS"]],
                ["Ivan", heroData[2]["currentDPS"]],
                ["Brittany", heroData[3]["currentDPS"]],
                ["The Wandering Fisherman", heroData[4]["currentDPS"]],
                ["Betty", heroData[5]["currentDPS"]],
                ["The Masked Samurai", heroData[6]["currentDPS"]],
                ["Leon", heroData[7]["currentDPS"]],
                ["The Great Forest Seer", heroData[8]["currentDPS"]],
                ["Alexa", heroData[9]["currentDPS"]],
                ["Natalia", heroData[10]["currentDPS"]],
                ["Mercedes", heroData[11]["currentDPS"]],
                ["Bobby", heroData[12]["currentDPS"]],
                ["Broyle", heroData[13]["currentDPS"]],
                ["Sir George II", heroData[14]["currentDPS"]],
                ["King Midas", heroData[15]["currentDPS"]],
                ["Referi Jerator", heroData[16]["currentDPS"]],
                ["Abbadon", heroData[17]["currentDPS"]],
                ["Ma Zhu", heroData[18]["currentDPS"]],
                ["Amenhoep", heroData[19]["currentDPS"]],
                ["Beastlord", heroData[20]["currentDPS"]],
                ["Athena", heroData[21]["currentDPS"]],
                ["Aphrodite", heroData[22]["currentDPS"]],
                ["Shinatobe", heroData[23]["currentDPS"]],
                ["Grant", heroData[24]["currentDPS"]],
                ["Frostleaf", heroData[25]["currentDPS"]]
            ]);
            var options = {
                title: 'Pie Chart of Hero DPS',
                titleTextStyle: {
                    fontSize: 15,
                    bold: true
                },
                backgroundColor: '#E3DAC9',
                chartArea: {left: 20, top: 50, width: '100%', height: '100%'},
                is3D: true
            };
            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
            chart.draw(data, options);
        }
    })
}

function updateDOM() { //Will put calculated elements onto their respective DOM elements
    updateStats();
    updateEfficiencyTable();
    updateHeroDataOutTable();
    updateAchievementInTable();
    graph();
}

function addEventListeners() { //Everything that requires waiting for user input goes here
    document.getElementById("updateSaveData").onclick = updateAll;
    document.getElementById("saveAll").onclick = saveSaveData;
    document.getElementById("updateValues").onclick = updateValues;
    document.getElementById("clearSave").onclick = function () {
        localStorage.removeItem("save");
        updateValues();
    };
    document.getElementById("changeEfficiencyType").onclick = function () {
        efficiencyType = (efficiencyType % 4) + 1;
        updateValues();
    };
    document.getElementById("enableScientific").onclick = function () {
        scientificNotation = !scientificNotation;
        updateValues();
    };
    document.getElementById("useDarkRitual").onclick = function () {
        allDPSMultiplier *= 1.05;
        updateValues();
    };
    document.getElementById("useEnergDarkRitual").onclick = function () {
        allDPSMultiplier *= 1.1;
        updateValues();
    };
    window.onresize = updateDOM;
    var heroTabIn = document.getElementById("heroTableIn");
    for (var i = 0; i < heroTabIn.rows.length; i++) {
        for (var j = 0; j < heroTabIn.rows[i].cells.length; j++) {
            heroTabIn.rows[i].cells[j].onclick = (function (i, j) {
                return function () {
                    createPopup("Hero", (4 * i) + j);
                };
            }(i, j));
        }
    }
    var ancientTabIn = document.getElementById("ancientTableIn");
    for (var i = 0; i < ancientTabIn.rows.length; i++) {
        for (var j = 0; j < ancientTabIn.rows[i].cells.length; j++) {
            ancientTabIn.rows[i].cells[j].onclick = (function (i, j) {
                return function () {
                    createPopup("Ancient", (4 * i) + j);
                };
            }(i, j));
        }
    }
}

function postInit() { //PostInit Phase
    updateDOM();
    addEventListeners();
}

postInit();