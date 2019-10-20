const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const Discord = require("discord.js");
const client = new Discord.Client();
let bossTime = [];
let startTime = "";
let currentTime = "";
let sendChannel = {};

// currentTime = today.getHours() + 1 + ":" + today.getMinutes();

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listMajors);
});

function readfile() {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors);
  });
}

setInterval(readfile, 600000);
setInterval(updaterealTime, 1000);

function updaterealTime() {
  let today = new Date();
  if (today.getHours() >= 16) {
    currentTime = today.getHours() + 8 - 24 + ":" + today.getMinutes();
  } else if (today.getHours() >= 4) {
    currentTime = today.getHours() + 8 - 12 + ":" + today.getMinutes();
  } else {
    currentTime = today.getHours() + 8 + ":" + today.getMinutes();
  }
}

function parseTime(s) {
  let c = s.split(":");
  return parseInt(c[0]) * 60 + parseInt(c[1]);
}

function timetoSpawn() {
  // if (parseTime(currentTime) < 780) {
  //   return parseTime(startTime) - 720 - parseTime(currentTime);
  // } else {
  if (parseTime(currentTime) >= 660 && parseTime(startTime) <= 60) {
    return parseTime(startTime) - parseTime(currentTime) + 120;
  } else {
    return parseTime(startTime) - parseTime(currentTime);
  }
  // }
}

function notifSpawn(msg) {
  if (timetoSpawn() === 10) {
    msg.send(`FB will start in ${timetoSpawn()} minutes @everyone`);
  }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1TpJ6BdP870V1TFXTKG5kB5IAH6y23yvOKODJev38D0o",
      range: "Trang tính1!A3:G"
      // spreadsheetId: "1yDSQDWxlH6QRTkalbKcO7-X1YGzlnos_icP4l7RCXf8",
      // range: "Sheet3!A3:F"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      const rows2 = rows.slice(0, 13);
      if (rows.length) {
        bossTime = [];
        startTime = parseInt(rows2[0][4]) + ":" + rows2[0][5];
        rows2.map(row => {
          bossTime.push(`${row[0]} ${row[4]}:${row[5]}:${row[6]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}

client.on("ready", () => {
  sendChannel = client.channels.get("635140827563425842");
  setInterval(notifSpawn, 59000, sendChannel);
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply(`Pong! ${currentTime}`);
  } else if (msg.content === "time") {
    msg.channel.send(
      `${bossTime.map(x => {
        return `\n${x}`;
      })}`
    );
  } else if (
    msg.content === "reset" &&
    msg.member.id === "136850675530334208"
  ) {
    clearInterval();
    setInterval(readfile, 600000);
    setInterval(updaterealTime, 1000);
    setInterval(notifSpawn, 59000, msg);
    msg.channel.send("Done");
  } else if (msg.content === "next") {
    console.log(msg.channel);
    msg.channel.send(`Next FB will start in ${timetoSpawn()} minutes`);
  }
});

client.login("NjI2NTYwNjY4MDMxNjQ3Nzc1.XYv5Uw.r_o1NZsB3SQs9eMTuHurXVfsCEE");
