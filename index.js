const fs = require('fs');
const {google} = require('googleapis');
const Express = require('express');

const port = process.env.PORT || 3000

var app = Express()
var oAuth2Client;

const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(calendarId, callback) {
  const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
  calendar.events.list({
    calendarId: calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    callback(res.data.items);
    // if (events.length) {
    //   return events.map((event, i) => {
    //     const start = event.start.dateTime || event.start.date;
    //     console.log(`${start} - ${event.summary}`);
    //   });
    // } else {
    //   return console.log("No upcoming events found.");
    // }
  });
}

app.listen(port, () => {
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.error(err.message);
    credentials = JSON.parse(content);
    const {client_id, client_secret, redirect_uris } = credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    console.log(`Listening on port ${port}...`);
  });
});

app.get("/", (req, res) => {
  res.redirect('/api/authorize');
});

app.get("/api/authorize", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  // TODO automate redirection to authUrl
  res.send(authUrl);
});

// Redirect URI
app.get("/auth", (req, res) => {
  const {code, scopes} = req.query;
  oAuth2Client.getToken(code, (err, token) => {
    oAuth2Client.setCredentials(token);
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log('Token written to', TOKEN_PATH);
      res.redirect('/home');
    });
  });
});

app.get("/home", (req, res) => {
  const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
  calendar.calendarList.list({ showHidden: true })
  .then(calendar => {
    const matches = calendar.data.items.filter((cal) => {
      return cal.summary === '2020 Spring'
    });
    const sp2020 = matches[0].id;
    listEvents(sp2020, (events) => {
      if (events.length) {
        console.log(events);
        res.json(events);
      } else {
        res.send("No upcoming events.");
      }
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
});