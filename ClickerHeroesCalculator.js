//This was made by VikeStep and stennett

/*
TODO:
- Convert large numbers to run off Base64 Maths
- Factor in clicking speed to calculations
- Factor in desired Hero Souls to calculations
- Add in Save Data handling
- Add in Efficiencies for Upgrades, Achievements and possibly Ancients
- Add in Ancient Info
- Add in Zone information to find Gold per Second when Idle
- Add in Max DPS using Skills
- Timer that recalculates every specified time (config)
- Option to use scientific notation for numbering
- Update CSS and HTML
*/

//Initialising Global Variables
var saveData = ""; //Encoded Save Data
var parsedSaveData = Array(); //Decoded Save Data
var userSave; //Holds all current info - can possibly request off people for debugging purposes
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

var totalDPS = 0;
var clickDamage = 0;
var heroSouls = 0;
var currentZone = 0;
var ascensionCount = 0;
var givenDPS = 0;
var heroSoulsFromAscension = 0;
var desiredHeroSouls = 0;
var highestZoneReached = 0;
var argaivLevel = 0;
var dogcogLevel = 0;
var mostEfficientPurchase = "";

var darkRitualsCalculated = false;
var darkRitualsUsed = 0;
var energizedDarkRitualsUsed = 0;
var achievementMultiplier = 1;
var darkRitualMultiplier = 1;
var allHeroMultiplier = 1;
var heroSoulsMultiplier = 1;

//Functions for PreInit Phase - Loading all the data from local storage
function loadLocalStorage() { //Will grab the data from local storage
	if (typeof(Storage) != "undefined") {
		localStorageSave = localStorage.getItem("save");
		if (localStorageSave != null) {
			userSave = JSON.parse(localStorageSaveString);
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
		return Math.floor(heroData[heroID]["baseCost"] * Math.pow(1.07, level) * (1 - (dogcogLevel * 0.02)));
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
		heroData[i]["upgrades"] = Array();
	}
	//Upgrade Data
	for (i = 0; i < upgradeKeys.length; i++) {
		//Static Data
		upgradeData[i] = Array();
		var impUpgradeData = impUpg[upgradeKeys[i]];
		upgradeData[i]["ID"] = impUpgradeData.id;
		upgradeData[i]["heroID"] = impUpgradeData.heroId;
		upgradeData[i]["name"] = impUpgradeData.name;
		upgradeData[i]["level"] = impUpgradeData.heroLevelRequired;
		upgradeData[i]["type"] = impUpgradeData.upgradeFunction;
		upgradeData[i]["upgradeParams"] = splitParams(impUpgradeData.upgradeParams);
		upgradeData[i]["cost"] = calculateUpgradeCost(upgradeData[i]["level"],upgradeData[i]["heroID"])
		heroData[upgradeData[i]["heroID"]-1]["upgrades"].push(i);
		//Dynamic Data
		upgradeData[i]["owned"] = false;
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

function fillInData() { //Puts data from exported save data into the 4 arrays
	if (parsedSaveData != null) {
		//Put in all the levels of heroes and ancients and whether each upgrade or achievement has been acquired
	}
}

function calculateDarkRitualInfo() { //Will reverse engineer to find the amount of dark rituals used comparing save data to calculated data
	if (givenDPS != 0) {
		var unknownMult = givenDPS / totalDPS;
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

function calculateGlobalMultipliers() { //Calculates global multipliers that cover all heroes. These come from achievements, upgrades, hero souls and dark rituals
	achievementMultiplier = 1;
	for (i=0; i < achievKeys.length; i++) {
		if (achievData[i]["type"] == "addDPS" && achievData[i]["owned"] == true) {
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
			if (multiCount >= 1000) {
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
		totalDPS = 0;
		for (i = 0; i < heroKeys.length; i++) {
			heroData[i]["currentDPS"] = heroData[i]["level"] * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * heroData[i]["levelMultiplier"] * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * argaivLevel))));
			for (j = 0; j < heroData[i]["upgrades"].length; j++) {
				var upgradeDetails = upgradeData[heroData[i]["upgrades"][j]];
				if (upgradeDetails["type"] == "upgradeHeroPercent" && upgradeDetails["owned"] == true) {
					heroData[i]["currentDPS"] = heroData[i]["currentDPS"] * (1 + (upgradeDetails["upgradeParams"][1] / 100));
				}
			}
			totalDPS = totalDPS + heroData[i]["currentDPS"];
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
	if (totalDPS == 0) {
		totalDPS = 1;
	}
}

function calculateEfficiency(cost, change) {
	if (change != 0) {
		return (1.15 * (cost / totalDPS)) + (cost / change);
	} else {
		return 0;
	}
}

function updateEfficiencyData() {
	var smallest = ["NOTHING",0];
	for (i = 0; i < heroKeys.length; i++) {
		efficiencyData.push(["Hero,1," + i, heroData[i]["efficiency1"]]);
		efficiencyData.push(["Hero,4," + i, heroData[i]["efficiency4x"]]);
		efficiencyData.push(["Hero,10," + i, heroData[i]["efficiency10x"]]);
	}
	for (i = 0; i < Object.keys(efficiencyData).length; i++) {
		if (efficiencyData[i][1] != 0 && smallest[1] == 0) {
			smallest = efficiencyData[i];
		} else if (efficiencyData[i][1] < smallest[1] && efficiencyData[i][1] != 0) {
			smallest = efficiencyData[i];
		}
	}
	mostEfficientPurchase = smallest;
}

function calculateAllEfficiencies() {
	//Heroes
	for (i = 0; i < heroKeys.length; i++) {
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
			var next4xlevel = Math.ceil(heroData[i]["level"]+1 / 25) * 25;
			cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
			var other10xbonus = 0;
			if (next4xlevel % 1000 == 0) {
				next4xlevel = next4xlevel + 25;
				cost4xMult = calculateCostUpToLevel(i, heroData[i]["level"], next4xlevel);
				other10xbonus = 1;
			}
			DPS4xChange = (Math.pow(10, other10xbonus) * 4 * (heroData[i]["currentDPS"] * (next4xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
			var next10xlevel = Math.ceil(heroData[i]["level"]+1 / 1000) * 1000;
			cost10xMult = calculateCostUpToLevel(i, heroData[i]["level"], next10xlevel);
			var other4xbonus = Math.floor((next10xlevel - (heroData[i]["level"]+1)) / 25);
			DPS10xChange = (Math.pow(4, other4xbonus) * 10 * (heroData[i]["currentDPS"] * (next10xlevel / heroData[i]["level"]))) - heroData[i]["currentDPS"];
		} else {
			cost4xMult = calculateCostUpToLevel(i, 0, 200);
			cost10xMult = calculateCostUpToLevel(i, 0, 1000);
			DPS4xChange = 200 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 4 * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * argaivLevel))));
			DPS10xChange = 1000 * heroData[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * 10 * Math.pow(4, 32) * (1 + (heroData[i]["gilded"] * (0.5 + (0.02 * argaivLevel))));
		}
		heroData[i]["efficiency4x"] = calculateEfficiency(cost4xMult, DPS4xChange);
		heroData[i]["efficiency10x"] = calculateEfficiency(cost10xMult, DPS10xChange);
	}
}

function recalculate() { //Will be called initially to calculate everything and whenever
	calculateGlobalMultipliers();
	calculateHeroData();
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
function parseSave(data) { //Will decode the exported save data
	//parsedSaveData = 
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
	if (typeof(Storage)!="undefined" && parsedSaveData != null) {
		localStorage.setItem("save", parsedSaveData);
	}
}

function updateDOM() { //Will put calculated elements onto their respective DOM elements
	
}

function addEventListeners() { //Everything that requires waiting for user input goes here
	
}

function debugLogger() {
	console.log(heroData);
	//console.log(achievData);
	//console.log(upgradeData);
	//console.log(ancientData);
	//console.log(efficiencyData);
	//console.log(chdata);
}


function postInit() { //PostInit Phase
	updateDOM();
	addEventListeners();
	debugLogger();
}

postInit();