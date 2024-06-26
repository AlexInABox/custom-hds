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

    let response, data;
    try {
        response = await fetch(activeSessionsURL); //get xml
        data = await new xml2js.Parser().parseStringPromise(await response.text());
    } catch (e) {
        if (e.code == "ECONNREFUSED") { //server offline or maintenance mode
            console.log("\x1b[31m", "[PLEX] Failed to fetch Plex data, probably because the server is offline or in maintenance mode.")
        } else if (e.code == "ENOTFOUND") { //server not found
            console.log("\x1b[31m", "[PLEX] Failed to fetch Plex data, probably because the server URL is incorrect.")
        }
        else {
            console.log("\x1b[31m", "[PLEX] Failed to fetch Plex data, probably because the token expired.")
        }
        return;
    }

    var found = false;
    try {
        if (data.MediaContainer.$.size == 0) {
            console.log("\x1b[31m", "[PLEX] No active sessions found!");
            return;
        } else if (data.MediaContainer.$.size >= 1) {
            console.log("\x1b[31m", "[PLEX] Multiple active sessions found! Finding the one with the username " + username + "...");
            for (var i = 0; i < data.MediaContainer.$.size; i++) {
                if (data.MediaContainer.Video[i].User[0].$.title == username) {
                    console.log("\x1b[31m", "[PLEX] Found active session with the username " + username + "!");
                    if (data.MediaContainer.Video[i].$.librarySectionTitle == "Movies" || data.MediaContainer.Video[i].$.librarySectionTitle == "Movies (Anime)") { //TODO: Make the user set all the categories that are movies OR try both and select the one thats not undefined?
                        title = data.MediaContainer.Video[i].$.title;
                        cover = data.MediaContainer.Video[i].$.thumb;
                    } else {
                        title = data.MediaContainer.Video[i].$.grandparentTitle + ": " + data.MediaContainer.Video[i].$.title;
                        cover = data.MediaContainer.Video[i].$.grandparentThumb;
                    }

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
    } catch (e) {
        console.log("\x1b[31m", "[PLEX] Failed to fetch Plex data, probably because the token expired.")
        return;
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

    try {
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

    } catch (e) {
        console.log("\x1b[31m", "[PLEX] Failed to save cover for public viewing!", e);
        return;
    }
}