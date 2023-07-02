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

module.exports = spotify;