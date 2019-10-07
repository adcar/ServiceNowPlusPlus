// ==UserScript==
// @name         ServiceNow++
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  Adds some extra features to ServiceNow that make my life much easier
// @author       Alexander Cardosi
// @match        https://globalfoundries.service-now.com/*
// ==/UserScript==

/**
@type {(string|Array)} Special cases. Will be highlighted in yellow.
*/
const specialCases = ["TASK0852576", "TASK0843305", "TASK0848093"];


/** Calls the main function upon the keypress of the backquote (`) character */
document.addEventListener("keypress", (e) => {
    if (e.code === "Backquote") {
        main();
    }
})

/**
* The main function.
*/
function main() {
    console.log("[ServiceNow++] Runnning Script...");
    const rows = document.querySelectorAll(".list2_body tr");
    const descs = getDescriptions(rows);
    const newDescs = descs.map(desc => {
        const devName = getDevName(desc);
        const userName = getUserName(desc);
        if (userName !== null && devName !== null) {
            return `${devName} \n \n ${userName}`;
        } else {
            return desc;
        }
    });
    rows.forEach(row => {
        setColor(row);
    });
    setDescriptions(newDescs, rows);
}

/**
* Sets the color of the row based on the 12th child. When the 12th child contains my name "Cardosi, Alexander", the color will be marked green. Marks special cases yellow
* @param {HTMLElement} row - The HTML row element
*/
function setColor(row) {
    const children = Array.from(row.children);

    children.forEach((child, index) => {
        if (children[12].innerText.includes("Cardosi, Alexander")) {
            child.style.backgroundColor = "#81C784"; // green 300
            if (index === 0) child.style.backgroundColor = "#66BB6A"; // green 400
        }
        if (specialCases.includes(children[2].innerText)) {
            child.style.backgroundColor = "#FFD54F"; // amber 300
            if (index === 0) child.style.backgroundColor = "#FFCA28"; // amber 400
        }
    })
}

/**
* Returns descriptions from a nodelist of rows
* @param {nodelist} rows - Nodelist of rows where the 3rd element is the description
* @return {(string|Array)} Array of strings containing descriptions
*/
function getDescriptions(rows) {
    const _rows = Array.from(rows);
    return _rows.map(row => {
        return row.children[3].getAttribute("data-original-title");
    })
}

/**
* Sets each description in the array to their respective columns. The array has to be the same length as the number of rows
* @param {(string|Array)} descriptions - array of descriptions
* @param {HTMLElement} rows - HTML element of the rows
* @throws Will through an error if the length of descriptions does not match that of rows
*/
function setDescriptions(descriptions, rows) {
    if (rows.length !== descriptions.length) throw new Error(`Invalid array length of ${descriptions.length}. Does not match number of rows ${rows.length}.`)
    rows.forEach((row, index) => {
        row.children[3].innerText = descriptions[index]
    })
}

/**
* Gets the device name from a description.
* @param {string} description
* @return string} line containing device name, or null if not found
*/
function getDevName(description) {
    return getFromRegex(description, "(Computer Model|Hardware options)(.*)");
}

/**
* Gets the "requested user" name from a description.
* @param {string} description
* @return {string} line containing user name, or null if not found
*/
function getUserName(description) {
    return getFromRegex(description, "(Open request for this user)(.*)");
}

/**
* Gets a result from a regex. Returns null if no match found
* @param {string} string - The string that the regex will perform a match on
* @param {string} regex - Pattern that you want to test for
* @return {string} line containing regex, or null if not found
*/
function getFromRegex(string, regex) {
    const result = string.match(regex);
    if (result === null) {
        return null;
    } else {
        return result[0];
    }
}
