const express = require('express');
const app = express();
app.use(express.json());
const fetch = require("node-fetch"); // interact with the discord webhook
const fs = require("fs"); // file-write-system
const path = require("path"); // used to get the relative path the file is placed in
const schedule = require("node-schedule"); // importing node-schedule to reset the daily stepsCounter at 0'clock

var config = require('./config.json');
var packagejson = require('./package.json');
var heartRate = 0;
var oxygenSaturation = 0;
var speed = 0;
var focusStatus = "";
let discordRPCactive = false; //dont change this variable!
let initiatingRPC = false;
let rateLimited = false; // dont change this variable!
let speedCurrent = 0;

  //dont change this variable!
const version_id = packagejson.version;
process.env.TZ = config.timezone; // set this to your timezone
const secretPass = config.secretPass; // <-------------- set a secret param like this when using a domain name for security reasons (e.g. https://example.com/secretPass)
// end-of secrets

/*
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||    from here on: dont change anything unless you know what you are doing!    ||||          (not that i know what im doing but whatever)
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/

// a schedule wich resets the allTimeStepto0 counter at 0'clock
const whatevenisreality = schedule.scheduleJob({ hour: 0, minute: 0 }, () => {
  console.log("Job runs every day at 0:00AM");
  resetStepCount();
});

resetStepCount = function () {
  allTimeStepto0 = allTimeStep;

  sendWebhookSteps(0, config.webhookURL + "/messages/" + config.pedoMeterMessageID); // reset the webhook value manually incase the watch is not active
  fs.writeFileSyncSyncSync(
    path.resolve(__dirname, "../custom-hds/stepCountTo0.txt"),
    allTimeStepto0.toString(),
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );
};
// end-of schedule

// step-variables-initialization
let allTimeStep; // all steps ever
let allTimeStepto0; // all steps ever to 0'clock
let stepsToday = 0; // all steps today
let lastStepValue; // last step value sent by the watch


  startup();
  console.log("Starting server on port: " + config.port);
  app.listen(config.port, () => { console.log("\x1b[32m", 'Server is up and running!') }) // creating the server
  setallTimeStep(); // on startup get the last saved stepValues from stepCount.txt, lastStepValue.txt and stepCountTo0.txt
  setallTimeStepTo0();
  setlastStepValue();
  setHeartRate();
  setOxygenSaturation();
  setStepCount();
  setSpeed();
  setFocusStatus();

async function initiateDiscordRPC() {
  console.log("Discord is running, starting DiscordRPC");
    initiatingRPC = true; // a lock variable to prevent multiple RPCs from being initiated
    await sleep(14000); // wait 14 seconds to make sure discord is fully loaded
    client = require('discord-rich-presence')(config.discordAppID);
    discordRPCactive = true;
    console.log("\x1b[32m", "Discord RPC is active!");

    //initiatingRPC stays true so the RPC wont be initiated again

  }

async function startup(){
  console.log("Starting up...");
  if (config.forwardingDestination == "") {
    console.log("\x1b[31m", "No forwarding destination set, forwarding is disabled");
  } else console.log("\x1b[32m", "Forwarding all incomming requests to: " + config.forwardingDestination);
  if (!config.activateWebhooks) {
    console.log("\x1b[31m", "Webhooks are disabled!");
  } else console.log("\x1b[32m", "Webhooks are enabled!");
  if (!config.activateDiscordRPC) {
    console.log("\x1b[31m", "Discord RPC is disabled!");
  } else console.log("\x1b[32m", "Discord RPC is enabled! Searching for Discord...");


  if (config.activateDiscordRPC && isDiscordRunning()) {
    initiateDiscordRPC();
  }
  else console.log("\x1b[31m", "Discord RPC could not be activated!");
}

function isDiscordRunning() {
  try {
    return (require('child_process').execSync('tasklist').toString().indexOf('Discord.exe') > -1) | (require('child_process').execSync('tasklist').toString().indexOf('DiscordCanary.exe') > -1) | (require('child_process').execSync('tasklist').toString().indexOf('DiscordPTB.exe') > -1);
    //check if discord, discord canary or discord PTB is running
  } catch (e) {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


function setallTimeStep() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/stepCount.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        allTimeStep = 0;
      }
      //console.log("Setting allTimeSteps to: " + parseInt(data));
      allTimeStep = parseInt(data);
    }
  );
}

function setallTimeStepTo0() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/stepCountTo0.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        allTimeStepto0 = 0;
      }
      //console.log("Setting allTimeStepto0 to: " + parseInt(data));
      allTimeStepto0 = parseInt(data);
    }
  );
}

function setlastStepValue() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/lastStepValue.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        allTimeStep = 0;
      }
      //console.log("Setting lastStepValue to: " + parseInt(data));
      lastStepValue = parseInt(data);
    }
  );
}

function setHeartRate() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/hrate.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        heartRate = 0;
      }
      heartRate = data;
    }
  );
};

function setOxygenSaturation() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/oxygenSaturation.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        oxygenSaturation = 0;
      }
      oxygenSaturation = data;
    }
  );
};

function setStepCount() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/stepCount.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        stepCount = 0;
      }
      stepCount = data;
    }
  );
};

function setSpeed() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/speed.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        speed = 0;
      }
      speed = data;
      //console.log(speed);
    }
  );
};

function setFocusStatus() {
  fs.readFile(
    path.resolve(__dirname, "../custom-hds/focusStatus.txt"),
    "utf8",
    (err, data) => {
      if (err) {
        console.error(err);
        focusStatus = "";
      }
      focusStatus = data;
    }
  );
};




// end-of step-variables-initialization

// now the interesting part:

app.put("/" + secretPass, (req, res) => {
  res.sendStatus(200); // respond OK
  //console.log("New message!"); // logging the connection of a new client

  handleMessage(req.body.data); // give message data to the handleMessage function

  if (config.activateDiscordRPC && !discordRPCactive && isDiscordRunning() && !initiatingRPC) {
    initiateDiscordRPC();
  }

  if (config.activateDiscordRPC && isDiscordRunning() && discordRPCactive) {
    //console.log("updating discord rpc");
    client.updatePresence({
      
      state: 'Heartrate: ' + heartRate + "\r\n" + 'Steps: ' + stepsToday,
      details: 'Oxygen: ' + oxygenSaturation*100 + "%" + "\r\n" + 'Speed: ' + speed + "m/s",
      largeImageKey: 'logo',
      //smallImageKey: 'hrate:' + heartRate, //for later use
      smallImageKey: 'mini-logo',
      instance: true,
    });
  }

  if (config.forwardingDestination != "") { //forward the request to another server if forwardingDestination is set
    forwardReq(req.body);
  }
});

handleMessage = function (message) {
  // This function identifies the content of the passed message and processes it accordingly
  const smessage = message.toString(); // lazy variable

  if (smessage.startsWith("heartRate")) {
    // check if message received contains a Heart Rate
    hrate = smessage.substr(10, 3); // cut the messsage so that only the heart rate remains
    console.log(smessage); // logging for debug purposes

    sendWebhookHeartRate(hrate, config.webhookURL + "/messages/" + config.heartRateMessageID); // passing the heartRate to the sendWebhookHeartRate function

    if (heartRate != hrate) {
    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/hrate.txt"),
      hrate,
      (err) => {
        // write the heartRate to a file named hrate.txt
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + hrate + ' has been written succesfully!');
      }
    );
    heartRate = hrate;
    }
  } // end-of heartRate-check

  if (smessage.startsWith("oxygenSaturation")) {
    // check if message received contains a oxygenSaturation value
    oxygenSaturation = parseFloat(smessage.substr(17, 20)); // cut the messsage so that only the speed value remains
    console.log(smessage); // logging for debug purposes

    sendWebhookOxygen(oxygenSaturation, config.webhookURL + "/messages/" + config.oxygenSaturationMessageID); // passing oxygenSaturation to the sendWebhookOxygen function

    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/oxygenSaturation.txt"),
      oxygenSaturation.toString(),
      (err) => {
        // write the oxygenSaturation value to a file named oxygenSaturation.txt
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + oxygenSaturation + ' has been written succesfully!');
      }
    );
  } // end-of oxygenSaturation-check

  if (smessage.startsWith("stepCount")) {
    // check if message received contains a stepCount
    // Warning: If you want to keep your sanity
    // then don't even try to understand the following code!

    const stepCount = smessage.substr(10, 18); // cut the messsage so that only the stepCount remains
    console.log(smessage); // logging for debug purposes
    // console.log(allTimeStep);
    const stepCountInt = parseInt(stepCount); // lazy variable

    if (stepCount >= allTimeStep) {
      // when restarting a hds session your stepCount gets resetted to avoid inacurate DailySteps this part here adds the new (lower) stepCount to the old (higher) allTimeStep count
      allTimeStep = stepCountInt;
    } else {
      if (stepCountInt < lastStepValue) {
        allTimeStep += stepCountInt;
        lastStepValue = stepCountInt;
      } else {
        allTimeStep += stepCountInt - lastStepValue;
        lastStepValue = stepCountInt;
      }
    }

    stepsToday = allTimeStep - allTimeStepto0; // set the stepsToday var to the difference of allTimeStep and allTimeStepto0
    console.log("stepsToday: " + stepsToday);

    sendWebhookSteps(stepsToday, config.webhookURL + "/messages/" + config.pedoMeterMessageID); // passing the stepsToday to the sendWebhookSteps function

    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/lastStepValue.txt"),
      lastStepValue.toString(),
      (err) => {
        // write the lastStepValue to a file named lastStepValue.txt incase the server crashes or shuts down
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
      }
    );

    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/stepCount.txt"),
      allTimeStep.toString(),
      (err) => {
        // write the total stepCount to a file named stepCount.txt incase the server crashes or shuts down
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
      }
    );
  } // end-of stepCount-check

  if (smessage.startsWith("speed")) {
    // check if message received contains a speed value
    speed = smessage.substr(6, 10); // cut the messsage so that only the speed value remains
    console.log(smessage); // logging for debug purposes

    const speedNormal = Math.round(speed * 100) / 100; // round the number to 2nd decimal -- you can change this but I figured the speedValue looks more pleasant this way
    speed = speedNormal;

    sendWebhookSpeed(speedNormal, config.webhookURL + "/messages/" + config.speedMessageID); // passing speedNormal to the sendWebhookSpeed function

    if (speedCurrent != speedNormal) {
    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/speed.txt"),
      String(speedNormal),
      (err) => {
        // write the speed value to a file named speed.txt
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + speedNormal + ' has been written succesfully!');
      }
    );
    speedCurrent = speedNormal;
    }
  } // end-of speed-check

  if (smessage.startsWith("focusStatus")) {
    // check if message received contains a speed value
    focusStatus = smessage.substr(12, 22); // cut the messsage so that only the speed value remains
    console.log(smessage); // logging for debug purposes

    sendWebhookFocusStatus(focusStatus, config.webhookURL + "/messages/" + config.focusStatusMessageID); // passing focusStatus to the sendWebhookFocusStatus function

    fs.writeFileSync(
      path.resolve(__dirname, "../custom-hds/focusStatus.txt"),
      String(focusStatus),
      (err) => {
        // write the speed value to a file named speed.txt
        if (err) {
          console.error(err);
        }
        // console.log('The file with the content ' + focusStatus + ' has been written succesfully!');
      }
    );
  } // end-of focus-check
}; // end-of handleMessage()




sendWebhookHeartRate = function (hrate, webhookurl) {
  if (config.activateWebhooks && !rateLimited) {
    // check if user wants to send a webhook
  const datetime = new Date();
  const ctime =
    datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString();
  const params = {
    content: null,
    embeds: [
      {
        title: `Wie ist der aktuelle Puls von ${config.userName} ?`,
        description: "Aktueller Puls: **" + hrate + "**",
        color: 16741027,
        footer: {
          text: "custom-hds | " + version_id + " | - AlexInABox • " + ctime,
        },
      },
    ],
    attachments: [],
  };

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
};

sendWebhookOxygen = function (ovalue, webhookurl) {
  if (config.activateWebhooks && !rateLimited) {

  const datetime = new Date();
  const ctime =
    datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString();
  const params = {
    content: null,
    embeds: [
      {
        title:
          `Wie ist der aktuelle Sauerstoffgehalt in dem Blut von ${config.userName}`,
        description: "Sauerstoffgehalt: **" + ovalue * 100 + "%**",
        color: 8454143,
        footer: {
          text: "custom-hds | " + version_id + " | - AlexInABox • " + ctime,
        },
      },
    ],
    attachments: [],
  };

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
};

sendWebhookSteps = function (steps, webhookurl) {
  if (config.activateWebhooks && !rateLimited) {

  const datetime = new Date();
  const ctime =
    datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString();
  const params = {
    content: null,
    embeds: [
      {
        title: `Wie viele Schritte hat ${config.userName} heute schon bewältigt?`,
        description: "Schrittanzahl: **" + steps + "**",
        color: 15781936,
        footer: {
          text: "custom-hds | " + version_id + " | - AlexInABox • " + ctime,
        },
      },
    ],
    attachments: [],
  };

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
};

sendWebhookSpeed = function (speed, webhookurl) {
  if (config.activateWebhooks && !rateLimited) {

  const datetime = new Date();
  const ctime =
    datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString();
  const params = {
    content: null,
    embeds: [
      {
        title: `Wie schnell bewegt sich ${config.userName} gerade?`,
        description: "Live-Geschwindigkeit: **" + speed + "m/s**",
        color: 16540163,
        footer: {
          text: "custom-hds | " + version_id + " | - AlexInABox • " + ctime,
        },
      },
    ],
    attachments: [],
  };

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
};

sendWebhookFocusStatus = function (focusStatus, webhookurl) {
  if (config.activateWebhooks && !rateLimited) {
  const datetime = new Date();
  const ctime =
    datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString();
  const params = {
    content: null,
    embeds: [
      {
        title: `Was macht ${config.userName} gerade so?`,
        description: "Fokus: **" + focusStatus + "**",
        color: 4798101,
        footer: {
          text: "custom-hds | " + version_id + " | - AlexInABox • " + ctime,
        },
      },
    ],
    attachments: [],
  };

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
};

forwardReq = function (reqjson) {
  fetch(config.forwardingDestination, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(reqjson),
  });
};

// end-of WebhookSending functions
// end-of everything *finally*