var presence = require('./misc/presence.js');
class discord {
    userID;
    updateInterval;

    constructor(userID, updateInterval, superPresence) {
        presence = superPresence;
        this.userID = userID;
        this.updateInterval = updateInterval;
    }

    update() { }

}

module.exports = discord;