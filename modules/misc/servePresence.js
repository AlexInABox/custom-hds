const fs = require("fs");
const path = require("path");

let realPresence;

class servePresence {
  constructor() {
    realPresence = loadPresence();
    initializeServer();
  }

  update() {}
}
module.exports = servePresence;

const express = require("express");
const app = express();
const port = 80;

function loadPresence() {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "./../../presence.json"),
      "utf8"
    );
    return JSON.parse(data);
  } catch (err) {
    console.error(
      "\x1b[36m",
      "[servePresence] Failed to reload presence " + err
    );
    return {}; // Return an empty object if the file fails to load
  }
}
setInterval(function () {
  realPresence = loadPresence();
}, 1500);

function initializeServer() {
  // Middleware to add CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Access-Control-Allow-Methods", "GET"); // Allowed HTTP methods
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    ); // Allowed headers
    next();
  });

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
