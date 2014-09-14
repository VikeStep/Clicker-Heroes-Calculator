function increment() {
	document.getElementById("counter").innerHTML = parseInt(document.getElementById("counter").innerHTML) + 1;
}

document.getElementById("counterbtn").onclick = increment;