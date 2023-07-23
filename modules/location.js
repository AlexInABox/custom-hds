var presence = require('./misc/presence.js');

class location {
    constructor(username, password, apikey, updateInterval, superPresence) {
        presence = superPresence;

        updateLocation(username, password, apikey);
        setInterval(function () { updateLocation(username, password, apikey) }, updateInterval * 1000);
    }
}
module.exports = location;

const life360 = require('life360-node-api');
const fetch = require('node-fetch');
var requestOptions = {
    method: 'GET',
};

async function updateLocation(username, password, apikey) {
    console.log("\x1b[35m", "[LIFE360] Fetching location...");
    var user;

    for (var i = 0; i < 5; i++) { //The API is a bit unstable, so we try to login 5 times before giving up
        try {
            let client = await life360.login(username, password)

            let circles = await client.listCircles()

            user = (await circles[0].listMembers())[0];
            break;
        } catch (e) {
            if (i == 4) {
                console.log("\x1b[35m", "[LIFE360] Failed to login after 5 attempts, exiting...")
                console.log("\x1b[31m", e)
                return;
            }
            console.log("\x1b[35m", "[LIFE360] Something went wrong, retrying... (" + (i + 1) + " / 5)")
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    try {
        await fetch("https://api.geoapify.com/v1/geocode/reverse?lat=" + user.location.latitude + "&lon=" + user.location.longitude + "&lang=en&limit=1&format=json&apiKey=" + apikey, requestOptions)
            .then(response => response.json())
            .then(result => {

                //Now we geocode the aproximate coordinates of the district inorder not to leak the exact location of the user
                fetch("https://api.geoapify.com/v1/geocode/search?text=" + result.results[0].district + ", " + result.results[0].city + "&lang=en&limit=1&format=json&apiKey=" + apikey, requestOptions)
                    .then(response => response.json())
                    .then(result2 => {
                        presence.patchLocation(result2.results[0].lat, result2.results[0].lon, result.results[0].district, result.results[0].country, result.results[0].city);

                        //Purge sensitive data
                        result2 = null;
                    })

                //Purge sensitive data
                result = null;
            });
    } catch (e) {
        console.log("\x1b[35m", "[LIFE360] Failed to fetch location, due to an invalid API key. (Presumably)", e)
        //Purge sensitive data
        user = null;
        return;
    }
    console.log("\x1b[35m", "[LIFE360] Successfully fetched location!")
    //Purge sensitive data
    user = null;
}