const WebSocket = require('ws');                          //websocket
const fetch = require('node-fetch');                      //interact with the discord webhook
const fs = require('fs');                                 //file-write-system
const schedule = require('node-schedule');                //importing node-schedule to reset the daily stepsCounter at 0'clock
const wss = new WebSocket.Server({ port: 3476 });         //creating the server on port 3476 (thats the standard port HealthDataServer is using) 

//initializing secrets
const webhookurl = process.env['webhook']                 //normal webhook url without /messages/<message_id>
const webhookurlPatchH = process.env['webhookPatchH']
const webhookurlPatchO = process.env['webhookPatchO']
const webhookurlPatchS = process.env['webhookPatchS']
const webhookurlPatchSpeed = process.env['webhookPatchSpeed']
const secretPass = process.env['secretPass']
const webhookurlPatchH2 = process.env['webhookPatchH2']
const webhookurlPatchSpeed2 = process.env['webhookPatchSpeed2']
const webhookurlPatchS2 = process.env['webhookPatchS2']
const webhookurlPatchO2 = process.env['webhookPatchO2']

//a schedule wich resets the allTimeStepto0 counter at 0'clock
const j = schedule.scheduleJob({ hour: 0, minute: 0 }, () => {
  console.log('Job runs every day at 0:00AM');
  resetStepCount();
});

//step variables
var allTimeStep;         //all steps ever
var allTimeStepto0;      //all steps ever to 0'clock
var stepsToday;          //all steps today
var lastStepValue;   //last step value send by the watch

setallTimeStep();        //on startup get the last saved stepValue from stepCount.txt and stepCountTo0.txt
setallTimeStepTo0();
setlastStepValue()

function setallTimeStep() {

  fs.readFile('/home/runner/SmalHearth/stepCount.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStep = 0;
    }
    console.log('Setting allTimeSteps to: ' + parseInt(data));
    allTimeStep = parseInt(data);
  });
}

function setallTimeStepTo0() {

  fs.readFile('/home/runner/SmalHearth/stepCountTo0.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStepto0 = 0;
    }
    console.log('Setting allTimeStepto0 to: ' + parseInt(data));
    allTimeStepto0 = parseInt(data);
  });
}

function setlastStepValue() {

  fs.readFile('/home/runner/SmalHearth/lastStepValue.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      allTimeStep = 0;
    }
    console.log('Setting lastStepValue to: ' + parseInt(data));
    lastStepValue = parseInt(data);
  });
}

//end-of step variables


resetStepCount = function() {
  allTimeStepto0 = allTimeStep;

  sendWebhookSteps(0, webhookurlPatchS);
  fs.writeFile('/home/runner/SmalHearth/stepCountTo0.txt', allTimeStepto0.toString(), err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
};

//Server n stuff

wss.on('connection', (ws, req) => {

  console.log('I sense a new client!');       //logging the connection of a new client

  urlparam = req.url.toString();
  console.log(urlparam);

  if (urlparam != ('/?param=' + secretPass)) {
    console.log('REFUSED A CONNECTION ON: ' + urlparam);
    ws.close();
  }
  else console.log('Accepted a connection on: ' + urlparam);



  ws.on('ping', ws.pong); //ping-pong response (dunno if that even works lol)

  ws.on('message', message => { //when a message event is triggered 
    handleMessage(message); //give message data to the handleMessage function
  })
})



handleMessage = function(message) {
  const smessage = message.toString();


  if (smessage.startsWith('heartRate')) {                              //check if message received contains a Heart Rate

    const hrate = smessage.substr(10, 3);                              //cut the messsage so that only the heart rate remains
    console.log(smessage);                                             //logging for debug purposes
    sendWebhookHeartRate(hrate, webhookurlPatchH);
    sendWebhookHeartRate(hrate, webhookurlPatchH2);//passing the heartRate to the sendWebhookHeartRate function.

    fs.writeFile('/home/runner/SmalHearth/hrate.txt', hrate, err => {  //write the heart rate to a file named hrate.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + hrate + ' has been written succesfully!');
    });
  };

  if (smessage.startsWith('stepCount')) {        //check if message received contains a stepCount
    const stepCount = smessage.substr(10, 18);   //cut the messsage so that only the stepCount remains
    console.log(smessage);                       //logging for debug purposes
    console.log(allTimeStep);

    //TODO
    const stepCountInt = parseInt(stepCount);    //lazy variable

    if (stepCount >= allTimeStep) {              //when restarting a hds session your stepCount gets resetted to avoid inacurate DailySteps this part here adds the new (lower) stepCount to the old (higher) allTimeStep count
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

    stepsToday = allTimeStep - allTimeStepto0;   //set the stepsToday var to the difference of allTimeStep and allTimeStepto0
    console.log('stepsToday: ' + stepsToday);

    //END-TODO

    sendWebhookSteps(stepsToday, webhookurlPatchS);
    sendWebhookSteps(stepsToday, webhookurlPatchS2);//passing the allTimeSteps to the sendWebhookSteps function.

    fs.writeFile('/home/runner/SmalHearth/lastStepValue.txt', lastStepValue.toString(), err => {   //write the total stepCount to a file named stepCount.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
    });

    fs.writeFile('/home/runner/SmalHearth/stepCount.txt', allTimeStep.toString(), err => {   //write the total stepCount to a file named stepCount.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + stepsToday + ' has been written succesfully!');
    });
  };

  if (smessage.startsWith('speed')) {            //check if message received contains a speed value
    const speed = smessage.substr(6, 10);        //cut the messsage so that only the speed value remains
    console.log(smessage);   //logging for debug purposes

    const speedNormal = Math.round(speed * 100) / 100; //round the number to 2nd decimal

    sendWebhookSpeed(speedNormal, webhookurlPatchSpeed);
    sendWebhookSpeed(speedNormal, webhookurlPatchSpeed2);

    fs.writeFile('/home/runner/SmalHearth/speed.txt', speed, err => {           //write the speed value to a file named speed.txt
      if (err) {
        console.error(err);
      }
      //console.log('The file with the content ' + speed + ' has been written succesfully!');
    });
  };

  if (smessage.startsWith('oxygenSaturation')) {         //check if message received contains a oxygenSaturation value
    const oxygenSaturation = parseFloat(smessage.substr(17, 20));
    console.log(smessage);
    sendWebhookOxygen(oxygenSaturation, webhookurlPatchO);
    sendWebhookOxygen(oxygenSaturation, webhookurlPatchO2);

    fs.writeFile('/home/runner/SmalHearth/oxygenSaturation.txt', oxygenSaturation.toString(), err => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    });
  };
};



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
    "username": "HeartRate",
    "avatar_url": "https://raw.githubusercontent.com/Rexios80/Health-Data-Server-Overlay/master/assets/images/icon.png",
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
    "username": "OxygenSaturation",
    "avatar_url": "https://tinypic.host/images/2022/07/25/82936B2B-A7E2-4A76-A35F-045467E356A7.png",
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
    "username": "Pedometer",
    "avatar_url": "https://tinypic.host/images/2022/07/27/peodometer_icon.png",
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
    "username": "Speed",
    "avatar_url": "https://tinypic.host/images/2022/07/27/tacho_icon-1.png",
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