var presence = require('./misc/presence.js');
class applePay {

    constructor(superPresence) {
        presence = superPresence;

        initializeServer();
    }

    update() { }

}

//Everytime a payment has been made via ApplePay on the users iPhone the shortcut fires and sends
//some information about the purchase made.
//Thing like vendor, price, location
//Privacy evaluation ongoing.

module.exports = applePay;

const express = require('express');
const app = express();
const port = 2082; //cloudflare http port

//variables
var merchant;
var amount;
var cardOrPass;
//end-of variables

function initializeServer() {
    app.use(express.json());

    app.listen(port, () => {
        console.log("\x1b[36m", "[ApplePay] ApplePay is now listening on port " + port);
    });

    app.put('/', (req, res) => {

        console.log("\x1b[36m", "[ApplePay] Received a PUT request!");

        message = String(req.body);
        merchant = message.merchant;
        amount = message.amount;
        cardOrPass = message.cardOrPass;

        res.sendStatus(200);
        //Patch presence

        presence.patchApplePay(String(merchant), Number(amount), String(cardOrPass));
    })
}