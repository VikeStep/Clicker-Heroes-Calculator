//This was made by VikeStep and stennett

//Initialising Global Variables
var savedata = ""; 												//This savedata will be in the same format as the export from Clicker Heroes itself
var parsedsavedata = Array();								//Associative Array of the essential data from the imported save data

var herodata = Array();										//The data for all heroes will be an array of associated arrays (so herodata[0]["name"] will return "Cid, the Helpful Adventurer")
var heronames = ["Cid, the Helpful Adventurer", "Treebeast", "Ivan, the Drunken Brawler", "Brittany, Beach Princess", "The Wandering Fisherman", "Betty Clicker", "The Masked Samurai", "Leon", "The Great Forest Seer", "Alexa, Assassin", "Natalia, Ice Apprentice", "Mercedes, Duchess of Blades", "Bobby, Bounty Hunter", "Broyle Lindeoven, Fire Mage", "Sir George II, King's Guard", "King Midas", "Referi Jerator, Ice Wizard", "Abbadon", "Ma Zhu", "Amenhotep", "Beastlord", "Athena, Goddess of War", "Aphrodite, Goddess of Love", "Shinatobe, Wind Deity", "Grant, the General", "Frostleaf"]; //List of Hero Names
var basecosts = [5e0,5e1,2.5e2,1e3,4e3,2e4,1e5,4e5,2.5e6,1.5e7,1e8,8e8,6.5e9,5e10,4.5e11,4e12,3.6e13,3.2e14,2.7e15,2.4e16,3e17,9e18,3.5e20,1.4e22,4.2e24,2.1e27]; //Base Cost for each Hero
var upgradenames = [["Big Clicks", "Clickstorm", "Huge Clicks", "Massive Clicks", "Titanic Clicks", "Colossal Clicks", "Monumental Clicks"],["Fertilizer", "Thorns", "Megastick", "Ultrastick", "Lacquer"],["Hard Cider", "Pint of Ale", "Pitcher", "Powersurge", "Embalming Fluid", "Pint of Pig's Whiskey"],["Combat Makeup", "Brand Name Equipment", "Eliixir of Deditzification", "Vegan Meat"],["Spear Training", "Crab Net", "Whetstone", "Fish Cooking", "State of the Art Fishing Gear"],["Wilderburr Dumplings", "Braised Flamingogo", "Truffed Trolgre with Bloop", "Foomgus Risotto", "World Famous Cookbook"],["Jutsu I", "Jutsu II", "Jutsu III", "Jutsu IV"],["Courage Tonic", "Stronger Claws", "Lionheart Potion", "Lion's Roar"],["Forest Creatures", "Insight", "Dark Lore", "Swarm"],["Critical Strike", "Clairvoyance", "Poisoned Blades", "Invisible Strikes", "Lucky Strikes"],["Magic 101", "Below Zero", "Frozen Warfare", "The Book of Frost"],["Mithril Edge", "Enchanted Blade", "Quickblade", "Blessed Sword", "Art of Swordfighting"],["Impressive Moves", "Acrobatic Jetpack", "Jetpack Dance", "Whirling Skyblade", "Sweeping Strikes"],["Roast Monsters", "Combustible Air", "Inner Fire", "The Floor is Lava", "Metal Detector"],["Abandoned Regret", "Offensive Strategies", "Combat Strategy", "Burning Blade", "King's Pardon"],["Bag of Holding", "Heart of Gold", "Touch of Gold", "Golden Dimension", "Golden Clicks", "Gold Blade"],["Defrosting", "Headbashing", "Iceberg Rain", "Glacierstorm", "Icy Touch"],["Rise of the Dead", "Curse of the Dark God", "Epidemic Evil", "The Dark Ritual"],["Heaven's Hand", "Plasma Arc", "Ancient Wrath", "Pet Dragon"],["Smite", "Genesis Research", "Prepare the Rebeginning", "ASCENSION"],["Eye In The Sky", "Critters", "Beastmode", "Sacrificial Lamb's Blood", "Super Clicks"],["Hand-to-Head Combat", "Warscream", "Bloodlust", "Boiling Blood"],["Lasso of Love", "Love Potion", "Love Hurts", "Energize", "Kiss of Death"],["Dancing Blades", "Annoying Winds", "Bladestorm", "Eye of the Storm", "Reload"],["Red Whip", "Art of War", "Battle Plan", "Top of the Line Gear"],["Ice Age", "Book of Winter", "Frozen Stare", "Frigid Enchant"]]; //List of Upgrade Names
var upgradetypes = [[1,2,1,1,1,1,1],[0,0,0,0,3],[0,0,0,2,3,0],[0,0,0,0],[0,0,0,4,3],[4,4,4,4,3],[0,0,0,0],[0,0,0,4],[0,0,0,0],[5,0,0,6,2],[0,0,0,0],[0,0,0,0,3],[0,0,0,0,5],[4,0,0,0,2],[0,0,0,0,3],[7,7,7,7,2,5],[0,0,0,0,6],[0,0,0,2],[0,0,0,0],[0,4,4,8],[0,0,0,4,2],[0,0,0,0],[0,0,0,2,0],[0,4,0,0,2],[4,0,4,0],[0,0,4,3]]; //0 - Increases Individual Heroes DPS, 1 - Increases Cid's Click Damage, 2 - Unlocks Skill, 3 - Increases Click Damage, 4 - Increase All Heroes DPS, 5 - Increases Critical Click Chance, 6 - Increases Critical Click Damage Multiplier, 7 - Increases Gold Found, 8 - Ascension
var upgradevalues = [[100,1,100,100,150,200,250],[100,100,100,150,0.5],[100,100,100,1,0.5,150],[100,100,100,150],[100,100,100,25,0.5],[20,20,20,20,0.5],[100,100,100,150],[100,100,100,25],[100,100,100,150],[3,125,125,5,1],[100,100,100,150],[100,100,100,150,0.5],[100,100,100,150,3],[25,100,100,150,1],[100,100,100,150,0.5],[25,25,25,50,1,3],[100,100,100,150,3],[125,125,125,1],[100,100,100,150],[100,20,20,1],[100,100,100,10,1],[100,100,100,100],[100,100,100,1,100],[100,10,100,100,1],[25,100,25,100],[100,100,25,0.5]]; //The effect of each upgrade in terms of numbers
var upgradecosts = [[1e2,2.5e2,1e3,8e3,8e4,4e5,4e6],[5e2,1.25e3,5e3,4e4,4e5],[2.5e3,6.25e3,2.5e4,2e5,2e6,1e7],[1e4,2.5e4,1e5,8e5],[4e4,1e5,4e5,3.2e6,3.2e7],[2e5,5e5,2e6,1.6e6,1.6e7],[1e6,2.5e6,1e7,8e7],[4e6,1e7,4e7,3.2e8],[2.5e7,6.25e7,2.5e8,2e9],[1.5e8,3.75e8,1.5e9,1.2e10,1.2e11],[1e9,2.5e9,1e10,8e10],[8e9,2e10,8e10,6.4e11,6.4e12],[6.5e10,1.62e11,6.5e11,5.2e12,5.2e13],[5e11,1.25e12,5e12,4e13,4e14],[4.5e12,1.125e13,4.5e13,3.6e14,3.6e15],[4e13,1e14,4e14,3.2e15,3.2e16,1.6e17],[3.6e14,9e14,3.6e15,2.88e16,2.88e17],[3.2e15,8e15,3.2e16,2.56e17],[2.7e16,6.75e16,2.7e17,2.16e18],[2.4e17,6e17,2.4e18,1.92e19],[3e18,7.5e18,3e19,2.4e20,2.4e21],[9e19,2.25e20,9e20,7.2e21],[3.5e21,8.75e21,3.5e22,2.8e24,2.8e23],[1.4e23,3.5e23,1.4e24,1.12e25,1.12e26],[4.2e25,1.04e26,4.19e26,3.359e27],[2.1e28,5.25e28,2.1e29,1.68e30]]; //Cost for each upgrade
var upgradelevels = [[10,25,50,75,100,125,150],[10,25,50,75,100],[10,25,50,75,100,125],[10,25,50,75],[10,25,50,75,100],[10,25,50,75,100],[10,25,50,75],[10,25,50,75],[10,25,50,75],[10,25,50,75,100],[10,25,50,75],[10,25,50,75,100],[10,25,50,75,100],[10,25,50,75,100],[10,25,50,75,100],[10,25,50,75,100,125],[10,25,50,75,125],[10,25,50,75],[10,25,50,75],[10,25,50,150],[10,25,50,75,100],[10,25,50,100],[10,25,50,75,100],[10,25,50,75,100],[10,25,50,75],[10,25,50,75]]; //Levels at which you obtain each upgrade
	
var achievementdata = Array();								//The data for all achievements in an associated array
var achievementnames = ["Frugal", "Stingy", "Miserly", "Greedy", "Zone Explorer", "Zone Warrior", "Zone Master", "Zone Lord", "Zone King", "Zone God", "Zone Owner", "Bounty: Omeet", "Bounty: The Green One", "Bounty: Woodchip, the Rodent", "Bounty: Queen of Bloops", "Bounty: Doppler, the Robot", "Bounty: Rashon, the Duke", "Bounty: The Dark Wizard", "Bounty: Tako, Head of the Octopi", "Bounty: Tako Returns", "Bounty: Lagomorph of Caerbannog", "Lethal", "Ruinous", "Calamitious", "Cataclysmic", "A lot of Damage", "Frantic", "Frenetic", "Frenzied", "Convulsions", "Deadly", "Assassin", "Restarter", "Neverending", "Again and Again", "Is this real life?", "Master of Reincarnations", "Boss Slaughter", "Boss Massacre", "Boss Exterminator", "Boss Murderer", "Boss Genocide", "Proficient Clicking", "Sore Finger", "Carpal Tunnel", "Broken Mouse", "Uptown", "Fat Cat", "Loaded", "The 1%", "The 0.01%", "Buffett", "Gates", "Rockefeller", "Guide", "Coach", "Teacher", "Mentor", "Levelupper", "Super Levelupper", "Killer", "Butcher", "Executioner", "Monster Genocide", "Terminator", "Considerate", "Generous", "Benevolent", "Magnanimous", "Treasure Hunter"]; //List of Achievement Names
var achievementtypes = [0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; //0 - Adds DPS, 1 - Click Damage, 2 - Starting Click Damage, 3 - Hero Soul
var achievementrewards = [1, 2, 3, 5, 1, 2, 3, 5, 5, 5, 5, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 2, 3, 5, 5, 1, 3, 3, 5, 3, 5, 10, 50, 250, 1000, 2500, 1, 2, 3, 5, 5, 1, 2, 3, 5, 1, 2, 3, 5, 5, 5, 5, 5, 1, 2, 3, 5, 5, 5, 1, 2, 3, 5, 5, 1, 2, 3, 5, 5]; //Rewards for Achievement

var totalDPS = 0;
var givenDPS = 0;
var clickDamage = 0;
var heroSouls = 0;
var heroSoulsFromAscension = 0;
var desiredHeroSouls = 0;
var ascensionCount = 0;
var darkRitualsCalculated = false;
var darkRitualsUsed = 0;
var energizedDarkRitualsUsed = 0;
var currentZone = 0;
var highestZoneReached = 0;
var achievementMultiplier = 1;
var darkRitualMultiplier = 1;
var allHeroMultiplier = 1;
var heroSoulsMultiplier = 1;
var argaivLevel = 0;

//Functions for PreInit Phase - Loading all the data from local storage and parsing it
function loadLocalStorage() {								//Will grab the data from local storage
	if (typeof(Storage)!="undefined") {
		savedata = localStorage.getItem("savedata");
	}
}

function parseSave(data) {									//Will convert the savedata into something more readable
	//parsedsavedata = 
}

function preInit() {												//PreInit Phase
	loadLocalStorage();
	//parseSave(savedata);
}

preInit();

//Functions For Init Phase - Assigning loaded data to variables, Calculating values for variables
function logBase(b, n) {
	return Math.log(n) / Math.log(b);
}

function calculateDarkRitualInfo() {
	var unknownMult = givenDPS / totalDPS;
	var maxa = Math.floor(logBase(1.05, unknownMult));
	var maxb = Math.floor(logBase(1.1, unknownMult));
	var closest = [0, 0, 1, unknownMult];
	for (i = 0; i < maxa; i++) {
		for (j = 0; j < maxb; j++) {
			var mult = Math.pow(1.05,i) * Math.pow(1.1, j);
			if (Math.abs(mult - unknownMult) < closest[3]) {
				closest[0] = i;
				closest[1] = j;
				closest[2] = mult;
				closest[3] = Math.abs(mult - unknownMult);
			}
		}
	}
	darkRitualsUsed = closest[0];
	energizedDarkRitualsUsed = closest[1];
	darkRitualMultiplier = Math.pow(1.05,darkRitualsUsed) * Math.pow(1.1,energizedDarkRitualsUsed);
	darkRitualsCalculated = true;
}

function calculateBaseDPS(cost, id) {						//The base DPS for a hero is calculated by a formula of the cost and its ID. ID for Cid is 1, ID for Treebeast is 2 and so on.
	return Math.ceil((cost/10)*Math.pow(1-(0.0188*Math.min(id,14)),id));
}

function calculateGlobalMultipliers() {
	achievementMultiplier = 1;
	for (i=0; i < achievementdata.length; i++) {
		if (achievementdata[i]["type"] == 0 && achievementdata[i]["owned"] == true) {
			achievementMultiplier = achievementMultiplier * (1+(achievementdata[i]["reward"]/100));
		}
	}
	allHeroMultiplier = 1;
	for (i=0; i < herodata.length; i++) {
		for (j = 0; j < herodata[i]["upgradedata"].length; j++) {
			if (herodata[i]["upgradedata"][j]["type"] == 4 && herodata[i]["upgradedata"][j]["owned"] == true) {
				allHeroMultiplier = allHeroMultiplier * (1+(herodata[i]["upgradedata"][j]["value"]/100));
			}
		}
	}
	heroSoulsMultiplier = 1 + (heroSouls/10);
	darkRitualMultiplier = Math.pow(1.05,darkRitualsUsed) * Math.pow(1.1,energizedDarkRitualsUsed);
}

function calculateHeroData() {
	var loopflag = true;
	while (loopflag) {
		totalDPS = 0;
		for (i=0; i < herodata.length; i++) {
			if (herodata[i]["level"] >= 200) {
				var thousandCount = 0;
				var multiCount = Math.floor(1+((herodata[i]["level"]-200)/25));
				if (multiCount >= 1000) {
					thousandCount = Math.floor(herodata[i]["level"]/1000);
				}
				herodata[i]["levelmultiplier"] = Math.pow(4,multiCount-thousandCount) * Math.pow(10,thousandCount);
			}
			herodata[i]["currentDPS"] = herodata[i]["level"] * herodata[i]["baseDPS"] * achievementMultiplier * darkRitualMultiplier * allHeroMultiplier * heroSoulsMultiplier * herodata[i]["levelmultiplier"] * (1 + (herodata[i]["gilded"] * (0.5 + (0.02 * argaivLevel))));
			for (j = 0; j < herodata[i]["upgradedata"].length; j++) {
				if (herodata[i]["upgradedata"][j]["type"] == 0 && herodata[i]["upgradedata"][j]["owned"] == true) {
					herodata[i]["currentDPS"] = herodata[i]["currentDPS"] * (1+(herodata[i]["upgradedata"][j]["value"]/100));
				}
			}
			totalDPS = totalDPS + herodata[i]["currentDPS"];
		}
		if (darkRitualsCalculated == false) {
			calculateDarkRitualInfo();
		} else {
			loopflag = false;
		}
	}
}

function calculateAll() {										//Will be called initially to calculate everything and whenever
	calculateGlobalMultipliers();
	calculateHeroData();
}

function init() {													//Init Phase
	for (i=0; i < 26; i++) {										//Fills herodata with known values
		herodata[i] = Array();
		herodata[i]["name"] = heronames[i];
		herodata[i]["basecost"] = basecosts[i];
		if (i != 0) {													//Calculates base DPS
			herodata[i]["baseDPS"] = calculateBaseDPS(basecosts[i], i+1);
		} else {
			herodata[i]["baseDPS"] = 0;
		}
		herodata[i]["owned"] = false;
		herodata[i]["level"] = 0;
		herodata[i]["currentDPS"] = 0;
		herodata[i]["nextcost"] = 0;
		herodata[i]["DPSchange"] = 0;
		herodata[i]["gilded"] = 0;
		herodata[i]["levelmultiplier"] = 1;
		herodata[i]["upgradedata"] = Array();
		var upgradecount = upgradetypes[i].length;
		for (j=0; j < upgradecount; j++) {					//Initialises Hero Upgrade Data
			herodata[i]["upgradedata"][j] = Array();
			herodata[i]["upgradedata"][j]["name"] = upgradenames[i][j];
			herodata[i]["upgradedata"][j]["type"] = upgradetypes[i][j];
			herodata[i]["upgradedata"][j]["value"] = upgradevalues[i][j];
			herodata[i]["upgradedata"][j]["cost"] = upgradecosts[i][j];
			herodata[i]["upgradedata"][j]["level"] = upgradelevels[i][j];
			herodata[i]["upgradedata"][j]["owned"] = false;
		}
	}
	for (i=0; i < achievementtypes.length; i++) {
		achievementdata[i] = Array();
		achievementdata[i]["name"] = achievementnames[i];
		achievementdata[i]["type"] = achievementtypes[i];
		achievementdata[i]["reward"] = achievementrewards[i];
		achievementdata[i]["owned"] = false; 			//Change this to actual value of imported save data when data parser is made
	}
	calculateAll();
	console.log(herodata); 										//For Debugging purposes
	console.log(achievementdata);							//For Debugging purposes
}

init();

//Functions for PostInit Phase - Updating DOM elements, Adding Event Listeners
function numberWithCommas(number) {					//Converts 1234567 into 1,234,567. Also is compatible with decimals: 1234567.8910 -> 1,234,567.8910
    var parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function formatNumber(num) {								//Converts a number into what is shown InGame
	var sign = num && num/Math.abs(num);
	var number = Math.abs(num);
	var SIunits = ["","","K","M","B","T","q","Q","s","S","O","N","d","D","!","@","#","$","%","^","%","*","[","]","{","}",";","\'",":","\"","<",">","?","/","\\","|","~","`","_","=","-","+"	];
	var digitcount = 	number && Math.floor(1+(Math.log(number)/Math.LN10));
	var digitsshown = 0;
	var symbol = "";
	if (digitcount > 127) {
		symbol = "*";
		digitsshown = digitcount - 122
	} else if (digitcount < 6) {
		digitsshown = digitcount
	} else {
		symbol = SIunits[Math.floor(digitcount/3)];
		digitsshown = 3 + (digitcount % 3);
	}
	var truncNumber = Math.floor(number/Math.pow(10,digitcount-digitsshown));
	if (sign == 1) {
		return numberWithCommas(truncNumber) + symbol;
	} else if (sign == -1) {
		return "-" + numberWithCommas(truncNumber) + symbol;
	} else {
		return 0;
	}
}

function saveSaveData() {									//Will save the data to local storage
	if (typeof(Storage)!="undefined" && saveData != null) {
		localStorage.setItem("saveData", parsedsaveData);
	}
}

function updateDOM() {										//Will put calculated elements onto their respective DOM elements
	
}

function addEventListeners() {								//Everything that requires waiting for user input goes here
	
}

function postInit() {											//PostInit Phase
	updateDOM();
	addEventListeners();
}

postInit();