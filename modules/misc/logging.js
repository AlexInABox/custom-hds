//This module will handle the logging of all the events that occur in the system.
//High priority events will notify the user via email or discord webhook.

var email = {};
var discord = "";

class logging {

    constructor(email, discord) {
        this.email = email;
        this.discord = discord;
    }
}

module.exports = logging;

function logFailure(module, error) { //Highest priority, module is unable to recover, will send an email and discord message
    console.log("[" + module + "] " + error);
}

function logError(module, error) {  //Medium priority, module will retry or recover, will send a discord message
    console.log("[" + module + "] " + error);
}

function logWarning(module, error) { //Low priority, cookie will expire soon, will send a discord message
    console.log("[" + module + "] " + error);
}

function logInfo(module, error) { //No priority, solely for debugging, will not send any messages
    console.log("[" + module + "] " + error);
}