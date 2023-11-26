/*
HDS stands for "Health Data Server" and is in this implementation a custom express server that receives health data from the HDS application running on smartwatches.
As of now the data being received is the following:

- Heart rate
- (blood) oxygen saturation
- speed (acceleration)
- ~steps~ (does not work reliably will therefore never be implemented)

This data is then regularly patched into the presence.json file for publication on the web.
*/
var presence = require('./misc/presence.js');
class hds {
    constructor(superPresence) {
        presence = superPresence;

        initializeServer();
    }
}
module.exports = hds;

const express = require('express');
const app = express();
const port = 2052;

function initializeServer() {
    app.use(express.json({ limit: '50mb' })); //incase auto export sends data of the past week...

    app.listen(port, () => {
        console.log("\x1b[36m", "[HDS] HDS is now listening on port " + port);
    });

    app.put('/', (req, res) => {
        message = String(req.body.data)
        startsWith = message.substr(0, 3);
        switch (startsWith) {
            case "hea":
                presence.patchHDSHeartRate(Number(message.substr(10, 3)));
                res.sendStatus(200);
                break;
            case "oxy":
                presence.patchHDSOxygenSaturation(parseFloat(message.substr(17, 20)));
                res.sendStatus(200);
                break;
            case "spe":
                speed = message.substr(6, 10);
                presence.patchHDSSpeed(Math.round(speed * 100) / 100);
                res.sendStatus(200);
                break;
            default:
                console.log("\x1b[36m", "[HDS] Received unknown data: " + message);
                res.sendStatus(400);
                break;

        }
    });
}