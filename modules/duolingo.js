//USERDATA API URL: https://www.duolingo.com/api/1/users/show?username=USERNAME
//Authentication via Cookie. No public (unauthenticated) API available.
//Any Cookie regardless of ownership will be able to pull (public) user data from any account.
//Private userdata (such as email) is only available via the authenticated user's cookie.
//This is a limitation of the Duolingo API, not the Duolingo module.

//Based on Evan Tschuy's Duolingo API Documentation: https://tschuy.com/duolingo/ (https://tschuy.com/duolingo/api/endpoints.html#get-users-show-id-user-id-or-users-show-username-username)
//Since the writing of their documentation, the API has changed slightly. For example; they state that authentication is not required for public user data, but it is.

var presence = require('./misc/presence.js');
var duolingo_languages = require('../assets/duolingo_languages.json');
class duolingo {
    constructor(username, cookie, updateInterval, superPresence) {
        presence = superPresence;

        updateDuolingo(username, cookie, username);
        setInterval(function () { updateDuolingo(username, cookie, username) }, updateInterval * 1000);
    }
}
module.exports = duolingo;

const fetch = require('node-fetch');

async function updateDuolingo(username, cookie, username) {

    var username, streak, totalXP, language, avatar; //For (unauthenticated) public user data, the xp value is only for the user's currently learning language.
    var duolingoURL = "https://www.duolingo.com/api/1/users/show?username=" + username;
    var headers = {
        "Cookie": cookie
    }

    var data;
    try {
        const response = await fetch(duolingoURL, { headers: headers }); //get json
        data = await response.json();
        if (data.error) {
            console.log("\x1b[34m", "[DUOLINGO] Error: " + data.error);
            return;
        }
    } catch (error) {
        console.log("\x1b[34m", "[DUOLINGO] Error: " + error);
        return;
    }

    // Extract XP values for each language
    totalXP = 0;
    for (var i = 0; i < data.languages.length; i++) {
        totalXP = totalXP + data.languages[i].points;
    }




    // Compare old data with new data
    var newData = {
        username: String(data.fullname),
        streak: Number(data.site_streak),
        totalXP: Number(totalXP),
        language: String(data.learning_language_string),
        language_icon_URL: new URL("https://upload.wikimedia.org/wikipedia/commons/1/1d/No_image.svg"),
        avatar: String(data.avatar) + "/xxlarge"
    }

    for (i = 0; i < duolingo_languages.languages.length; i++) {
        if (duolingo_languages.languages[i].name.toUpperCase() === newData.language.toUpperCase()) {
            newData.language_icon_URL = duolingo_languages.languages[i].url;

            console.log("\x1b[34m", "[DUOLINGO] Found languageURL for " + newData.language + " : " + newData.language_icon_URL);
            break;
        }
    }

    var oldData = presence.getDuolingo();

    if (oldData.username === newData.username && oldData.streak === newData.streak && oldData.xp === newData.totalXP && oldData.language === newData.language && oldData.avatar === newData.avatar) {
        console.log("\x1b[34m", "[DUOLINGO] No changes detected. Skipping patching presence.");
        return;
    }
    console.log("\x1b[34m", "[DUOLINGO] Changes detected! Patching presence.");
    presence.patchDuolingo(newData.username, newData.streak, newData.totalXP, newData.language, newData.language_icon_URL, newData.avatar);
}