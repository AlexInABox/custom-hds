const WebSocket = require('ws');                          //websocket
const fetch = require('node-fetch');                      //interact with the discord webhook
const fs = require('fs');                                 //file-write-system
const path = require("path");                             //used to get the relative path the file is placed in
const schedule = require('node-schedule');                //importing node-schedule to reset the daily stepsCounter at 0'clock
const wss = new WebSocket.Server({ port: 3476 });         //creating the server on port 3476 (thats the standard port HealthDataServer is using) 

//initializing secrets -- here edit every constant as you will
//const webhookurl = ''                //normal webhook url without /messages/<message_id>
const webhookurlPatchH = ''
const webhookurlPatchO = ''
const webhookurlPatchS = ''
const webhookurlPatchSpeed = ''
//server 2 webhooks -- you need to set them rn or the server crashes (its okay to just use the same webhooks)
const webhookurlPatchH2 = ''
const webhookurlPatchSpeed2 = ''
const webhookurlPatchS2 = ''
const webhookurlPatchO2 = ''

const secretPass = 'whydoiexist'; //<-------------- set a secret param like this
//end-of secrets


/*
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||    from here on: dont change anything unless you know what you are doing!    ||||          (not that i know what im even doing lol)
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
*/



//a schedule wich resets the allTimeStepto0 counter at 0'clock
const whatevenisreality = schedule.scheduleJob({ hour: 0, minute: 0 }, () => {
  console.log('Job runs every day at 0:00AM');
  resetStepCount();
});


resetStepCount = function() {
  allTimeStepto0 = allTimeStep;

  sendWebhookSteps(0, webhookurlPatchS);  //reset the webhook value manually incase the watch is not active
  fs.writeFile(path.resolve(__dirname, "../custom-hds/stepCountTo0.txt"), allTimeStepto0.toString(), err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
};
//end-of schedule

//step-variables-initialization
var allTimeStep;         //all steps ever
var allTimeStepto0;      //all steps ever to 0'clock
var stepsToday;          //all steps today
var lastStepValue;       //last step value sent by the watch

setallTimeStep();        //on startup get the last saved stepValues from stepCount.txt, lastStepValue.txt and stepCountTo0.txt
setallTimeStepTo0();
setlastStepValue();

function setallTimeStep() {

  fs.readFile(path.resolve(__dirname, "../custom-hds/stepCount.txt"), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStep = 0;
    }
    console.log('Setting allTimeSteps to: ' + parseInt(data));
    allTimeStep = parseInt(data);
  });
}

function setallTimeStepTo0() {

  fs.readFile(path.resolve(__dirname, "../custom-hds/stepCountTo0.txt"), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStepto0 = 0;
    }
    console.log('Setting allTimeStepto0 to: ' + parseInt(data));
    allTimeStepto0 = parseInt(data);
  });
}

function setlastStepValue() {

  fs.readFile(path.resolve(__dirname, "../custom-hds/lastStepValue.txt"), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStep = 0;
    }
    console.log('Setting lastStepValue to: ' + parseInt(data));
    lastStepValue = parseInt(data);
  });
}

//end-of step-variables-initialization



//now the interesting part:

wss.on('connection', (ws, req) => {

  console.log('I sense a new client!');                        //logging the connection of a new client

  urlparam = req.url.toString();                               //saving the url parameter the client connected with (wss://ip/path?param=realityfeelsslippery)
  console.log(urlparam);                                       //logging the url (param)

  if (urlparam != ('/?param=' + secretPass)) {                 //check if the url parameter provided equal to our secret password
    console.log('REFUSED A CONNECTION ON: ' + urlparam);       //if thats not the case we close the connection
    ws.close();
  }
  else console.log('Accepted a connection on: ' + urlparam);   //if the parameter is right we keep the connection alive and start listening to sent messages



  ws.on('ping', ws.pong);                                      //ping-pong response (dunno if that even works lol)

  ws.on('message', message => {                                //when a message event is triggered
    handleMessage(message);                                    //give message data to the handleMessage function
  })
})



handleMessage = function(message) {                                        //This function identifies the content of the passed message and processes it accordingly

  const smessage = message.toString();                                     //lazy variable

  if (smessage.startsWith('heartRate')) {                                  //check if message received contains a Heart Rate
    const hrate = smessage.substr(10, 3);                                  //cut the messsage so that only the heart rate remains
    console.log(smessage);                                                 //logging for debug purposes
    sendWebhookHeartRate(hrate, webhookurlPatchH);                         //passing the heartRate to the sendWebhookHeartRate function
    sendWebhookHeartRate(hrate, webhookurlPatchH2);                        //passing the heartRate to the sendWebhookHeartRate function (with a different webhook url)

    fs.writeFile(path.resolve(__dirname, "../custom-hds/hrate.txt"), hrate, err => {  //write the heartRate to a file named hrate.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + hrate + ' has been written succesfully!');
    });
  }; //end-of heartRate-check

  if (smessage.startsWith('oxygenSaturation')) {                           //check if message received contains a oxygenSaturation value
    const oxygenSaturation = parseFloat(smessage.substr(17, 20));          //cut the messsage so that only the speed value remains
    console.log(smessage);                                                 //logging for debug purposes

    sendWebhookOxygen(oxygenSaturation, webhookurlPatchO);                 //passing oxygenSaturation to the sendWebhookOxygen function
    sendWebhookOxygen(oxygenSaturation, webhookurlPatchO2);                //passing oxygenSaturation to the sendWebhookOxygen function (with a different webhookurl)

    fs.writeFile(path.resolve(__dirname, "../custom-hds/oxygenSaturation.txt"), oxygenSaturation.toString(), err => {    //write the oxygenSaturation value to a file named oxygenSaturation.txt
      if (err) {
        console.error(err);
      };
      //console.log('The file with the content ' + oxygenSaturation + ' has been written succesfully!');
    });
  }; //end-of oxygenSaturation-check

  if (smessage.startsWith('stepCount')) {                                  //check if message received contains a stepCount

    //Warning: If you want to keep your sanity 
    //then don't even try to understand the following code!

    const stepCount = smessage.substr(10, 18);                             //cut the messsage so that only the stepCount remains
    console.log(smessage);                                                 //logging for debug purposes
    //console.log(allTimeStep);
    const stepCountInt = parseInt(stepCount);                              //lazy variable

    if (stepCount >= allTimeStep) {                                        //when restarting a hds session your stepCount gets resetted to avoid inacurate DailySteps this part here adds the new (lower) stepCount to the old (higher) allTimeStep count
      allTimeStep = stepCountInt;
    }
    else {
      if (stepCountInt < lastStepValue) {
        allTimeStep += stepCountInt;
        lastStepValue = stepCountInt;
      }
      else {
        allTimeStep += stepCountInt - lastStepValue;
        lastStepValue = stepCountInt;
      }
    }

    stepsToday = allTimeStep - allTimeStepto0;                             //set the stepsToday var to the difference of allTimeStep and allTimeStepto0
    console.log('stepsToday: ' + stepsToday);

    sendWebhookSteps(stepsToday, webhookurlPatchS);                        //passing the stepsToday to the sendWebhookSteps function
    sendWebhookSteps(stepsToday, webhookurlPatchS2);                       //passing the stepsToday to the sendWebhookSteps function (with a different webhookurl)

    fs.writeFile(path.resolve(__dirname, "../custom-hds/lastStepValue.txt"), lastStepValue.toString(), err => {   //write the lastStepValue to a file named lastStepValue.txt incase the server crashes or shuts down
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
    });

    fs.writeFile(path.resolve(__dirname, "../custom-hds/stepCount.txt"), allTimeStep.toString(), err => {   //write the total stepCount to a file named stepCount.txt incase the server crashes or shuts down
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
    });
  }; //end-of stepCount-check

  if (smessage.startsWith('speed')) {                                      //check if message received contains a speed value
    const speed = smessage.substr(6, 10);                                  //cut the messsage so that only the speed value remains
    console.log(smessage);                                                 //logging for debug purposes

    const speedNormal = Math.round(speed * 100) / 100;                     //round the number to 2nd decimal -- you can change this but I figured the speedValue looks more pleasant this way

    sendWebhookSpeed(speedNormal, webhookurlPatchSpeed);                   //passing speedNormal to the sendWebhookSpeed function
    sendWebhookSpeed(speedNormal, webhookurlPatchSpeed2);                  //passing speedNormal to the sendWebhookSpeed function (with a different webhookurl)

    fs.writeFile(path.resolve(__dirname, "../custom-hds/speed.txt"), speedNormal, err => {     //write the speed value to a file named speed.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + speedNormal + ' has been written succesfully!');
    });
  }; //end-of speed-check
}; //end-of handleMessage()



//WebhookSending functions

sendWebhookHeartRate = function(hrate, webhookurl) {
  process.env.TZ = 'Europe/Amsterdam';
  var datetime = new Date();
  const ctime = datetime.toLocaleDateString() + ' ' + datetime.toLocaleTimeString();
  var params = {
    "content": null,
    "embeds": [
      {
        "title": "Wie ist der aktuelle Puls von @cooler_Alex ?",
        "description": "Aktueller Puls: **" + hrate + "**",
        "color": 16741027,
        "footer": {
          "text": ctime
        }
      }
    ],
    "attachments": []
  }




  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
  })
};

sendWebhookOxygen = function(ovalue, webhookurl) {
  process.env.TZ = 'Europe/Amsterdam';
  var datetime = new Date();
  const ctime = datetime.toLocaleDateString() + ' ' + datetime.toLocaleTimeString();
  var params = {
    "content": null,
    "embeds": [
      {
        "title": "Wie ist der aktuelle Sauerstoffgehalt in dem Blut von @cooler_Alex?",
        "description": "Sauerstoffgehalt: **" + (ovalue * 100) + "%**",
        "color": 8454143,
        "footer": {
          "text": ctime
        }
      }
    ],
    "attachments": []
  }

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
  })
};

sendWebhookSteps = function(steps, webhookurl) {
  process.env.TZ = 'Europe/Amsterdam';
  var datetime = new Date();
  const ctime = datetime.toLocaleDateString() + ' ' + datetime.toLocaleTimeString();
  var params = {
    "content": null,
    "embeds": [
      {
        "title": "Wie viele Schritte hat @cooler_Alex heute schon bewältigt?",
        "description": "Schrittanzahl: **" + steps + "**",
        "color": 15781936,
        "footer": {
          "text": ctime
        }
      }
    ],
    "attachments": []
  }

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
  })
};

sendWebhookSpeed = function(speed, webhookurl) {
  process.env.TZ = 'Europe/Amsterdam';
  var datetime = new Date();
  const ctime = datetime.toLocaleDateString() + ' ' + datetime.toLocaleTimeString();
  var params = {
    "content": null,
    "embeds": [
      {
        "title": "Wie schnell bewegt sich @cooler_alex gerade?",
        "description": "Live-Geschwindigkeit: **" + speed + "m/s**",
        "color": 16540163,
        "footer": {
          "text": ctime
        }
      }
    ],
    "attachments": []
  }

  fetch(webhookurl, {
    method: "PATCH",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
  })
};

//end-of WebhookSending functions
/*end-of everything 
                      finally it's over, felt like torture didn't it? welp, that was my code. 
                      If for some fucked up reason you enjoyed reading this, let me tell you this: 
                      Thank you, but you should seek help as ASAP. Reading this code now, I'm having multiple strokes at once and lost count around line 50. 
                      Thx for reading to the end, kind stranger ~ alex
*/