//This was made by VikeStep and stennett

/*
TODO:
- Convert large numbers to run off Base64 Maths
- Buttons and options to toggle clicking, critical and click speed
- Factor in desired Hero Souls to calculations
- Add in Efficiencies for Achievements, Ancients and possibly ascending
- Add in Ancient Info and their effects
- Add in Zone information to find Gold per Second when Idle
- Add in Max DPS using Skills
- Timer that recalculates every specified time (config)
- Option to use scientific notation for numbering
- Update CSS and HTML
- Factor in Clicking to Hero multiplier Upgrades
*/

//Initialising Global Variables
var userSave = Object(); //Holds all current info - can possibly request off people for debugging purposes
var localStorageSaveString = ""; //String version of userSave to keep in localStorage

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
var efficiencyData = Array();

var saveData = ""; //Encoded Save Data
var parsedSaveData = Object(); //Decoded Save Data

var totalDPS = 0;
var heroDPS = 0;
var heroSouls = 0;
var currentHighestZone = 0;
var ascensionCount = 0;
var heroSoulsFromAscension = 0;
var desiredHeroSouls = 0;
var highestZoneReached = 0;
var mostEfficientPurchase = "";

var enableClicking = false;
var enableCritical = false;
var clickSpeed = 0;
var clickDamage = 0;
var criticalClickDamage = 0;
var criticalClickChance = 0;
var criticalClickMultiplier = 10;
var clickDPS = 0;
var criticalClickDPS = 0;

var darkRitualsCalculated = false;
var darkRitualsUsed = 0;
var energizedDarkRitualsUsed = 0;
var achievementMultiplier = 1;
var darkRitualMultiplier = 1;
var allHeroMultiplier = 1;
var heroSoulsMultiplier = 1;
var allDPSMultiplier = 1;

//Functions for PreInit Phase - Loading all the data from local storage
function loadLocalStorage() { //Will grab the data from local storage
	if (typeof(Storage) != "undefined") {
		localStorageSave = localStorage.getItem("save");
		if (localStorageSave != null) {
			userSave = JSON.parse(localStorageSave);
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
	return heroData[heroID-1]["baseCost"] * [10,25,100,800,8000,40000,400000][[10,25,50,75,100,125,150].indexOf(level)];	
}

function calculateLevelUpCost(heroID, level) {
	if (heroData[heroID]["id"] == 1 && level <= 15) {
		return Math.floor((5 + level) * Math.pow(1.07, level));
	} else if (heroData[heroID]["id"] == 1) {
		return Math.floor(20 * Math.pow(1.07, level));
	} else {
		return Math.floor(heroData[heroID]["baseCost"] * Math.pow(1.07, level) * (1 - (ancientData[8]["level"] * 0.02)));
	}
}

function calculateCostUpToLevel(heroID, level1, level2) {
	var sum = 0;
	for (j = level1; j < level2; j++) {
		sum = sum + calculateLevelUpCost(heroID, j);
	}
	return sum;
}

function splitParams(param) { //Simply splits a string into array where ", " or "," occurs
	return param.split(" ").join("").split(",");
}

function populateArrays() { //Populates the 4 main arrays with data from the json and with placeholders for fillInData()
	//Hero Data
	for (i = 0; i < heroKeys.length; i++) {
		//Static Data
		heroData[i] = Array();
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
		heroData[i]["upgrades"] = Array();
	}
	//Upgrade Data
	for (i = 0; i < upgradeKeys.length; i++) {
		//Static Data
		upgradeData[i] = Array();
		var impUpgradeData = impUpg[upgradeKeys[i]];
		upgradeData[i]["id"] = impUpgradeData.id;
		upgradeData[i]["heroID"] = impUpgradeData.heroId;
		upgradeData[i]["name"] = impUpgradeData.name;
		upgradeData[i]["level"] = impUpgradeData.heroLevelRequired;
		upgradeData[i]["type"] = impUpgradeData.upgradeFunction;
		upgradeData[i]["upgradeParams"] = splitParams(impUpgradeData.upgradeParams);
		upgradeData[i]["cost"] = calculateUpgradeCost(upgradeData[i]["level"],upgradeData[i]["heroID"])
		heroData[upgradeData[i]["heroID"]-1]["upgrades"].push(i);
		//Dynamic Data
		upgradeData[i]["owned"] = false;
		upgradeData[i]["totalCost"] = 0;
		upgradeData[i]["DPSChange"] = 0;
		upgradeData[i]["efficiency"] = 0;
	}
	//Achievement Data
	for (i = 0; i < achievKeys.length; i++) {
		//Static Data
		achievData[i] = Array();
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
	for (i = 0; i < ancientKeys.length; i++) {
		//Static Data
		ancientData[i] = Array();
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
		for (i = 0; i < heroKeys.length; i++) {
			heroData[i]["level"] = userSave.heroes[i][0];
			heroData[i]["gilded"] = userSave.heroes[i][1];
		}
		for (i = 0; i < achievKeys.length; i++) {
			achievData[i]["owned"] = userSave.achievements[i];
		}
		for (i = 0; i < upgradeKeys.length; i++) {
			upgradeData[i]["owned"] = userSave.upgrades[i];
		}
		for (i = 0; i < ancientKeys.length; i++) {
			ancientData[i]["level"] = userSave.ancients[i];
		}
		heroSouls = userSave.heroSouls;
		allDPSMultiplier = userSave.allDPSMultiplier;
		highestZoneReached = userSave.highestZone;
		currentHighestZone = userSave.currentZone;
	}
}

function calculateDarkRitualInfo() { //Will reverse engineer to find the amount of dark rituals used comparing save data to calculated data
	if (allDPSMultiplier != 0) {
		var unknownMult = allDPSMultiplier / (allHeroMultiplier * achievementMultiplier);
		var maxA = Math.floor(logBase(1.05, unknownMult));
		var maxB = Math.floor(logBase(1.1, unknownMult));
		var closest = [0, 0, 1, unknownMult];
		for (k = 0; k < maxA; k++) {
			for (l = 0; l < maxB; l++) {
				var mult = Math.pow(1.05, k) * Math.pow(1.1, l);
				if (Math.abs(mult - unknownMult) < closest[3]) {
					closest = [k, l, mult, Math.abs(mult - unknownMult)];
				}
			}
		}
		darkRitualsUsed = closest[0];
		energizedDarkRitualsUsed = closest[1];
		darkRitualMultiplier = Math.pow(1.05,darkRitualsUsed) * Math.pow(1.1,energizedDarkRitualsUsed);
	} else {
		darkRitualsUsed = 0;
		energizedDarkRitualsUsed = 0;
		darkRitualMultiplier = 1;
	}
	darkRitualsCalculated = true;
}

function calculateGlobalMultipliers() { //Calculates global multipliers that cover all heroes. These come from achievements, upgrades and hero souls
	darkRitualsCalculated = false;
	darkRitualMultiplier = 1;
	darkRitualsUsed = 0;
	energizedDarkRitualsUsed = 0;
	achievementMultiplier = 1;
	for (i=0; i < achievKeys.length; i++) {
		if (achievData[i]["type"] == "addDps" && achievData[i]["owned"] == true) {
			achievementMultiplier = achievementMultiplier * (1 + (Number(achievData[i]["rewardParams"][0]) / 100));
		}
	}
	allHeroMultiplier = 1;
	for (i=0; i < upgradeKeys.length; i++) {
		if (upgradeData[i]["type"] == "upgradeEveryonePercent" && upgradeData[i]["owned"] == true) {
			allHeroMultiplier = allHeroMultiplier * (1 + (Number(upgradeData[i]["upgradeParams"][0]) / 100));
		}
	}
	heroSoulsMultiplier = 1 + (heroSouls / 10);
	darkRitualMultiplier = Math.pow(1.05, darkRitualsUsed) * Math.pow(1.1, energizedDarkRitualsUsed);
}

function calculateNextDPSChange(heroID, level) {
	if ((level + 1) % 1000 == 0) {
		return ((9 * level) + 10) * (heroData[i]["currentDPS"] / level);
	} else if ((level + 1) % 25 == 0 && level >= 199) {
		return ((3 * level) + 4) * (heroData[i]["currentDPS"] / level);
	} else if (level != 0) {
		return heroData[i]["currentDPS"] / level;
	} else {
		return heroData[i]["baseDPS"];
	}
}

function calculateHeroData() { //Calculates levelMultiplier, nextCost, currentDPS and nextDPSChange for the heroes
	for (i = 0; i < heroKeys.length; i++) {
		//Calculate levelMultiplier
		if (heroData[i]["level"] >= 200 && heroData[i]["id"] != 1) {
			var thousandCount = 0;
			var multiCount = Math.floor(1 + ((heroData[i]["level"] - 200) / 25));
			if (heroData[i]["level"] >= 1000) {
				thousandCount = Math.floor(heroData[i]["level"] / 1000);
			}
			heroData[i]["levelMultiplier"] = Math.pow(4,multiCount-thousandCount) * Math.pow(10,thousandCount);
		} else {
			heroData[i]["levelMultiplier"] = 1;
		}
		//Calculate nextCost
		heroData[i]["nextCost"] = calculateLevelUpCost(i, heroData[i]["level"]);
	}
	var loopFlag = true;
	while (loopFlag) {
		heroDPS = 0;
        for (i = 0; i < heroKeys.length; i++) {
        
			heroData[i]["currentDPS"] = heroData[i]["level"] * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * heroData[i]["levelMultiplier"] * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
			for (j = 0; j < heroData[i]["upgrades"].length; j++) {
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
	for (i = 0; i < heroKeys.length; i++) {
		heroData[i]["nextDPSChange"] = calculateNextDPSChange(i, heroData[i]["level"]);
	}
}

function calculateClickingInfo() {
	//Calculate Cid Click Damage
	var value1 = 1;
	for (i = 0; i < upgradeKeys.length; i++) {
		var upgradeA = upgradeData[i];
		if (upgradeA["type"] == "upgradeClickPercent" && upgradeA["owned"] == true) {
			value1 = value1 * (1 + (Number(upgradeA["upgradeParams"][0]) / 100));
		}
	}
	heroData[0]["currentClickDamage"] = heroData[0]["baseClickDamage"] * heroData[0]["level"] * value1 * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier; //Cid's Click Damage
	
	//Calculate Click Damage from Upgrades
	var value2 = 0;
	for (i = 0; i < upgradeKeys.length; i++) {
		var upgradeB = upgradeData[i];
		if (upgradeB["type"] == "upgradeClickDpsPercent" && upgradeB["owned"] == true) {
			value2 = value2 + Number(upgradeB["upgradeParams"][0]);
		}
	}
	var upgradeClickDPS = heroDPS * (value2 / 100);
	
	baseClickDamage = 1;
	for (i = 0; i < achievKeys.length; i++) {
		var achievA = achievData[i];
		if (achievA["type"] == "addClickDamage" && achievA["owned"] == true) {
			baseClickDamage = baseClickDamage + Number(achievA["rewardParams"][0]);
		}
	}

	clickDamage = Math.floor((Math.ceil(heroData[0]["currentClickDamage"]) + Math.floor(upgradeClickDPS)) * (1 + (ancientData[16]["level"] * 0.2))) + baseClickDamage;
	var cid1LevelDamageChange;
	if (heroData[0]["level"] != 0) {
		cid1LevelDamageChange = (Math.floor((Math.ceil((heroData[0]["currentClickDamage"]) * ((heroData[0]["level"] + 1) / heroData[0]["level"])) + Math.floor(upgradeClickDPS)) * (1 + (ancientData[16]["level"] * 0.2))) + baseClickDamage) - clickDamage;
	} else {
		cid1LevelDamageChange = heroData[0]["baseClickDamage"] * value1 * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier;
	}
	
	if (cid1LevelDamageChange == 0) {//This is a safeguard for integer precision issues
		cid1LevelDamageChange = ((1 + (ancientData[16]["level"] * 0.2)) * (heroData[0]["currentClickDamage"])) / heroData[0]["level"]; //Simplified form of previous calculations without Ceil or Floor
	}
	//Calculate Critical Click Chance
	var value3 = 0;
	for (i = 0; i < upgradeKeys.length; i++) {
		var upgradeC = upgradeData[i];
		if (upgradeC["type"] == "upgradeCriticalChance" && upgradeC["owned"] == true) {
			value3 = value3 + Number(upgradeC["upgradeParams"][0]);
		}
	}
	criticalClickChance = value3;
	
	//Calculate Critical Click Damage
	var value4 = 10; //Critical Multiplier
	for (i = 0; i < upgradeKeys.length; i++) {
		var upgradeD = upgradeData[i];
		if (upgradeD["type"] == "upgradeCriticalDamage" && upgradeD["owned"] == true) {
			value4 = value4 + Number(upgradeD["upgradeParams"][0]);
		}
	}
	criticalClickMultiplier = value4;
	criticalClickDamage = ((criticalClickChance * criticalClickMultiplier * clickDamage) + ((100 - criticalClickChance) * clickDamage)) / 100;
	cid1LevelCriticalDamageChange = (criticalClickDamage * cid1LevelDamageChange) / clickDamage; //Simplified Formula for Damage Difference
	
	clickDPS = clickDamage * clickSpeed * enableClicking;
	cidNextClickDPSChange = clickSpeed * cid1LevelDamageChange * enableClicking;
	criticalClickDPS = criticalClickDamage * clickSpeed * enableClicking;
	cidNextCriticalClickDPSChange = cid1LevelCriticalDamageChange * clickSpeed * enableClicking;
	
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

function calculateEfficiency(cost, change) {
	if (change != 0) {
		return (1.15 * (cost / totalDPS)) + (cost / change);
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
	var smallest = ["NOTHING",0];
	efficiencyData.length = 0;
	for (i = 1; i < heroKeys.length; i++) {
		efficiencyData.push(["Hero,1," + i, heroData[i]["efficiency1"]]);
		efficiencyData.push(["Hero,4," + i, heroData[i]["efficiency4x"]]);
		efficiencyData.push(["Hero,10," + i, heroData[i]["efficiency10x"]]);
	}
	if (heroData[0]["efficiency1"] != 0 && heroData[0]["efficiency1"] != Infinity) {
		efficiencyData.push(["Hero,1,0",heroData[0]["efficiency1"]]);
	}
	for (i = 0; i < upgradeKeys.length; i++) {
		if (upgradeData[i]["owned"] == false) {
			efficiencyData.push(["Upgrade,"+i, upgradeData[i]["efficiency"]]);
		}
	}
	for (i = 0; i < Object.keys(efficiencyData).length; i++) {
		if (efficiencyData[i][1] != 0 && smallest[1] == 0) {
			smallest = efficiencyData[i];
		} else if (efficiencyData[i][1] < smallest[1] && efficiencyData[i][1] != 0) {
			smallest = efficiencyData[i];
		}
	}
	mostEfficientPurchase = smallest;
	efficiencyData.sort(compareSecondColumn);
}

function calculateUpgradeTotalCost(heroID, upgradeID) {
	var hero1 = heroData[heroID];
	var upgrade1 = upgradeData[upgradeID];
	return calculateCostUpToLevel(heroID, hero1["level"], upgrade1["level"]) + upgrade1["cost"];
}

function DPSGainedHero(heroID, level) {
	heroB = heroData[heroID];
	heroBDPS = heroB["currentDPS"];
	if (heroB["level"] != 0 && heroB["level"] < level) {
		return heroBDPS * ((level / heroB["level"]) - 1);
	} else if (heroB["level"] < level) {
		return level * heroB["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * (1 + (heroB["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
	} else {
		return 0
	}
}

function calculateAllEfficiencies() {
	//Heroes (minus Cid)
	for (i = 1; i < heroKeys.length; i++) {
		var cost4xMult;
		var DPS4xChange;
		var cost10xMult;
		var DPS10xChange;
		//1 Level
		heroData[i]["efficiency1"] = calculateEfficiency(heroData[i]["nextCost"], heroData[i]["nextDPSChange"]);
		//Next 4x and 10x Multiplier
		if (heroData[i]["level"] < 200 && heroData[i]["level"] != 0) {
			cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], 200);
			DPS4xChange = (4 * (heroData[i]["currentDPS"] * (200 / heroData[i]["level"]))) - heroData[i]["currentDPS"];
			cost10xMult = calculateCostUpToLevel(i, heroData[i]["level"], 1000);
			DPS10xChange = (10 * Math.pow(4, 32) * (heroData[i]["currentDPS"] * (1000 / heroData[i]["level"]))) - heroData[i]["currentDPS"];
		} else if (heroData[i]["level"] != 0) {
			var next4xlevel = Math.ceil((heroData[i]["level"]+1) / 25) * 25;
			cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
			var other10xbonus = 0;
			if (next4xlevel % 1000 == 0) {
				next4xlevel = next4xlevel + 25;
				cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
				other10xbonus = 1;
			}
			DPS4xChange = (Math.pow(10, other10xbonus) * 4 * (heroData[i]["currentDPS"] * (next4xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
			var next10xlevel = Math.ceil((heroData[i]["level"]+1) / 1000) * 1000;
			cost10xMult = calculateCostUpToLevel(i, heroData[i]["level"], next10xlevel);
			var other4xbonus = Math.floor((next10xlevel - (heroData[i]["level"]+1)) / 25);
			DPS10xChange = (Math.pow(4, other4xbonus) * 10 * (heroData[i]["currentDPS"] * (next10xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
		} else {
			cost4xMult = calculateCostUpToLevel(i, 0, 200);
			cost10xMult = calculateCostUpToLevel(i, 0, 1000);
			DPS4xChange = 200 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 4 * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
			DPS10xChange = 1000 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 10 * Math.pow(4, 32) * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * ancientData[25]["level"]))));
		}
		heroData[i]["efficiency4x"] = calculateEfficiency(cost4xMult, DPS4xChange);
		heroData[i]["efficiency10x"] = calculateEfficiency(cost10xMult, DPS10xChange);
	}
	heroData[0]["efficiency1"] = calculateEfficiency(heroData[0]["nextCost"], heroData[0]["nextDPSChange"]);
	heroData[0]["efficiency4x"] = "N/A";
	heroData[0]["efficiency10x"] = "N/A";
	
	//Upgrades
	for (i = 0; i < upgradeKeys.length; i++) {
		if (upgradeData[i]["owned"] == false) {
			upgradeData[i]["totalCost"] = calculateUpgradeTotalCost(upgradeData[i]["heroID"] - 1, i);
			var heroA = heroData[upgradeData[i]["heroID"] - 1]; 
			var DPSFromHero = DPSGainedHero(upgradeData[i]["heroID"] - 1, upgradeData[i]["level"]);
			switch (upgradeData[i]["type"]) {
				case "upgradeClickPercent":
					var CidClickDamageGain;
					if (heroData[0]["level"] < upgradeData[i]["level"] && heroData[0]["level"] != 0) {
						CidClickDamageGain = heroData[0]["currentClickDamage"] * ((upgradeData[i]["level"] / heroData[0]["level"]) - 1)
					} else if (heroData[0]["level"] < upgradeData[i]["level"]) {
						CidClickDamageGain = upgradeData[i]["level"] * achievementMultiplier * allHeroMultiplier * darkRitualMultiplier;
					} else {
						CidClickDamageGain = 0;
					}
					upgradeData[i]["DPSChange"] = 0.01 * (1 + (ancientData[16]["level"] * 0.2)) * (heroData[0]["currentClickDamage"] + CidClickDamageGain) * Number(upgradeData[i]["upgradeParams"][0]) * clickSpeed * enableClicking;
					break;
				
				case "upgradeGoldFoundPercent": //Assuming DPS and GPS are directly proportional this will work
				case "upgradeHeroPercent": // THIS NEEDS FIXING FOR CLICK STUFF
					var heroDPSIncrease = (0.01 * Number(upgradeData[i]["upgradeParams"][1]) * (heroA["currentDPS"] + DPSFromHero)) + DPSFromHero;
					upgradeData[i]["DPSChange"] = heroDPSIncrease; //Will Change to include Clicks when formula figured out
					break;
					
				case "upgradeEveryonePercent": //THIS NEEDS FIXING FOR CLICK STUFF
					var heroDPSIncrease = (0.01 * Number(upgradeData[i]["upgradeParams"][0]) * (heroDPS + DPSFromHero)) + DPSFromHero; //Simplified Calculation that avoids problems with integer precision
					var clickDPSIncrease = 0; //0.01 * Number(upgradeData[i]["upgradeParams"][0]) * heroData[0]["currentClickDamage"] * (1 + (ancientData[16]["level"] * 0.2));
					var criticalDPSIncrease = 0; //(clickDPSIncrease * criticalClickDamage) / clickDamage;
					upgradeData[i]["DPSChange"] = heroDPSIncrease + (enableClicking * ((!enableCritical * clickDPSIncrease) + (enableCritical * criticalDPSIncrease)));
					break;
					
				case "upgradeCriticalChance":
					upgradeData[i]["DPSChange"] = enableClicking * enableCritical * 0.01 * clickSpeed * (1 - criticalClickMultiplier) * clickDamage * Number(upgradeData[i]["upgradeParams"][0]);
					break;
					
				case "upgradeCriticalDamage":
					upgradeData[i]["DPSChange"] = enableClicking * enableCritical * 0.01 * clickSpeed * criticalClickChance * clickDamage * Number(upgradeData[i]["upgradeParams"][0]);
					break;
					
				case "upgradeClickDpsPercent":
					var clickDPSIncrease = heroDPS * 0.01 * Number(upgradeData[i]["upgradeParams"][0]) * (1 + (ancientData[16]["level"] * 0.2));
					var criticalDPSIncrease = (clickDPSIncrease * criticalClickDamage) / clickDamage
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
}

function purchaseToHeroName(purchase) {
	return heroData[Number(purchase[0].split(",")[2])]["name"];
}

function recalculate() { //Will be called initially to calculate everything and whenever
	calculateGlobalMultipliers();
	calculateHeroData();
	calculateClickingInfo();
	calculateAllEfficiencies();
	updateEfficiencyData();
    
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
        for (i = 0; i < firstSection.length; i++) {
            if (i % 2 == 0) {
                str += firstSection[i];
            }
        }
		if (typeof(JSON.parse(atob(str))) == "object") {
			parsedSaveData =  JSON.parse(atob(str));
		} else {
			window.alert("Invalid Save File (Was not an Object");
			parsedSaveData = {};
		}
    } else {
        window.alert("Invalid Save File (Anti-Cheat String not Found)");   
		parsedSaveData = {};
    }
}

function updateUserSave() { //after decoding a save this will put that decoded info into userSave
	if (parsedSaveData != {}) {
		userSave.heroes = Array();
		for (i = 0; i < heroKeys.length; i++) {
			var heroID = Number(heroData[i]["id"]);
			userSave.heroes[i] = [parsedSaveData.heroCollection.heroes[heroID].level, parsedSaveData.heroCollection.heroes[heroID].epicLevel];
		}
		userSave.achievements = Array();
		var keys = Object.keys(parsedSaveData.achievements);
		for (i = 0; i < achievKeys.length; i++) {
			var achievID = Number(achievData[i]["id"]);
			if (keys.indexOf(achievID.toString()) > -1) {
				userSave.achievements[i] = true;
			} else {
				userSave.achievements[i] = false;
			}
		}
		userSave.upgrades = Array();
		var keys = Object.keys(parsedSaveData.upgrades);
		for (i = 0; i < upgradeKeys.length; i++) {
			var upgradeID = Number(upgradeData[i]["id"]);
			if (keys.indexOf(upgradeID.toString()) > -1) {
				userSave.upgrades[i] = true;
			} else {
				userSave.upgrades[i] = false;
			}
		}
		userSave.ancients = Array();
		var keys = Object.keys(parsedSaveData.ancients.ancients);
		for (i = 0; i < ancientKeys.length; i++) {
			var ancientID = Number(ancientData[i]["id"]);
			if (keys.indexOf(upgradeID.toString()) > -1) {
				userSave.ancients[i] = parsedSaveData.ancients.ancients[ancientID].level;
			} else {
				userSave.ancients[i] = 0;
			}
		}
		userSave.heroSouls = parsedSaveData.heroSouls;
		userSave.allDPSMultiplier = parsedSaveData.allDpsMultiplier;
		userSave.highestZone = parsedSaveData.highestFinishedZonePersist;
		userSave.currentZone = parsedSaveData.highestFinishedZone;
	}
}

function getOptions() {
	enableClicking = document.getElementById("enableClicking").checked;
	//enableCritical = document.getElementById("enableCritical").checked;
	clickSpeed = document.getElementById("clickSpeed").value;
	if (isNaN(clickSpeed)) {
		clickSpeed = 0;
	} else {
		clickSpeed = Number(clickSpeed);
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
	var sign = num && num/Math.abs(num);
	var number = Math.abs(num);
	var SIUnits = ["","","K","M","B","T","q","Q","s","S","O","N","d","D","!","@","#","$","%","^","%","*","[","]","{","}",";","\'",":","\"","<",">","?","/","\\","|","~","`","_","=","-","+"	];
	var digitCount = 	number && Math.floor(1+(Math.log(number)/Math.LN10));
	var digitsShown = 0;
	var symbol = "";
	if (digitCount > 127) {
		symbol = "*";
		digitsShown = digitCount - 122
	} else if (digitCount < 6) {
		digitsShown = digitCount
	} else {
		symbol = SIUnits[Math.floor(digitCount/3)];
		digitsShown = 3 + (digitCount % 3);
	}
	var truncNumber = Math.floor(number/Math.pow(10,digitCount-digitsShown));
	if (sign == 1) {
		return numberWithCommas(truncNumber) + symbol;
	} else if (sign == -1) {
		return "-" + numberWithCommas(truncNumber) + symbol;
	} else {
		return 0;
	}
}

function saveSaveData() { //Will save the data to local storage
	if (typeof(Storage)!="undefined" && Object.keys(userSave).length != 0) {
		localStorage.setItem("save", JSON.stringify(userSave));
	}
}

function purchase(num) {
	var purchase = efficiencyData[num][0].split(",");
	if (purchase[0] == "Hero") {
		heroData[Number(purchase[2])]["level"] = getNextPurchaseLevel(num);
	} else {
		upgradeData[Number(purchase[1])]["owned"] = true;
		var heroID = upgradeData[Number(purchase[1])]["heroID"] - 1;
		if (heroData[heroID]["level"] < upgradeData[Number(purchase[1])]["level"]) {
			heroData[heroID]["level"] = upgradeData[Number(purchase[1])]["level"]
		}
	}
	recalculate();
	updateDOM();
}

function purchaseLevel(num) {
	var purchase = efficiencyData[num][0].split(",");
	if (purchase[0] == "Hero") {
		var heroA = heroData[Number(purchase[2])];
		if (Number(purchase[1]) == 1) {
			return heroData[Number(purchase[2])]["level"] + 1;
		} else if (Number(purchase[1]) == 4) {
			if (heroData[Number(purchase[2])]["level"] < 200) {
				return 200;
			} else {
				return Math.ceil((heroData[Number(purchase[2])]["level"]+1) / 25) * 25;
			}
		} else {
			return Math.ceil((heroData[Number(purchase[2])]["level"] + 1) / 1000) * 1000;
		}
	} else {
		return "N/A";
	}
}

function purchaseNextN(n) {
	for (a = 0; a < n; a++) {
		var purchase = efficiencyData[0][0].split(",");
		if (purchase[0] == "Hero") {
			var heroA = heroData[Number(purchase[2])];
			if (Number(purchase[1]) == 1) {
				heroData[Number(purchase[2])]["level"] += 1;
			} else if (Number(purchase[1]) == 4) {
				if (heroData[Number(purchase[2])]["level"] < 200) {
					heroData[Number(purchase[2])]["level"] = 200;
				} else {
					heroData[Number(purchase[2])]["level"] = Math.ceil((heroData[Number(purchase[2])]["level"]+1) / 25) * 25;
				}
			} else {
				heroData[Number(purchase[2])]["level"] = Math.ceil((heroData[Number(purchase[2])]["level"] + 1) / 1000) * 1000;
			}
		} else {
			upgradeData[Number(purchase[1])]["owned"] = true;
			var heroID = upgradeData[Number(purchase[1])]["heroID"] - 1;
			if (heroData[heroID]["level"] < upgradeData[Number(purchase[1])]["level"]) {
				heroData[heroID]["level"] = upgradeData[Number(purchase[1])]["level"]
			}
		}
		recalculate();
	}
	updateDOM();
}

function getNextPurchaseLevel(num) {
	if (num == 0) {
		var purchaseIsSame = true;
		var initPurchase = efficiencyData[0][0].split(",");
		if (initPurchase[0] == "Upgrade") {
			return "N/A";
		}
		var newLevel = 0;
		var heroLevel = heroData[Number(initPurchase[2])]["level"];
		while (purchaseIsSame) {
			var purchase = efficiencyData[0][0].split(",");
			if (purchase[2] == initPurchase[2]) {
				var heroA = heroData[Number(purchase[2])];
				if (Number(purchase[1]) == 1) {
					heroData[Number(purchase[2])]["level"] += 1;
				} else if (Number(purchase[1]) == 4) {
					if (heroData[Number(purchase[2])]["level"] < 200) {
						heroData[Number(purchase[2])]["level"] = 200;
					} else {
						heroData[Number(purchase[2])]["level"] = Math.ceil((heroData[Number(purchase[2])]["level"]+1) / 25) * 25;
					}
				} else {
					heroData[Number(purchase[2])]["level"] = Math.ceil((heroData[Number(purchase[2])]["level"] + 1) / 1000) * 1000;
				}
				newLevel = heroData[Number(purchase[2])]["level"];
				recalculate();
			} else {
				purchaseIsSame = false;
			}
		}
		heroData[Number(initPurchase[2])]["level"] = heroLevel;
		recalculate();
		return newLevel;
	} else {
		return purchaseLevel(num);
	}
}

function updateEfficiencyTable() {
	var initPos = 0;
	var loopcount = 0;
	var loopflag = true;
	while (loopflag) {
		if (efficiencyData[loopcount][1] == 0) {
			efficiencyData[loopcount][1] = "N/A"
		} else {
			initPos = loopcount;
			loopflag = false;
		}
		loopcount = loopcount + 1;
	}
	for (z = 1; z <= 6; z++) {
		var str = "r" + Math.ceil(z / 2) + "c" + (-1 * (z % 2) + 2).toString();
		if ((-1 * (z % 2) + 2) == 1) {
			if (efficiencyData[Math.ceil(z / 2) + initPos - 1][0].split(",")[0] == "Hero") {
				document.getElementById(str).innerHTML = heroData[Number(efficiencyData[Math.ceil(z / 2) + initPos - 1][0].split(",")[2])]["name"]; // + " " + efficiencyData[Math.ceil(i / 2) + initPos - 1][0].split(",")[1] + "x Multiplier";
			} else {
				document.getElementById(str).innerHTML = upgradeData[efficiencyData[Math.ceil(z / 2) + initPos - 1][0].split(",")[1]]["name"];
			}
		} else {
			document.getElementById(str).innerHTML = getNextPurchaseLevel(Math.ceil(z / 2) + initPos - 1); //formatNumber(Number(efficiencyData[Math.ceil(i / 2) + initPos - 1][1]));
		}
	}
}

function graph(){
	google.load('visualization', '1.0', {
		packages: ['corechart'],
		callback: function drawChart() {
			var data = new google.visualization.arrayToDataTable([
				["Hero","DPS"],
				["Cid", heroData[0]["currentClickDamage"] * clickSpeed],
				["Treebeast",heroData[1]["currentDPS"]],
				["Ivan",heroData[2]["currentDPS"]],
				["Brittany",heroData[3]["currentDPS"]],
				["The Wandering Fisherman",heroData[4]["currentDPS"]],
				["Betty",heroData[5]["currentDPS"]],
				["The Masked Samurai",heroData[6]["currentDPS"]],
				["Leon",heroData[7]["currentDPS"]],
				["The Great Forest Seer",heroData[8]["currentDPS"]],
				["Alexa",heroData[9]["currentDPS"]],
				["Natalia",heroData[10]["currentDPS"]],
				["Mercedes",heroData[11]["currentDPS"]],
				["Bobby",heroData[12]["currentDPS"]],
				["Broyle",heroData[13]["currentDPS"]],
				["Sir George II",heroData[14]["currentDPS"]],
				["King Midas",heroData[15]["currentDPS"]],
				["Referi Jerator",heroData[16]["currentDPS"]],
				["Abbadon",heroData[17]["currentDPS"]],
				["Ma Zhu",heroData[18]["currentDPS"]],
				["Amenhoep",heroData[19]["currentDPS"]],
				["Beastlord",heroData[20]["currentDPS"]],
				["Athena",heroData[21]["currentDPS"]],
				["Aphrodite",heroData[22]["currentDPS"]],
				["Shinatobe",heroData[23]["currentDPS"]],
				["Grant",heroData[24]["currentDPS"]],
				["Frostleaf",heroData[25]["currentDPS"]]
				]);
			var options = {
				title: 'Pie Chart of Hero DPS',
				backgroundColor: '#E3DAC9',
				chartArea:{left:10,top:20,width:'100%',height:'100%'}
			};
			var chart = new google.visualization.PieChart(document.getElementById('piechart'));
			chart.draw(data, options);
		}
    })  
}

function updateDOM() { //Will put calculated elements onto their respective DOM elements
	updateEfficiencyTable();
	graph();
}

function addEventListeners() { //Everything that requires waiting for user input goes here
	document.getElementById("updateSaveData").onclick = updateAll;
	document.getElementById("saveAll").onclick = saveSaveData;
	document.getElementById("updateValues").onclick = updateValues;
}

function debugLogger() {
	//console.log(heroData);
	//console.log(achievData);
	//console.log(upgradeData);
	//console.log(ancientData);
	//console.log(efficiencyData);
	//console.log(parsedSaveData);
	//console.log(chdata);
}

function postInit() { //PostInit Phase
	updateDOM();
	addEventListeners();
	debugLogger();
}

postInit();