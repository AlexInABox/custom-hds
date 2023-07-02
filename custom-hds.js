var config = require('./modules/misc/config.js');
var presence = require('./modules/misc/presence.js');
var hds = require('./modules/hds.js');
var location = require('./modules/location.js');
var netflix = require('./modules/netflix.js');
var valorant = require('./modules/valorant.js');
var drpc = require('./modules/drpc.js');
var discord = require('./modules/discord.js');
var youtube = require('./modules/youtube.js');
var spotify = require('./modules/spotify.js');

/*
hds;
location;
netflix;
valorant;
drpc;
discord;
youtube;
spotify;
*/

config = new config();

config.check();
const validModules = config.getValid();

console.log(validModules);

initializeModules();

function initializeModules() {
    cfg = config.get();
    presence = new presence();

    if (validModules.hds) {
        // Initialize HDS
        console.log("\x1b[36m", "[HDS] Initializing HDS");
        hds = new hds(presence);
    }
    if (validModules.location) {
        // Initialize location
        console.log("\x1b[35m", "[LIFE360] Initializing location");
        location = new location(cfg.location.credentials.LIFE360_USERNAME, cfg.location.credentials.LIFE360_PASSWORD, cfg.location.credentials.GEOAPIFY_API_KEY, cfg.location.updateInterval, presence);
    }
    if (validModules.netflix) {
        // Initialize Netflix
        console.log("\x1b[31m", "[NETFLIX] Initializing Netflix");
        netflix = new netflix(cfg.netflix.cookie, cfg.netflix.apilayer_apikey, cfg.netflix.updateInterval, presence);
    }
    if (validModules.valorant) {
        // Initialize Valorant
        console.log("\x1b[34m", "[VALORANT] Initializing Valorant");
        valorant = new valorant(cfg.valorant.riotPUUID, cfg.valorant.riotID, cfg.valorant.riotTag, cfg.valorant.updateInterval, presence, config);
    }
    if (validModules.drpc) {
        // Initialize DRPC
        console.log("\x1b[33m", "[DRPC] Initializing DRPC");
    }
    if (validModules.discord) {
        // Initialize Discord
        console.log("\x1b[35m", "[DISCORD]Initializing Discord");
        discord = new discord(cfg.discord.userID, cfg.discord.updateInterval, presence);
    }
    if (validModules.youtube.videos || validModules.youtube.music) {
        // Initialize YouTube with validModules.youtube.videos and validModules.youtube.music
        console.log("\x1b[36m", "[YOUTUBE] Initializing YouTube");
    }
    if (validModules.spotify) {
        // Initialize Spotify
        console.log("\x1b[35m", "[SPOTIFY] Initializing Spotify");
    }
}