// ==UserScript==
// @name         ServiceNow++
// @namespace    http://tampermonkey.net/
// @version      0.5.2
// @description  Adds some extra features to ServiceNow that make my life much easier
// @author       Alexander Cardosi
// @match        https://globalfoundries.service-now.com/*
// ==/UserScript==

/**
* Special cases. Will be highlighted in yellow.
* @type {(string|Array)}
*/
const specialCases = ["TASK0852576", "TASK0843305", "TASK0848093"];


/** Calls the main function upon the keypress of the backquote (`) character */
document.addEventListener("keypress", (e) => {
    if (e.code === "Backquote") {
        main();
    }
})

/**
* The main function. Colorizes rows, shortens descriptions, and adds buttons.
*/
function main() {
    console.log("[ServiceNow++] Runnning Script...");
    const rows = document.querySelectorAll(".list2_body tr");
    const descs = getDescriptions(rows);
    const newDescs = descs.map(desc => {
        const devName = getDevName(desc);
        const userName = getUserName(desc);
        if (userName !== null && devName !== null) {
            return `${devName} \n \n ${userName} \n`;
        } else {
            return desc + "\n";
        }
    });
    rows.forEach(row => {
        setColor(row);
    });
    setDescriptions(newDescs, rows);

    // Add btns
    rows.forEach(row => {
        appendEmailBtn(row);
        appendTaskBtn(row);
        appendNameBtn(row);
    })
}

/**
* Appends a copy email button that runs copyEmailToClipboard when clicked.
* @param {HTMLElement} row - The HTML row element found in ServiceNow
* @param {number} column - The column number where descriptions are located. Defaults to 3.
*/
function appendEmailBtn(row, column = 3) {
    const desc = getDescription(row);
    const devName = getDevName(desc);
    const userName = getUserName(desc)
    const emailBtn = document.createElement("button");
    emailBtn.innerHTML = "Copy Email Message";
    emailBtn.addEventListener("click", () => {copyEmailToClipboard(devName, userName)});
    row.children[column].appendChild(emailBtn);
}

/**
* Appends a copy task button that copies task number
* @param {HTMLElement} row - The HTML row element found in ServiceNow
* @param {number} column - The column number where task numbers are located. Defaults to 2.
*/
function appendTaskBtn(row, column = 2) {
    const copyTaskBtn = document.createElement("button");
    copyTaskBtn.innerHTML = "Copy";
    copyTaskBtn.addEventListener("click", async () => {await navigator.clipboard.writeText(row.children[column].children[0].innerText)});
    row.children[column].appendChild(copyTaskBtn);
}

/**
* Appends a copy name button that copies the first and last name in order without the comma
* @param {HTMLElement} row - The HTML row element found in ServiceNow
* @param {number} column - The column number where "Opened By" names are located. Defaults to 11.
*/
function appendNameBtn(row, column = 11) {
    const copyNameBtn = document.createElement("button");
    copyNameBtn.innerHTML = "Copy";

    // 1st index = last name, 2nd index = first name
    const name = row.children[column].children[0].innerText.match(/(\w+),\s(\w+)/);

    copyNameBtn.addEventListener("click", async () => {await navigator.clipboard.writeText(`${name[2]} ${name[1]}`)})
    row.children[column].appendChild(copyNameBtn);
}

/**
* Copies an email message to the clipboard containing details like device name and the user's first name.
* @param {string} devName - device name that is returned by getDeviceName()
* @param {string} userName - user name that is returned by getUserName()
*/
async function copyEmailToClipboard(devName, userName) {
    let device = devName.match(/(Computer Model\/Type —— |Hardware options —— )(.*)\s-/)[2];
    const firstName = userName.match(/(Open request for this user —— \w+,\s)(\w+)/)[2];

    if (device == "HP Standard") {
        device = "HP ProBook"
    }
    if (device == "HP Developer") {
        device = "HP ZBook"
    }

    const msg = `Hi ${firstName},

You can pick up your ${device} at the IT workbench in 966-2 L11 M-F 9am-1pm.

Please let me know when you get it so I can close this task.
Thanks,`
    await navigator.clipboard.writeText(msg);
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
* Returns the description from a row
* @param {HTMLElement} row - HTML row element
* @return {string} string containing descriptions
*/
function getDescription(row) {
    return row.children[3].getAttribute("data-original-title");
}

/**
* Sets each description in the array to their respective columns. The array has to be the same length as the number of rows
* @param {(string|Array)} descriptions - Array of descriptions
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
* @return {string} Line containing device name, or null if not found
*/
function getDevName(description) {
    return getFromRegex(description, "(Computer Model|Hardware options)(.*)");
}

/**
* Gets the "requested user" name from a description.
* @param {string} description
* @return {string} Line containing user name, or null if not found
*/
function getUserName(description) {
    return getFromRegex(description, "(Open request for this user)(.*)");
}

/**
* Gets a result from a regex. Returns null if no match found
* @param {string} string - The string that the regex will perform a match on
* @param {string} regex - Pattern that you want to test for
* @return {string} Line containing regex, or null if not found
*/
function getFromRegex(string, regex) {
    const result = string.match(regex);
    if (result === null) {
        return null;
    } else {
        return result[0];
    }
}
