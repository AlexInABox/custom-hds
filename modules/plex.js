var presence = require('./misc/presence.js');
class plex {
    constructor(serverURL, token, username, updateInterval, superPresence) {
        presence = superPresence;

        updateplex(serverURL, token, username);
        setInterval(function () { updateplex(serverURL, token, username) }, updateInterval * 1000);
    }
}
module.exports = plex;

const fetch = require('node-fetch');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

async function updateplex(serverURL, token, username) {
    console.log("\x1b[31m", "[PLEX] Fetching current stream...");

    var activeSessionsURL = "http://" + serverURL + "/status/sessions?X-Plex-Token=" + token;
    var title, cover, publicURL;

    const response = await fetch(activeSessionsURL); //get xml
    const data = await new xml2js.Parser().parseStringPromise(await response.text());

    if (data.MediaContainer.$.size == 0) {
        console.log("\x1b[31m", "[PLEX] No active sessions found!");
        return;
    }

    var found = false;
    if (data.MediaContainer.$.size > 1) {
        console.log("\x1b[31m", "[PLEX] Multiple active sessions found! Finding the one with the username " + username + "...");
        for (var i = 0; i < data.MediaContainer.$.size; i++) {
            if (data.MediaContainer.Video[i].User[0].$.title == username) {
                title = data.MediaContainer.Video[i].$.grandparentTitle + ": " + data.MediaContainer.Video[i].$.title;
                cover = data.MediaContainer.Video[i].$.grandparentThumb;
                publicURL = "";
                found = true;
                break;
            }
        }

        if (!found) {
            console.log("\x1b[31m", "[PLEX] No active sessions found with the username " + username + "!");
            return;
        }
        console.log("\x1b[31m", "[PLEX] Successfully fetched current stream!");
        saveCoverForPublicViewing(serverURL, cover, token);
    }
    else {
        title = data.MediaContainer.Video[0].$.grandparentTitle + ": " + data.MediaContainer.Video[0].$.title;
        cover = data.MediaContainer.Video[0].$.grandparentThumb;
        publicURL = "";
        console.log("\x1b[31m", "[PLEX] Successfully fetched current stream!");
        saveCoverForPublicViewing(serverURL, cover, token);
    }

    coverPath = "/modules/public/plex_covers/" + String(cover).split("/")[String(cover).split("/").length - 1] + ".jpg";

    console.log("\x1b[31m", "[PLEX] Patching presence...");
    console.log("\x1b[31m", "[PLEX] Title: " + title);
    console.log("\x1b[31m", "[PLEX] Cover: " + coverPath);
    console.log("\x1b[31m", "[PLEX] Public URL: " + publicURL);
    presence.patchPlex(title, coverPath, publicURL);
}

async function saveCoverForPublicViewing(serverURL, cover, token) {
    // Download the image and save it to the directory
    const imageUrl = "http://" + serverURL + cover + "?X-Plex-Token=" + token;
    const directoryPath = path.join(__dirname, './public/plex_covers');

    // Extract the filename from the URL
    const coverSplit = String(cover).split("/");
    const filename = coverSplit[coverSplit.length - 1];

    fetch(imageUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const imagePath = path.join(directoryPath, filename + ".jpg");
            const writer = fs.createWriteStream(imagePath);
            response.body.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        })
        .then(() => {
            console.log("\x1b[31m", "[PLEX] Successfully saved cover for public viewing!");
        })
        .catch(error => {
            console.error("\x1b[31m", "[PLEX] Failed to save cover for public viewing!", error);
        });

}