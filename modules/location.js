var presence = require('./misc/presence.js');

class location {
    constructor(GEOAPIFY_API_KEY, superPresence) {
        presence = superPresence;

        initializeServer(GEOAPIFY_API_KEY);
    }

    update() { }
}
module.exports = location;
//We open a server to listen for POST requests which contain the location of the user in their body stored in the "lon" and "lat" variables.
//The aproach here is to use a mobile app like "OwnTracks" to send the location of the user to us the server via HTTP POST requests.


const express = require('express');
const app = express();
const port = 2086; //cloudflare http port

const fetch = require('node-fetch');
var requestOptions = {
    method: 'GET',
};

function initializeServer(GEOAPIFY_API_KEY) {
    //Listen for POST requestst and search request body for the "lon" and "lat" variables
    app.use(express.json());

    app.listen(port, () => {
        console.log("\x1b[36m", "[Location] Location is now listening on port " + port);
    });

    app.post('/', async (req, res) => {

        console.log("\x1b[36m", "[Location] Received a location update request!");

        try {
            await fetch("https://api.geoapify.com/v1/geocode/reverse?lat=" + req.body.lat + "&lon=" + req.body.lon + "&lang=en&limit=1&format=json&apiKey=" + GEOAPIFY_API_KEY, requestOptions)
                .then(response => response.json())
                .then(result => {

                    //Now we geocode the aproximate coordinates of the district inorder not to leak the exact location of the user
                    fetch("https://api.geoapify.com/v1/geocode/search?text=" + String(result.results[0].postcode) + ", " + String(result.results[0].district) + ", " + String(result.results[0].suburb) + ", " + String(result.results[0].city) + ", " + String(result.results[0].state) + ", " + String(result.results[0].country) + "&lang=en&limit=1&format=json&apiKey=" + GEOAPIFY_API_KEY, requestOptions)
                        .then(response => response.json())
                        .then(result2 => {
                            presence.patchLocation(Number(result2.results[0].lat.toFixed(2)), Number(result2.results[0].lon.toFixed(2)), result.results[0].district, result.results[0].country, result.results[0].city);
                        })
                });
        } catch (e) {
            console.log("\x1b[35m", "[LIFE360] Failed to fetch location, due to an invalid API key. (Presumably)", e)
            return;
        }
        res.sendStatus(200);
    })
}