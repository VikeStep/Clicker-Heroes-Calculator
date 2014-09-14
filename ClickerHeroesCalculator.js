//This savedata will be in the same format as the export from Clicker Heroes itself
var savedata = "";
//The data for all heroes will be an array of associated arrays (so herodata[0]["name"] will return "Cid, the Helpful Adventurer")
var herodata = {};
//Some data to fill the known values. Scientific notation is used where possible and reasonable
var namearray = ["Cid, the Helpful Adventurer", "Treebeast", "Ivan, the Drunken Brawler", "Brittany, Beach Princess", "The Wandering Fisherman", "Betty Clicker", "The Masked Samurai", "Leon", "The Great Forest Seer", "Alexa, Assassin", "Natalia, Ice Apprentice", "Mercedes, Duchess of Blades", "Bobby, Bounty Hunter", "Broyle Lindeoven, Fire Mage", "Sir George II, King's Guard", "King Midas", "Referi Jerator, Ice Wizard", "Abbadon", "Ma Zhu", "Amenhotep", "Beastlord", "Athena, Goddess of War", "Aphrodite, Goddess of Love", "Shinatobe, Wind Deity", "Grant, the General", "Frostleaf"];
var basecostarray = [5e0,5e1,2.5e2,1e3,4e3,2e4,1e5,4e5,2.5e6,1.5e7,1e8,8e8,6.5e9,5e10,4.5e11,4e12,3.6e13,3.2e14,2.7e15,2.4e16,3e17,9e18,3.5e20,1.4e22,4.2e24,2.1e27];

//Will grab the data from local storage
function loadLocalStorage() {
	if (typeof(Storage)!="undefined") {
		savedata = localStorage.getItem("savedata");
	}
}

//Will save the data to local storage
function saveSaveData(data) {
	if (typeof(Storage)!="undefined") {
		localStorage.setItem("savedata", data);
	}
}

//Will convert the savedata into something more readable
function parseSave(data) {
	//Stuff Here
}

//The base DPS for a hero is calculated by a formula of the cost and its ID. ID for Cid is 1, ID for Treebeast is 2 and so on.
function calculateBaseDPS(cost, id) {
	return Math.ceil((cost/10)*Math.pow(1-(0.0188*Math.min(id,14)),id));
}

//Fills herodata with known values
for (i=0; i < 26; i++) {
	herodata[i] = Array();
	herodata[i]["name"] = namearray[i];
	herodata[i]["baseCost"] = basecostarray[i];
	if (i != 0) {
		herodata[i]["baseDPS"] = calculateBaseDPS(basecostarray[i], i+1)
	} else {
		herodata[i]["baseDPS"] = 0
	}
}

//loadLocalStorage();
console.log(herodata); //For Debugging purposes

//Temporary Incremental Game
function increment() {
	document.getElementById("counter").innerHTML = parseInt(document.getElementById("counter").innerHTML) + 1;
}

document.getElementById("counterbtn").onclick = increment;
// End of Incrememntal Game Code