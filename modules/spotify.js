var presence = require('./misc/presence.js');
class spotify {
    clientID;
    clientSecret;
    updateInterval;

    constructor(clientID, clientSecret, updateInterval, superPresence) {
        presence = superPresence;
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.updateInterval = updateInterval;
    }

    update() { }

}

//Needs a web interface for the client to authenticate with spotify
//Therefore this module is backlogged until I start developing the frontend
//hence: 
//TODO: Spotify module

module.exports = spotify;