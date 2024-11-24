const fs = require("fs");
const path = require("path");

var realPresence;

class servePresence {
  constructor() {
    realPresence = require("./../../presence.json");
    initializeServer();
  }

  update() {}
}
module.exports = servePresence;

setInterval(function () {
  delete require.cache[require.resolve("./../../presence.json")];
  realPresence = require("./../../presence.json");
}, 1500);

const express = require("express");
const app = express();
const port = 80;

function initializeServer() {
  app.use(express.json());

  app.listen(port, () => {
    console.log(
      "\x1b[36m",
      "[servePresence] Now serving presence on port " + port
    );
  });

  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(realPresence));
  });
}
