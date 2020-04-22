const fs = require('fs');
const crypto = require('crypto')
const Promise = require('promise');
const Express = require('express');
const BodyParser = require("body-parser");
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const {google} = require('googleapis');
const MapsClient = require("@googlemaps/google-maps-services-js").Client;

const scheduler = require('./Backend/schedule.js');

const port = process.env.PORT || 3000;

const CONNECTION_URL = 'mongodb+srv://root:admin@campus-scheduler-gdb0r.mongodb.net/test?retryWrites=true&w=majority';
const DATABASE_NAME = 'test';

const CALENDAR_CREDENTIALS = 'credentials-calendar.json';
const GEOCODING_API_KEY = 'api-key-geocoding.txt';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

var app = Express();
var oAuth2Client;
var geocodingKey;
var usersCursor, groupsCursor;
// var currentUser;
// TODO change this to your own email for convenience, remove after finished developing and uncomment line above
var currentUser = 'tcj16@case.edu';

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// TODO use dotenv instead of reading files
app.listen(port, () => {
  // Connect to MongoDB server
  MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    const db = client.db(DATABASE_NAME);
    usersCursor = db.collection('users');
    groupsCursor = db.collection('groups');
    console.log(`Connected to db ${DATABASE_NAME}`);
  });

  // Read credentials file for OAuth2 client
  fs.readFile(CALENDAR_CREDENTIALS, (err, content) => {
    if (err) return console.error(err.message);
    const credentials = JSON.parse(content);
    const {client_id, client_secret, redirect_uris } = credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
  });

  // Read geocoding API key
  fs.readFile(GEOCODING_API_KEY, (err, content) => {
    if (err) return console.error(err.message);
    geocodingKey = content;
  });

  console.log(`Listening on port ${port}...`);
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
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  // Redirect to /auth
  res.redirect(authUrl);
});

app.get("/auth", (req, res) => {
  const {code, scopes} = req.query;
  if (!code) {
    return res.status(500).send('Could not find user authorization code.')
  }
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error(err);
    // TODO remove after debugging
    console.log(token);
    oAuth2Client.setCredentials(token);
    // Store token with corresponding user
    // TODO encrypt token
    google.oauth2("v2").userinfo.v2.me.get({auth: oAuth2Client}, (err, profile) => {
      if (err) return console.error(err);
      createOrUpdateCurrentUser(profile.data, token, (err, result) => {
        if (err) return res.status(500).send(err);
        res.redirect('/home');
      });
    });
  });
});

// TODO finalize this structure after deciding what to do about currentUser
function createOrUpdateCurrentUser(profileData, token, callback) {
  currentUser = profileData.email;
  const refreshToken = token.refresh_token;
  return usersCursor.findOne({ _id: currentUser })
  .then(user => {
    if (user) {
      if (refreshToken) {
        return usersCursor.updateOne({ _id: currentUser }, { $set: { token: refreshToken } });
      }
    } else {
      return usersCursor.insertOne({
        _id: currentUser,
        name: profileData.name,
        token: refreshToken,
        groups: [],
        user_prefs: {}
      });
    }
  })
  .then(result => callback(null, result))
  .catch(err => callback(err, null));
}

function deleteUser(userId) {
  // Remove user from associated groups
  groupsCursor.updateMany(
    { members: userId },
    { $pull: { members: userId } }
  )
  .catch(err => console.error(err));

  // Delete user
  return usersCursor.deleteOne({ _id: userId })
  .catch(err => console.error(err));
}

/**
 * Returns a promise that returns an array containing all groups of the current user.
 */
function groupsOfCurrentUser() {
  return usersCursor.findOne({ _id: currentUser })
  .then(user => user.groups)
  .catch(err => console.error(err));
}

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
        return Promise.all(calendars.map(c => eventsFromCalendar(c, users[i], 28)))
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
  const refreshToken = user.token;
  if (!refreshToken) {
    console.error(`Could not find refresh token for user ${user._id}`);
    return [];
  }
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  // Filter according to user preferences, do not filter if that list is empty
  const calendarNames = user.user_prefs.calendars;
  let filterFunction = c => true;
  if (calendarNames.length) {
    filterFunction = c => calendarNames.includes(c.summary);
  }

  return googleCalendar.calendarList.list()
  .then(calendar => calendar.data.items.filter(filterFunction))
  .catch(err => {
    console.error(err);
    return [];
  });
}

/**
 * Returns a promise that returns upcoming events from the given calendar of the given user.
 * @param {*} calendar the Google calendar from which to retrieve events
 * @param {*} user the user whose token is to be used
 */
function eventsFromCalendar(calendar, user, days) {
  const refreshToken = user.token;
  if (!refreshToken) {
    console.error(`Could not find refresh token for user ${user._id}`);
    return [];
  }
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  const now = new Date();
  const end = new Date(now.getTime() + (1000 * 60 * 60 * 24 * days));
  return googleCalendar.events.list({
    calendarId: calendar.id,
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  })
  .then(eventList => eventList.data.items.filter(e => e.start.dateTime)) // filter out all-day events
  .catch(err => {
    console.error(err);
    return [];
  });
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

// TODO update when scheduler considers date range
/**
 * Returns a promise that returns a list of possible meeting times from the scheduler.
 * @param {string} groupId the ID of the group for this meeting
 * @param {*} meetingParams the parameters of the meeting to be scheduled
 */
function scheduleMeeting(groupId, meetingParams) {
  return allMemberEventsOfGroup(groupId)
  .then(memberEvents => {
    return new Promise((resolve, reject) => {
      resolve(
        scheduler.naiveSchedule(
          memberEvents,
          meetingParams.endDate,
          meetingParams.startTime,
          meetingParams.endTime,
          meetingParams.duration,
          meetingParams.interval)
      );
    });
  })
  .catch(err => console.error(err));
}

// TODO 
// custom time zone
// option for recurrence
// attendees: group.members
// option for reminders
async function createMeeting(groupId, startTime, endTime, location) {
  const group = await groupsCursor.findOne({ _id: groupId });
  const eventTemplate = {
    'summary': `${group.name} Meeting`,
    'location': location,
    'description': `Event automatically generated by Campus Scheduler.`,
    'start': {
      'dateTime': startTime,
      'timeZone': 'America/New_York',
    },
    'end': {
      'dateTime': endTime,
      'timeZone': 'America/New_York',
    },
    'recurrence': [ ],
    'attendees': [ ],
    'reminders': {
      'useDefault': true,
    }
  };

  const user = await usersCursor.findOne({ _id: currentUser });
  oAuth2Client.setCredentials({ refresh_token: user.token });
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  return googleCalendar.events.insert({
    auth: oAuth2Client,
    calendarId: 'primary',
    resource: eventTemplate,
  })
  .then(event => {
    console.log(event)
    const meeting = {
      id: event.data.id,
      startTime: event.data.start.dateTime,
      endTime: event.data.end.dateTime,
      location: event.data.location
    };
    return groupsCursor.updateOne(
      { _id: groupId },
      { $push: { meetings: meeting } }
    );
  })
  .catch(err => console.error('There was an error contacting the Calendar service: ' + err));
}

async function deleteMeeting(groupId, meetingId) {
  const user = await usersCursor.findOne({ _id: currentUser });
  oAuth2Client.setCredentials({ refresh_token: user.token });
  const googleCalendar = google.calendar({version: 'v3', auth: oAuth2Client});

  // Remove meeting from database
  groupsCursor.updateOne(
    { _id: groupId },
    { $pull: { meetings: { id: meetingId } } }
  )
  .catch(err => console.error(err));

  // Remove meeting from Google calendar
  return googleCalendar.events.delete({
    calendarId: 'primary',
    eventId: meetingId,
  })
  .catch(err => console.error(err));
}

////////// POST ROUTES ////////////////////////////////////////////////////////////////////////////

// TODO delete after finished debugging server
app.get("/home", (req, res) => {
  const meetingParams = {
    endDate: '2020-04-21',
    startTime: '12:00:00',
    endTime: '14:00:00',
    duration: '00:30:00',
    interval: '00:05:00',
  };
  scheduleMeeting('395', meetingParams)
  .then(meetings => res.send(meetings))
  .catch(err => res.status(500).send(err));
});

app.post("/home", (req, res) => {
  groupsOfCurrentUser()
  .then(events => {
    console.log(events)
    res.send(events);
  })
  .catch(err => res.status(500).send(err));
});

app.post("/create-group", (req, res) => {
  const group = req.body;
  createGroup(group)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/delete-group", (req, res) => {
  const groupId = req.body;
  deleteGroup(groupId)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/add-members", (req, res) => {
  const {groupId, userIds} = req.body;
  addUsersToGroup(groupId, userIds)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/remove-members", (req, res) => {
  const {groupId, userIds} = req.body;
  removeUsersFromGroup(groupId, userIds)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/schedule-meeting", (req, res) => {
  const meetingParams = req.body;
  scheduleMeeting(meetingParams)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/create-meeting", (req, res) => {
  const meeting = req.body;
  createMeeting(meeting)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/delete-meeting", (req, res) => {
  const {groupId, meetingId} = req.body;
  deleteMeeting(groupId, meetingId)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});