var presence = require('./misc/presence.js');
var config = require('./misc/config.js');
class valorant {
    riotPUUID;
    riotID;
    riotTag;
    updateInterval;

    idandtag_complete = false;
    puuid_exists = false;

    constructor(riotPUUID, riotID, riotTag, updateInterval, superPresence, superConfig) {
        presence = superPresence;
        config = superConfig;
        this.riotPUUID = riotPUUID;
        this.riotID = riotID;
        this.riotTag = riotTag;
        this.updateInterval = updateInterval;

        this.idandtag_complete = (this.riotID != "" && this.riotTag != "");
        this.puuid_exists = (this.riotPUUID != "");

        if (this.puuid_exists) {
            console.log("\x1b[35m", "[VALORANT] Fetching data...");
            getValorantData(this.riotPUUID);
        } else if (this.idandtag_complete) {
            console.log("\x1b[35m", "[VALORANT] Fetching data...");
            getValorantDataByIdAndTag(this.riotID, this.riotTag);
        }

        setInterval(() => {
            this.riotPUUID = config.getValorantPUUID();
            this.riotID = config.getValorantRiotID();
            this.riotTag = config.getValorantRiotTag();

            this.idandtag_complete = (this.riotID != "" && this.riotTag != "");
            this.puuid_exists = (this.riotPUUID != "");

            if (this.puuid_exists) {
                console.log("\x1b[35m", "[VALORANT] Fetching data...");
                getValorantData(this.riotPUUID);
            } else if (this.idandtag_complete) {
                console.log("\x1b[35m", "[VALORANT] Fetching data...");
                getValorantDataByIdAndTag(this.riotID, this.riotTag);
            }
        }, this.updateInterval * 1000); // 1000 ms = 1 second   
    }
}
module.exports = valorant;

const fetch = require('node-fetch');

async function getValorantData(puuid) {
    try {
        config.setValorantPUUID(puuid);
        var idtag, nameandregion, region, rankandRR, rank, rr;

        nameandregion = await getValorantUsernameAndRegion(puuid);
        idtag = nameandregion[0]; //name#tag
        config.setValorantRiotID(String(idtag).split("#")[0]);
        config.setValorantRiotTag(String(idtag).split("#")[1]);
        region = nameandregion[1]; //eu
        rankandRR = await getValorantRank(puuid, region); //Platinum 1 44RR
        rank = rankandRR[0]; //Platinum 1
        rr = rankandRR[1]; //44RR

        presence.patchValorant(idtag, rank, rr);
    } catch (e) {
        console.log("\x1b[35m", "[VALORANT] Failed to fetch Valorant data using the PUUID, probably because the PUUID is invalid.");
        console.log("\x1b[35m", "[VALORANT] Trying to repair the PUUID by using the Riot ID and Tag...");
        getValorantDataByIdAndTag(config.getValorantRiotID(), config.getValorantRiotTag());
        return;
    }
}

async function getValorantUsernameAndRegion(puuid) {
    apiurl = "https://api.henrikdev.xyz/valorant/v1/by-puuid/account/" + puuid;

    const response = await fetch(apiurl);
    const json = await response.json();

    const name = json.data.name;
    const tag = json.data.tag;
    const region = json.data.region;

    console.log("\x1b[35m", "[VALORANT] Fetched data for " + name + "#" + tag + " in " + region + "\x1b[0m");

    return [name + "#" + tag, region];
}

async function getValorantDataByIdAndTag(id, tag) {
    try {
        apiurl = "https://api.henrikdev.xyz/valorant/v1/account/" + id + "/" + tag;

        const response = await fetch(apiurl);
        const json = await response.json();

        console.log("\x1b[35m", "[VALORANT] Fetched PUUID: " + json.data.puuid + "\x1b[0m");
        getValorantData(json.data.puuid);
    } catch (e) {
        console.log("\x1b[35m", "[VALORANT] Failed to fetch Valorant data, probably because the Riot ID and Tag are invalid.");
        return;
    }
}


async function getValorantRank(puuid, region) {
    apiurl = "https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/" + region + "/" + puuid;

    const response = await fetch(apiurl);
    const json = await response.json();

    return [json.data.currenttierpatched, json.data.ranking_in_tier]
}