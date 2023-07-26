var presence = require('./misc/presence.js');
class netflix {
    constructor(cookie, apiKey, updateInterval, superPresence) {
        presence = superPresence;

        if (updateInterval < 900 && apiKey) {
            console.log("\x1b[31m", "[NETFLIX] [WARNING] The update interval is less than 15 minutes, this will result in more than 3000 API requests per month, which is the free limit of the uNoGS API. If you want to avoid this, please set the update interval to more than 15 minutes or consider upgrading to the pro version of the API. You can find more information here: https://apilayer.com/subscriptions")
        }

        updateNetflix(cookie, apiKey);
        setInterval(function () { updateNetflix(cookie, apiKey) }, updateInterval * 1000);
    }
}
module.exports = netflix;

const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function updateNetflix(cookie, apiKey) {
    console.log("\x1b[31m", "[NETFLIX] Fetching latest stream...");

    var history_url = "https://www.netflix.com/viewingactivity?raw";

    var headers = new Headers();
    headers.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36");
    headers.append("Cookie", cookie);

    var title;
    var date;
    var showId;
    var defaultImage;

    await fetch(history_url, {
        headers: headers
    })
        .then(res => res.text())
        //async body
        .then(body => {
            try {
                var $ = cheerio.load(body);
                title = $('.col.title').first().find('a').text();
                date = $('.col.date').first().text();
                showId = String($('.col.title').first().find('a').attr('href')).split('/')[2]; // "/title/80100172" -> "80100172"

                if (apiKey != "") {
                    console.log("\x1b[31m", "[NETFLIX] Successfully fetched latest Netflix stream!")
                    defaultImage = fetchDefaultImage(apiKey, showId, title, date);
                    return;
                } else {
                    presence.patchNetflix(title, defaultImage, date, showId);
                    console.log("\x1b[31m", "[NETFLIX] Successfully fetched latest Netflix stream (without cover image)!")
                    return;
                }
            } catch (e) {
                console.log("\x1b[31m", "[NETFLIX] Failed to fetch Netflix data, probably because the cookie expired.")
                return;
            }
        });
}

async function fetchDefaultImage(apiKey, showId, title, date) {
    showId = await fetch("https://www.netflix.com/title/" + showId)
        .then(res => {
            if (res.url.split('/').length === 6) {
                return (res.url.split('/')[5]); // "https://www.netflix.com/de-en/title/80100172" -> "80100172"
            } else {
                return (res.url.split('/')[4]); // "https://www.netflix.com/title/80100172" -> "80100172" 
            }
        })

    var fetch_url = "https://api.apilayer.com/unogs/title/details?netflix_id=" + showId;
    var headers = {
        'apikey': apiKey
    };

    console.log("\x1b[31m", "[NETFLIX] Fetching Netflix cover image for " + showId + "...")

    for (var i = 0; i < 5; i++) { //As of recently, the API is a bit unstable, so we try to fetch the image 5 times before giving up
        try {
            await fetch(fetch_url, {
                headers: headers
            })
                .then(res => res.json())
                .then(body => {
                    if (body.message) {
                        console.log("\x1b[31m", "[NETFLIX] Failed to fetch Netflix cover image, API error: ")
                        console.log("\x1b[31m", body.message)

                        presence.patchNetflix(title, undefined, date, Number(showId));
                        return;
                    }
                    console.log("\x1b[31m", "[NETFLIX] Successfully fetched Netflix cover image!")
                    var defaultImage = body.default_image;
                    presence.patchNetflix(title, defaultImage, date, Number(showId));
                });
            break;
        } catch (e) {
            if (i == 4) {
                console.log("\x1b[31m", "[NETFLIX] Failed to fetch Netflix cover image after 5 attempts, exiting...")
                console.log("\x1b[31m", e)
                return;
            }
            console.log("\x1b[31m", "[NETFLIX] Something went wrong, retrying... (" + (i + 1) + " / 5)")
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}