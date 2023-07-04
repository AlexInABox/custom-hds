const fs = require('fs');
const path = require('path');

var config_valid = {
    "hds": false,
    "location": false,
    "netflix": false,
    "plex": false,
    "valorant": false,
    "drpc": false,
    "discord": false,
    "youtube": {
        "videos": false,
        "music": false,
    },
    "spotify": false,
}

var realConfig;

class config {
    constructor() {
        realConfig = require('./../../config.json');
    }

    check() {
        config_valid.hds = realConfig.hds.active;

        config_valid.location = realConfig.location.active;

        if (realConfig.location.active && (realConfig.location.credentials.LIFE360_USERNAME === "" || realConfig.location.credentials.LIFE360_PASSWORD === "" || realConfig.location.credentials.GEOAPIFY_API_KEY === "")) {
            config_valid.location = false;
        }
        if (realConfig.location.updateInterval === "") {
            realConfig.location.updateInterval = 30;
        }

        config_valid.netflix = realConfig.netflix.active;

        if (realConfig.netflix.active && (realConfig.netflix.cookie === "")) {
            config_valid.netflix = false;
        }
        /*if (realConfig.netflix.apilayer_apikey === "") { //no use in totally disabling the module if the apikey is missing
            config_valid.netflix = false;
        }*/
        if (realConfig.netflix.updateInterval === "") {
            realConfig.netflix.updateInterval = 900;
        }

        config_valid.plex = realConfig.plex.active;

        if (realConfig.plex.active && (realConfig.plex.serverURL === "" || realConfig.plex.token === "" || realConfig.plex.username === "")) {
            config_valid.plex = false;
        }
        if (realConfig.plex.updateInterval === "") {
            realConfig.plex.updateInterval = 60;
        }

        config_valid.valorant = realConfig.valorant.active;

        if (realConfig.valorant.active && ((realConfig.valorant.riotID === "" || realConfig.valorant.riotTag === "") && realConfig.valorant.riotPUUID === "")) {
            config_valid.valorant = false;
        }
        if (realConfig.valorant.updateInterval === "") {
            realConfig.valorant.updateInterval = 60;
        }

        config_valid.drpc = realConfig.drpc.active;

        if (realConfig.drpc.appID === "") {
            realConfig.drpc.appID = "1033806008008581240";
        }
        if (realConfig.drpc.startupDelay === "") {
            realConfig.drpc.startupDelay = 10;
        }

        config_valid.discord = realConfig.discord.active;

        if (realConfig.discord.active && (realConfig.discord.userID === "")) {
            config_valid.discord = false;
        }
        if (realConfig.discord.updateInterval === "") {
            realConfig.discord.updateInterval = 30;
        }

        config_valid.youtube.videos = realConfig.youtube.videos.active;
        config_valid.youtube.music = realConfig.youtube.music.active;

        if (realConfig.youtube.updateInterval === "") {
            realConfig.youtube.updateInterval = 60;
        }

        config_valid.spotify = realConfig.spotify.active;

        if (realConfig.spotify.active && (realConfig.spotify.api.clientID === "" || realConfig.spotify.api.clientSecret === "")) {
            config_valid.spotify = false;
        }
        if (realConfig.spotify.updateInterval === "") {
            realConfig.spotify.updateInterval = 60;
        }

        patchConfig(realConfig);
        console.log("\x1b[33m", "[CONFIG] Config check complete" + "\x1b[0m");
    }

    getValid() {
        return config_valid;
    }

    get() {
        return realConfig;
    }

    setValorantPUUID(puuid) {
        realConfig.valorant.riotPUUID = puuid;
        console.log("\x1b[33m", "[CONFIG] [VALORANT] Valorant PUUID set to " + puuid + "\x1b[0m");

        patchConfig(realConfig);
    }

    setValorantRiotID(riotID) {
        realConfig.valorant.riotID = riotID;
        console.log("\x1b[33m", "[CONFIG] [VALORANT] Valorant RiotID set to " + riotID + "\x1b[0m");

        patchConfig(realConfig);
    }

    setValorantRiotTag(riotTag) {
        realConfig.valorant.riotTag = riotTag;
        console.log("\x1b[33m", "[CONFIG] [VALORANT] Valorant RiotTag set to " + riotTag + "\x1b[0m");

        patchConfig(realConfig);
    }
}

module.exports = config;


async function patchConfig(config) {
    console.log("\x1b[33m", "[CONFIG] Patching config.json...", "\x1b[0m");
    fs.writeFileSync(
        path.resolve(__dirname, "./../../config.json"),
        JSON.stringify(config, null, 2),
        (err) => {
            if (err) {
                console.error("[CONFIG] " + err);
            }
            // file written successfully
        }
    );
}

//PSEUDO:
// verfiy if the config is complete
// verify if the config values are correct
// if correct, set the private variable in this file to true
// if not, set the private variable in this file to false


// PSEUDO:
// function configCheck() {
//     if (config has !same structure as the default config) {
//         return false;
//     }
//     if (configvalue1 is not a number) {
//         configvalue1_valid = false;
//     }
//     if (configvalue2 is not a string) {
//         configvalue2_valid = false;
//     }
//     ...
//     return true;
// }
//     
