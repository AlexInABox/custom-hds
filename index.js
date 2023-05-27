const express = require('express');
const app = express();
app.use(express.json());
const fetch = require("node-fetch"); // interact with the discord webhook
const fs = require("fs"); // file-write-system
const path = require("path"); // used to get the relative path the file is placed in
const life360 = require('life360-node-api'); // life360 api
var cheerio = require('cheerio'); //netflix related
var requestOptions = {
  method: 'GET',
};

var config = require('./config.json');
var healthData = require('./healthData.json');
var packagejson = require('./package.json');
async function updateJSON() {
  console.log("\x1b[34m", "Updating JSON files...");
  fs.writeFileSync(
    path.resolve(__dirname, "./healthData.json"),
    JSON.stringify(healthData, null, 2),
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );
  fs.writeFileSync(
    path.resolve(__dirname, "./config.json"),
    JSON.stringify(config, null, 2),
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );
  fs.writeFileSync(
    path.resolve(__dirname, "./package.json"),
    JSON.stringify(packagejson, null, 2),
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );
}
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
process.env.TZ = config.timezone;
const secretPass = config.secretPass;

/*
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||    from here on: dont change anything unless you know what you are doing!    ||||          (not that i know what im doing but whatever)
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/

// a schedule wich resets the allTimeStepto0 counter at 0'clock

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

startupWrapper();
async function startupWrapper() {
  await startup();
  discordStartup();
  console.log("Starting server on port: " + config.port);
  app.listen(config.port, () => { console.log("\x1b[32m", 'Server is up and running!') }) // creating the server

  console.log("\x1b[0m", "Startup complete! \n\n");

  console.log("\x1b[0m", "Fetching initial data...");
  fetchLocation()
  fetchNetflix()
  fetchValorant()
  setallTimeStep(); // on startup get the last saved stepValues from stepCount.txt, lastStepValue.txt and stepCountTo0.txt
  setallTimeStepTo0();
  setlastStepValue();
  setHeartRate();
  setOxygenSaturation();
  setStepCount();
  setSpeed();
  setFocusStatus();
}

async function discordStartup() {
  if (!config.activateDiscordRPC) {
    console.log("\x1b[31m", "Discord RPC is disabled!");
  } else console.log("\x1b[32m", "Discord RPC is enabled! Searching for Discord...");
  if (config.activateDiscordRPC && isDiscordRunning()) {
    console.log("\x1b[0m", "Trying to connect to Discord...");
    initiateDiscordRPC();
  } else console.log("\x1b[31m", "Discord RPC could not be activated!");
}

async function initiateDiscordRPC() {
  try {
    console.log("Discord is running, starting DiscordRPC");
    initiatingRPC = true; // a lock variable to prevent multiple RPCs from being initiated
    await sleep(14000); // wait 14 seconds to make sure discord is fully loaded
    client = require('discord-rich-presence')(config.discordAppID);
    discordRPCactive = true;
    console.log("\x1b[32m", "Discord RPC is active!");
  } catch (error) {
    console.log("\x1b[31m", "Discord RPC could not be activated!");
  }
  //initiatingRPC stays true so the RPC wont be initiated again

}

async function startup() {

  console.log("Starting up...");
  if (config.forwardingDestination == "") {
    console.log("\x1b[31m", "No forwarding destination set, forwarding is disabled");
  } else console.log("\x1b[32m", "Forwarding all incomming requests to: " + config.forwardingDestination);
  if (!config.activateWebhooks) {
    console.log("\x1b[31m", "Webhooks are disabled!");
  } else console.log("\x1b[32m", "Webhooks are enabled!");
  /*
  if (config.NETFLIX_COOKIE.startsWith("OptanonAlertBoxClosed")) {
    console.log("\x1b[31m", "Reformatting Netflix Cookie...");
    config.NETFLIX_COOKIE = reformatNetflixCookie(config.NETFLIX_COOKIE);
  }
  */

  await checkConfig();
  updateJSON();
  if (!config.activateLocationFetching) {
    console.log("\x1b[31m", "Location fetching is disabled!");
  } else console.log("\x1b[32m", "Location fetching is enabled!");
  if (!config.activateNetflixFetching) {
    console.log("\x1b[31m", "Netflix fetching is disabled!");
  } else console.log("\x1b[32m", "Netflix fetching is enabled!");
}

async function checkConfig() {
  if (config.discordAppID == "" && config.activateDiscordRPC) {
    console.log("\x1b[31m", "No Discord AppID set, using default AppID!")
    config.discordAppID = "1033806008008581240";
  }
  if (config.webhookURL == "" && config.activateWebhooks) {
    console.log("\x1b[31m", "No Webhook URL set, Webhooks are disabled!")
    config.activateWebhooks = false;
  }
  if (config.timezone == "") {
    console.log("\x1b[31m", "No timezone set, using Europe/Amsterdam as default!")
    config.timezone = "Europe/Amsterdam";
    process.env.TZ = config.timezone;
  }
  if (config.port == "") {
    console.log("\x1b[31m", "No port set, using 3476 as default!")
    config.port = 3476;
  }
  if (config.data_save_type == "") {
    console.log("\x1b[31m", "No data_save_type set, using both as default!")
    config.data_save_type = "both";
  }
  if (config.data_save_type != "both" && config.data_save_type != "txt" && config.data_save_type != "json") {
    console.log("\x1b[31m", "Invalid data_save_type set, using both as default!")
    config.data_save_type = "both";
  }
  if ((config.GEOAPIFY_API_KEY == "" | config.LIFE360_USERNAME == "" | config.LIFE360_PASSWORD == "") && config.activateLocationFetching) {
    console.log("\x1b[31m", "No GEOAPIFY_API_KEY, LIFE360_USERNAME or LIFE360_PASSWORD set, location fetching is disabled!")
    config.activateLocationFetching = false;
  }
  if (config.NETFLIX_COOKIE == "" && config.activateNetflixFetching) {
    console.log("\x1b[31m", "No Netflix cookie set, Netflix fetching is disabled!")
    config.activateNetflixFetching = false;
  }
  if ((config.valorant.riotID == "" | config.valorant.riotTag == "" | config.valorant.region == "") && config.valorant.active) {
    console.log("\x1b[31m", "No Valorant RiotID, RiotTag or Region set, Valorant fetching is disabled!")
    config.valorant.active = false;
  }
  if (config.valorant.riotPUUID == "" && config.valorant.active) {
    console.log("\x1b[31m", "No Valorant riotPUUID set, fetching it now...")
    await getValorantPUUID();
  }
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
  if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
  }
  if (config.data_save_type == "both" || config.data_save_type == "json") {
    heartRate = healthData.heartRate;
  }
};

function setOxygenSaturation() {
  if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
  }
  if (config.data_save_type == "both" || config.data_save_type == "json") {
    oxygenSaturation = healthData.oxygenSaturation;
  }
};

function setStepCount() {
  if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
  }
  if (config.data_save_type == "both" || config.data_save_type == "json") {
    stepCount = healthData.stepCount;
  }
};

function setSpeed() {
  if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
  }
  if (config.data_save_type == "both" || config.data_save_type == "json") {
    speed = healthData.speed;
  }
};

function setFocusStatus() {
  if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
  }
  if (config.data_save_type == "both" || config.data_save_type == "json") {
    focusStatus = healthData.focusStatus;
  }
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
      details: 'Oxygen: ' + oxygenSaturation * 100 + "%" + "\r\n" + 'Speed: ' + speed + "m/s",
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
    console.log("\x1b[34m", smessage); // logging for debug purposes

    sendWebhookHeartRate(hrate, config.webhookURL + "/messages/" + config.heartRateMessageID); // passing the heartRate to the sendWebhookHeartRate function

    if (heartRate != hrate) {
      // check if the heartRate has changed since the last message

      if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
      }
      if (config.data_save_type == "both" || config.data_save_type == "json") {
        healthData.heartRate = hrate;
        updateJSON();
      }
      heartRate = hrate;
    }
  } // end-of heartRate-check

  if (smessage.startsWith("oxygenSaturation")) {
    // check if message received contains a oxygenSaturation value
    oxygenSaturation = parseFloat(smessage.substr(17, 20)); // cut the messsage so that only the speed value remains
    console.log("\x1b[34m", smessage); // logging for debug purposes

    sendWebhookOxygen(oxygenSaturation, config.webhookURL + "/messages/" + config.oxygenSaturationMessageID); // passing oxygenSaturation to the sendWebhookOxygen function

    if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
    }
    if (config.data_save_type == "both" || config.data_save_type == "json") {
      healthData.oxygenSaturation = oxygenSaturation;
    }
  } // end-of oxygenSaturation-check

  if (smessage.startsWith("stepCount")) {
    // check if message received contains a stepCount
    // Warning: If you want to keep your sanity
    // then don't even try to understand the following code!

    const stepCount = smessage.substr(10, 18); // cut the messsage so that only the stepCount remains
    console.log("\x1b[34m", smessage); // logging for debug purposes
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
    console.log("\x1b[34m", "stepsToday: " + stepsToday);

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
    console.log("\x1b[34m", smessage); // logging for debug purposes

    const speedNormal = Math.round(speed * 100) / 100; // round the number to 2nd decimal -- you can change this but I figured the speedValue looks more pleasant this way
    speed = speedNormal;

    sendWebhookSpeed(speedNormal, config.webhookURL + "/messages/" + config.speedMessageID); // passing speedNormal to the sendWebhookSpeed function

    if (speedCurrent != speedNormal) {
      if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
      }
      if (config.data_save_type == "both" || config.data_save_type == "json") {
        healthData.speed = speedNormal;
      }
      speedCurrent = speedNormal;
    }
  } // end-of speed-check

  if (smessage.startsWith("focusStatus")) {
    // check if message received contains a speed value
    focusStatus = smessage.substr(12, 22); // cut the messsage so that only the speed value remains
    console.log("\x1b[34m", smessage); // logging for debug purposes

    sendWebhookFocusStatus(focusStatus, config.webhookURL + "/messages/" + config.focusStatusMessageID); // passing focusStatus to the sendWebhookFocusStatus function

    if (config.data_save_type == "both" || config.data_save_type == "txt") {
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
    }
    if (config.data_save_type == "both" || config.data_save_type == "json") {
      healthData.focusStatus = focusStatus;
    }
  } // end-of focus-check
  updateJSON(); // update the JSON file
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
// start of locationFetching logic
async function fetchLocation() {
  if (!config.activateLocationFetching) return;

  console.log("\x1b[34m", "Fetching location...");
  var user;

  for (var i = 0; i < 5; i++) { //The API is a bit unstable, so we try to login 5 times before giving up
    try {
      let client = await life360.login(config.LIFE360_USERNAME, config.LIFE360_PASSWORD)

      let circles = await client.listCircles()

      user = (await circles[0].listMembers())[0];
      break;
    } catch (e) {
      if (i == 4) {
        console.log("\x1b[32m", "Failed to login after 5 attempts, exiting...")
        return;
      }
      console.log("\x1b[32m", "Something went wrong, retrying... (" + (i + 1) + " / 5)")
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  await fetch("https://api.geoapify.com/v1/geocode/reverse?lat=" + user.location.latitude + "&lon=" + user.location.longitude + "&apiKey=" + config.GEOAPIFY_API_KEY, requestOptions)
    .then(response => response.json())
    .then(result => {
      healthData.location.district = result.features[0].properties.district
      healthData.location.city = result.features[0].properties.city
      healthData.location.country = result.features[0].properties.country
      healthData.location.latitude = String(result.features[0].properties.lat)
      healthData.location.longitude = String(result.features[0].properties.lon)
    }
    )
    .catch(error => console.log("\x1b[32m", 'error', error));

  console.log("\x1b[34m", "Successfully fetched location!")
  updateJSON();
}
setInterval(function () { fetchLocation() }, 900000); //Update location every 15 minutes
// end-of locationFetching logic
// start-of netflixFetching logic

async function fetchNetflix() {
  if (!config.activateNetflixFetching) return;

  console.log("\x1b[34m", "Fetching latest Netflix stream...")

  var history_url = "https://www.netflix.com/viewingactivity?raw";
  var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36(KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    'Cookie': config.NETFLIX_COOKIE
  };


  await fetch(history_url, {
    headers: headers
  })
    .then(res => res.text())
    .then(body => {
      try {

        var $ = cheerio.load(body);
        healthData.netflix.lastWatched.title = $('.col.title').first().find('a').text();
        healthData.netflix.lastWatched.showId = $('.col.title').first().find('a').attr('href').split('/')[2]; // "/title/80100172" -> "80100172"
        healthData.netflix.lastWatched.date = $('.col.date').first().text();
      } catch (e) {
        console.log("\x1b[31m", "Failed to fetch Netflix data, probably because the cookie expired.")
        //TODO: Send a webhook message to the user to inform them that the cookie expired
        //or
        //TODO: Refresh the cookie automatically
        return;
      }
    });
  console.log("\x1b[34m", "Successfully fetched latest Netflix stream!")
  updateJSON();
}
setInterval(function () { fetchNetflix() }, 900000); //Update netflix every 15 minutes


// end-of netflixFetching logic

// start-of valorantFetching logic

async function fetchValorant() {
  if (!config.valorant.active) return;
  //initially set the username
  healthData.valorant.username = config.valorant.riotID + "#" + config.valorant.riotTag;
  updateJSON();
  console.log("\x1b[34m", "Fetching latest Valorant MMR...")

  //Here we try to fetch the Valorant MMR using the PUUID, if that fails we try to fetch it using the username as a fallback.
  //When using the username as a fallback we have to fetch the PUUID first, so we call the getValorantPUUID() function.
  //TODO: Only validate the PUUID once, because once we have it we can use it forever. (even if the username changes) ((configcheck))
  try {
    console.log("\x1b[34m", "Fetching Valorant MMR using PUUID...")
    await getValorantRankUsingPUUID();
  } catch (e) {
    console.log("\x1b[31m", "Failed to fetch Valorant MMR using PUUID: " + e)
    try {
      console.log("\x1b[34m", "Fetching Valorant MMR using Name...")
      await getValorantRankUsingName();
    }
    catch (e) {
      console.log("\x1b[31m", "Failed to fetch Valorant MMR using Name: " + e)
    }
  }
  try {
    getValorantTagID();
  }
  catch (e) {
    console.log("\x1b[31m", "Failed to fetch Valorant TagID: " + e)
  }
  console.log("\x1b[34m", "Successfully fetched latest Valorant MMR!")
}

async function getValorantRankUsingPUUID() {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${config.valorant.region}/${config.valorant.riotPUUID}`, requestOptions)
    .then(res => {
      //check if the response is valid
      if (res.status != 200) {
        throw "Server responded with: " + response.status + ". Check your config.json file!";
      }
      return res.text();
    })
    .then(result => {
      var result = JSON.parse(result);
      healthData.valorant.elo = result.data.ranking_in_tier + "RR."
      healthData.valorant.rank = result.data.currenttier_patched;
    })
    .catch(error => {
      throw error;
    });
}

async function getValorantRankUsingName() {
  //get puuid using https://api.henrikdev.xyz/valorant/v1/account/{id}/{tag}
  //then use getValorantRankUsingPUUID()

  fetch(`https://api.henrikdev.xyz/valorant/v1/account/${config.valorant.riotID}/${config.valorant.riotTag}`, requestOptions)
    .then(res => {
      //check if the response is valid
      if (res.status != 200) {
        throw "Server responded with: " + response.status + ". Check your config.json file!";
      }
      return res.text();
    })
    .then(result => {
      var result = JSON.parse(result);
      config.valorant.riotPUUID = result.data.puuid;
      console.log("\x1b[34m", "Successfully fetched Valorant PUUID!" + "\n" + "PUUID: " + config.valorant.riotPUUID)
      updateJSON();
      getValorantRankUsingPUUID();
    })
    .catch(error => console.log("\x1b[31m", 'Error while trying to fetch Valorant PUUID: \"' + error + "\""));

}

setInterval(function () { fetchValorant() }, (config.valorant.updateInterval * 1000)); //Update valorant every x seconds

async function getValorantPUUID() {
  if (!config.valorant.active) return;

  console.log("\x1b[34m", "Fetching Valorant PUUID...")
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  //using https://api.henrikdev.xyz/valorant/v1/account/{id}/{tag} to get the PUUID

  fetch(`https://api.henrikdev.xyz/valorant/v1/account/${config.valorant.riotID}/${config.valorant.riotTag}`, requestOptions)
    .then(res => {
      //check if the response is valid
      if (res.status != 200) {
        throw "Server responded with: " + response.status + ". Check your config.json file!";
      }
      return res.text();
    })
    .then(result => {
      var result = JSON.parse(result);
      config.valorant.riotPUUID = result.data.puuid;
      console.log("\x1b[34m", "Successfully fetched Valorant PUUID!" + "\n" + "PUUID: " + config.valorant.riotPUUID)
      updateJSON();
    })
    .catch(error => console.log("\x1b[31m", 'Error while trying to fetch Valorant PUUID: \"' + error + "\""));
}

async function getValorantTagID() {
  if (!config.valorant.active) return;

  console.log("\x1b[34m", "Fetching Valorant TagID...")
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  //using https://api.henrikdev.xyz/valorant/v1/by-puuid/account/a47649bd-3ee1-54c2-b598-e5456f50dd98 to get the TagID

  fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/account/${config.valorant.riotPUUID}`, requestOptions)
    .then(res => {
      //check if the response is valid
      if (res.status != 200) {
        throw "Server responded with: " + response.status + ". Check your config.json file!";
      }
      return res.text();
    }
    )
    .then(result => {
      var result = JSON.parse(result);
      config.valorant.riotID = result.data.name;
      config.valorant.riotTag = result.data.tag;
      config.valorant.region = result.data.region;

      healthData.valorant.username = config.valorant.riotID + "#" + config.valorant.riotTag;
      console.log("\x1b[34m", "Successfully fetched Valorant TagID!" + "\n" + "TagID: " + config.valorant.riotID + "#" + config.valorant.riotTag);
      updateJSON();
    })
    .catch(error => console.log("\x1b[31m", 'Error while trying to fetch Valorant TagID: \"' + error + "\""));
}
// end-of valorantFetching logic

// end-of everything