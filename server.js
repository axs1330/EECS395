const fs = require('fs');
const Promise = require('promise');
const Express = require('express');
const {google} = require('googleapis');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const port = process.env.PORT || 3000;

const CONNECTION_URL = 'mongodb://root:admin@localhost:27017?authMechanism=DEFAULT&authSource=admin';
const DATABASE_NAME = 'admin';

const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email'
];

var app = Express();
var oAuth2Client;

app.listen(port, () => {
  // Connect to MongoDB server
  MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    const db = client.db(DATABASE_NAME);
    usersCursor = db.collection('users');
    groupsCursor = db.collection('groups');
    console.log(`Connected to db ${DATABASE_NAME}`);
  });

  // Read credentials file for OAuth client
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.error(err.message);
    credentials = JSON.parse(content);
    const {client_id, client_secret, redirect_uris } = credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    console.log(`Listening on port ${port}...`);
  });
});

app.get("/", (req, res) => {
  // TODO
  /*
  - button will direct user to authorization page
  - check if we have user access token? if so, redirect to /home
  */
  res.redirect('/api/authorize');
});

app.get("/api/authorize", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    // TODO update calendar data while user is logged off using refresh token
    // access_type: 'offline',
    // consent: 'prompt',
    access_type: 'online',
    scope: SCOPES
  });
  // Redirect to /auth
  res.redirect(authUrl);
});

app.get("/auth", (req, res) => {
  const {code, scopes} = req.query;
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error(err);
    // TODO remove after debugging
    console.log(token);
    oAuth2Client.setCredentials(token);
    // Store token with corresponding user
    // TODO important to store refresh token when that is implemented
    google.oauth2("v2").userinfo.v2.me.get({auth: oAuth2Client}, (err, profile) => {
      if (err) return console.error(err);
      const query = { _id: profile.data.email }
      usersCursor.updateOne(query, { $set: { token: token } }, (err, result) => {
        if (err) return res.status(500).send(err);
        res.redirect('/home');
      });
    });
  });
});

app.get("/home", (req, res) => {
  allMemberEventsOfGroup('395')
  .then(events => res.json(events))
  .catch(err => res.status(500).send(err));
});

// TODO filter members
/**
 * Returns a promise that returns all events of all members in the group with the given ID.
 * @param {string} groupId the ID of the group from which to retrieve events
 */
function allMemberEventsOfGroup(groupId) {
  return usersOfGroup(groupId)
  .then(users => {
    return Promise.all(users.map(u => calendarsOfUser(u)))
    .then(calendarLists => {
      return Promise.all(calendarLists.map((calendars, i) => {
        return Promise.all(calendars.map(c => eventsFromCalendar(c, users[i])))
        // TODO remove if we need to merge all events to be sorted
        .then(events => events.flat());
      }));
    })
    .catch(err => console.error(err));
  })
  .catch(err => console.error(err));
}

/**
 * Returns a promise that returns all users in the group with the given ID.
 * @param {string} groupId the ID of the specified group
 */
function usersOfGroup(groupId) {
  return groupsCursor.findOne({ _id: groupId })
  .then(group => usersCursor.find({ _id: { $in: group.members } }).toArray())
  .catch(err => console.error(err));
}

/**
 * Returns a promise that returns all calendars of the given user.
 * @param {*} user the user from which to retrieve calendars
 */
function calendarsOfUser(user) {
  const token = user.token;
  if (!token) {
    console.error(`Could not find token for user ${user._id}`);
    return [];
  }
  oAuth2Client.setCredentials(token);
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  // TODO calendar filtering from user_prefs
  return googleCalendar.calendarList.list()
  .then(calendar => calendar.data.items)
  .catch(err => console.error(err));
}

/**
 * Returns a promise that returns upcoming events from the given calendar of the given user.
 * @param {*} calendar the Google calendar from which to retrieve events
 * @param {*} user the user whose token is to be used
 */
function eventsFromCalendar(calendar, user) {
  const token = user.token;
  if (!token) {
    console.error(`Could not find token for user ${user._id}`);
    return [];
  }
  oAuth2Client.setCredentials(token);
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  return googleCalendar.events.list({
    calendarId: calendar.id,
    timeMin: (new Date()).toISOString(),
    // TODO use timeMax instead of maxResults
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime'
  })
  .then(eventList => eventList.data.items)
  .catch(err => console.error(err));
}

/**
 * Returns a promise that creates the given group.
 * @param {*} group the group to be created
 */
function createGroup(group) {
  return groupsCursor.insertOne(group)
  .then(result => addGroupToUsers(group))
  .catch(err => console.error(err));
}

/**
 * Returns a promise that adds the given list of users to the given group.
 * @param {string} groupId the ID of the group to which users will be added
 * @param {string[]} userIds the list of IDs of the users to be added
 */
function addUsersToGroup(groupId, userIds) {
  return groupsCursor.updateOne(
    { _id: groupId },
    { $addToSet: { members: { $each: userIds } } }
  )
  .then(result => groupsCursor.findOne({ _id: groupId }))
  .then(updatedGroup => addGroupToUsers(updatedGroup))
  .catch(err => console.error(err));
}

/**
 * Returns a promise that updates the group lists of the users of the given group.
 * @param {*} group the group to be added
 */
function addGroupToUsers(group) {
  return usersCursor.updateMany(
    { _id: { $in: group.members } },
    { $addToSet: { groups: group._id } },
  )
  .catch(err => console.error(err));
}

/**
 * Returns a promise that deletes the group with the given ID.
 * @param {string} groupId the ID of the group to be deleted
 */
function deleteGroup(groupId) {
  return groupsCursor.findOne({ _id: groupId })
  .then(group => removeGroupFromUsers(group, group.members))
  .then(result => groupsCursor.deleteOne({ _id: groupId }))
  .catch(err => console.error(err));
}

/**
 * Returns a promise that removes the given list of users from the given group.
 * @param {string} groupId the ID of the group from which to remove users
 * @param {string[]} userIds the list of IDs of the users to remove
 */
function removeUsersFromGroup(groupId, userIds) {
  return groupsCursor.findOne({ _id: groupId })
  .then(group => removeGroupFromUsers(group, userIds))
  .then(result => {
    return groupsCursor.updateOne(
      { _id: groupId },
      { $pullAll: { members: userIds } }
    )
  })
  .catch(err => console.error(err));
}

/**
 * Returns a promise that removes the given group from the given users.
 * @param {*} group the group to be removed from the users
 * @param {string[]} userIds the list of IDs of the users to update
 */
function removeGroupFromUsers(group, userIds) {
  return usersCursor.updateMany(
    { _id: { $in: userIds } },
    { $pull: { groups: group._id } },
  )
  .catch(err => console.error(err));
}
