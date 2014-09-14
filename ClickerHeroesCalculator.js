//This was made by VikeStep and stennett

//Initialising Global Variables
var saveData = ""; 												//This savedata will be in the same format as the export from Clicker Heroes itself
var parsedSaveData = Array();								//Associative Array of the essential data from the imported save data
var incrementalScore = 0;										//Score for Incremental
var herodata = Array();										//The data for all heroes will be an array of associated arrays (so herodata[0]["name"] will return "Cid, the Helpful Adventurer")
var namearray = ["Cid, the Helpful Adventurer", "Treebeast", "Ivan, the Drunken Brawler", "Brittany, Beach Princess", "The Wandering Fisherman", "Betty Clicker", "The Masked Samurai", "Leon", "The Great Forest Seer", "Alexa, Assassin", "Natalia, Ice Apprentice", "Mercedes, Duchess of Blades", "Bobby, Bounty Hunter", "Broyle Lindeoven, Fire Mage", "Sir George II, King's Guard", "King Midas", "Referi Jerator, Ice Wizard", "Abbadon", "Ma Zhu", "Amenhotep", "Beastlord", "Athena, Goddess of War", "Aphrodite, Goddess of Love", "Shinatobe, Wind Deity", "Grant, the General", "Frostleaf"]; 					//List of Hero Names
var basecostarray = [5e0,5e1,2.5e2,1e3,4e3,2e4,1e5,4e5,2.5e6,1.5e7,1e8,8e8,6.5e9,5e10,4.5e11,4e12,3.6e13,3.2e14,2.7e15,2.4e16,3e17,9e18,3.5e20,1.4e22,4.2e24,2.1e27]; //Base Cost for each Hero

//Functions for PreInit Phase - Loading all the data from local storage and parsing it
function loadLocalStorage() {								//Will grab the data from local storage
	if (typeof(Storage)!="undefined") {
		saveData = localStorage.getItem("saveData");
		incrementalScore = localStorage.getItem("incrementalScore");
	}
}

function parseSave(data) {									//Will convert the savedata into something more readable
	//parsedSaveData = 
}

function preInit() {												//PreInit Phase
	loadLocalStorage();
	//parseSave(saveData);
}

preInit();

//Functions For Init Phase - Assigning loaded data to variables, Calculating values for variables
function calculateBaseDPS(cost, id) {						//The base DPS for a hero is calculated by a formula of the cost and its ID. ID for Cid is 1, ID for Treebeast is 2 and so on.
	return Math.ceil((cost/10)*Math.pow(1-(0.0188*Math.min(id,14)),id));
}

function init() {													//Init Phase
	for (i=0; i < 26; i++) {										//Fills herodata with known values
		herodata[i] = Array();
		herodata[i]["name"] = namearray[i];
		herodata[i]["baseCost"] = basecostarray[i];
		if (i != 0) {
			herodata[i]["baseDPS"] = calculateBaseDPS(basecostarray[i], i+1)
		} else {
			herodata[i]["baseDPS"] = 0
		}
	}
	console.log(herodata); 											//For Debugging purposes
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
	var SISymbols = ["","","K","M","B","T","q","Q","s","S","O","N","d","D","!","@","#","$","%","^","%","*"];
	var digitCount = 	number && Math.floor(1+(Math.log(number)/Math.LN10));
	if (digitCount > 64) {
		var symbol = "*";
		var digitsShown = digitCount - 59
	} else if (digitCount < 6) {
		symbol = "";
		digitsShown = digitCount
	} else {
		var symbol = SISymbols[Math.floor(digitCount/3)];
		var digitsShown = 3 + (digitCount % 3);
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

function saveSaveData() {									//Will save the data to local storage
	if (typeof(Storage)!="undefined" && saveData != null) {
		localStorage.setItem("saveData", saveData);
	}
}

function saveIncrementalGame() {							//Will save the incremental game score
	if (typeof(Storage)!="undefined") {
		localStorage.setItem("incrementalScore", incrementalScore);
	}
}

function incrementalGame() {								//Temporary Incremental Game Incrementer
	document.getElementById("counter").innerHTML = parseInt(document.getElementById("counter").innerHTML) + 1;
	incrementalScore = document.getElementById("counter").innerHTML;
	saveIncrementalGame();
}

function updateDOM() {										//Will put calculated elements onto their respective DOM elements
	if (incrementalScore != null) {
		document.getElementById("counter").innerHTML = incrementalScore;
	} else {
		document.getElementById("counter").innerHTML = 0;
	}
}

function addEventListeners() {								//Everything that requires waiting for user input goes here
	document.getElementById("counterbtn").onclick = incrementalGame; // End of Incremental Game Code
}

function postInit() {											//PostInit Phase
	updateDOM();
	addEventListeners();
}

postInit();