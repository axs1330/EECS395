const assert = require('assert');
const fs = require('fs');
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
var geocodingClient;
var currentUser;

// TODO store these in db or fs instead
var meetingLocations = [
  "11038 Bellflower Rd, Cleveland, OH 44106",
  "11451 Juniper Dr, Cleveland, OH 44106",
  "11055 Euclid Ave, Cleveland, OH 44106",
  "2095 Martin Luther King Jr Dr, Cleveland, OH 44106"
];

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
  geocodingClient = new MapsClient({});
  fs.readFile(GEOCODING_API_KEY, (err, content) => {
    if (err) return console.error(err.message);
    geocodingKey = content;
  });

  console.log(`Listening on port ${port}...`);
});

app.post("/api/authorize", async (req, res) => {
  currentUser = req.body.email;
  let authParams = {
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  };

  const user = await usersCursor.findOne({ _id: currentUser });
  if (user) {
    oAuth2Client.setCredentials({ refresh_token: user.token });
    try {
      await oAuth2Client.getAccessToken();
      console.log(`Valid refresh token for user ${currentUser}`);
      authParams = {
        access_type: 'online',
        scope: SCOPES
      }
    } catch (e) {
      // use default authParams
      console.log(`Invalid refresh token for user ${currentUser}`);
    }
  }

  const authUrl = oAuth2Client.generateAuthUrl(authParams);
  res.send(authUrl)
});

app.post("/auth", (req, res) => {
  const code = req.body.code;
  if (!code) {
    return res.status(500).send('Could not find user authorization code.')
  }
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error(err);
    oAuth2Client.setCredentials(token);

    // Store refresh token with corresponding user
    google.oauth2("v2").userinfo.v2.me.get({auth: oAuth2Client}, (err, profile) => {
      if (err) return console.error(err);
      createOrUpdateCurrentUser(profile.data, token, (err, result) => {
        if (err) return res.status(500).send(err);
        res.redirect('/home');
      });
    });
  });
});

/**
 * Returns a promise that updates the current user's refresh token, if the current user
 * already exists in the database. If not, a new document based on the current user is
 * created.
 * @param {*} profileData the profile data of the current user, retrieved from Google
 * @param {string} token the access token
 * @param {*} callback the function to be called after this one
 */
function createOrUpdateCurrentUser(profileData, token, callback) {
  assert.strictEqual(profileData.email, currentUser, 'Signed-in email does not match current user email.')

  const refreshToken = token.refresh_token;
  return usersCursor.findOne({ _id: currentUser })
  .then(user => {
    if (user) {
      if (refreshToken) {
        console.log(`Updating refresh token of user ${currentUser}`)
        return usersCursor.updateOne({ _id: currentUser }, { $set: { token: refreshToken } });
      }
    } else {
      console.log(`Creating new user with email ${currentUser}`);
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
 * Returns a promise that returns an array of all groups containing the current user.
 */
function groupsOfCurrentUser() {
  return groupsCursor.find({ members: currentUser }).toArray()
  .catch(err => console.error(err));
}

/**
 * Returns a Google Calendar API object from the given refresh token.
 * @param {string} refreshToken the refresh token to use
 */
function googleCalendarAPI(refreshToken) {
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({version: 'v3', auth: oAuth2Client});
}

// TODO filter members
/**
 * Returns a promise that returns all events of all members in the group with the given ID.
 * @param {string} groupId the ID of the group from which to retrieve events
 * @param {string} startTime the earliest date/time to retrieve events, formatted as an ISO string
 * @param {string} endTime the latest date/time to retrieve events, formatted as an ISO string
 */
function allMemberEventsOfGroup(groupId, startTime, endTime) {
  return usersOfGroup(groupId)
  .then(users => {
    return Promise.all(users.map(u => calendarsOfUser(u)))
    .then(calendarLists => {
      return Promise.all(calendarLists.map((calendars, i) => {
        return Promise.all(calendars.map(c => eventsFromCalendar(c, users[i], startTime, endTime)))
        .then(events => [].concat(...events));
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
  const id = new ObjectId(groupId);
  return groupsCursor.findOne({ _id: id })
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
  const googleCalendar = googleCalendarAPI(refreshToken);

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
 * @param {string} startTime the earliest date/time to retrieve events, formatted as an ISO string
 * @param {string} endTime the latest date/time to retrieve events, formatted as an ISO string
 */
function eventsFromCalendar(calendar, user, startTime, endTime) {
  const refreshToken = user.token;
  if (!refreshToken) {
    console.error(`Could not find refresh token for user ${user._id}`);
    return [];
  }
  const googleCalendar = googleCalendarAPI(refreshToken);

  return googleCalendar.events.list({
    calendarId: calendar.id,
    timeMin: startTime,
    timeMax: endTime,
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
 * @param {string} group.name the name of the group
 * @param {string[]} group.members the members of the group
 * @param {string} group.meetings the meetings of the group
 * @param {*} group.group_prefs the preferences of the group
 */
function createGroup(group) {
  group._id = new ObjectId();
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
  const id = new ObjectId(groupId);
  return groupsCursor.updateOne(
    { _id: id },
    { $addToSet: { members: { $each: userIds } } }
  )
  .then(result => groupsCursor.findOne({ _id: id }))
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
  const id = new ObjectId(groupId);
  return groupsCursor.findOne({ _id: id })
  .then(group => removeGroupFromUsers(group, group.members))
  .then(result => groupsCursor.deleteOne({ _id: id }))
  .catch(err => console.error(err));
}

/**
 * Returns a promise that removes the given list of users from the given group.
 * @param {string} groupId the ID of the group from which to remove users
 * @param {string[]} userIds the list of IDs of the users to remove
 */
function removeUsersFromGroup(groupId, userIds) {
  const id = new ObjectId(groupId);
  return groupsCursor.findOne({ _id: id })
  .then(group => removeGroupFromUsers(group, userIds))
  .then(result => groupsCursor.updateOne(
      { _id: id },
      { $pullAll: { members: userIds } }
    )
  )
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
 * @param {string} meetingParams.groupId the ID of the group
 * @param {string} meetingParams.startDate the earliest date of the meeting, formatted as an ISO string
 * @param {string} meetingParams.endDate the latest date of the meeting, formatted as an ISO string
 * @param {string} meetingParams.startTime the earliest time of the meeting, formatted "hh:mm:ss-hh:mm"
 * @param {string} meetingParams.endTime the latest time of the meeting, formatted "hh:mm:ss-hh:mm"
 * @param {string} meetingParams.duration the duration of the meeting, formatted "hh:mm:ss"
 */
function scheduleMeeting(meetingParams) {
  const formattedStartDate = meetingParams.startDate.split('T')[0];
  const formattedEndDate = meetingParams.startDate.split('T')[0];
  const startDateTime = formattedStartDate.concat('T', meetingParams.startTime);
  const endDateTime = formattedEndDate.concat('T', meetingParams.endTime);

  return allMemberEventsOfGroup(meetingParams.groupId, startDateTime, endDateTime)
  .then(memberEvents => {
    return new Promise((resolve, reject) => {
      resolve(
        scheduler.naiveScheduleWithLocation(
          memberEvents,
          startDateTime,
          endDateTime,
          meetingParams.duration,
          '00:05:00')
      );
    });
  })
  .then(results => {
    const {times, prev_locations, after_locations} = results;
    // TODO maybe first go by valid address count?
    return Promise.all([
      times,
      closestMeetingLocation(prev_locations),
      closestMeetingLocation(after_locations)
    ]);
  })
  .then(([times, prev, after]) => {
    const finalLocation = prev.distance < after.distance ? prev : after;
    return [
      {
        startTime: times[2].concat('T', times[0], '-05:00'),
        endTime: times[2].concat('T', times[1], '-05:00'),
        location: finalLocation.location
      }
    ]
  })
  .catch(err => console.error(err));
}

// TODO move these to another module
async function closestMeetingLocation(locations) {
  let optimalMeeting = {
    location: null,
    distance: Infinity
  };
  const validLocations = await locations.filter(l => l !== null && l !== 'undefined');
  if (!validLocations.length) return optimalMeeting;

  const candidateCoordinates = await Promise.all(meetingLocations.map(l => address2Coordinates(l)));
  const locationCoordinates = await Promise.all(validLocations.map(l => address2Coordinates(l)));

  let minIndex = 0;
  let minDistance = Infinity;
  for (let i in candidateCoordinates) {
    let candidate = candidateCoordinates[i];
    let distanceSum = 0;
    for (let j in locationCoordinates) {
      let location = locationCoordinates[j];
      distanceSum += distance(candidate, location);
    }
    if (distanceSum < minDistance) {
      minIndex = i;
      minDistance = distanceSum;
    }
  }

  optimalMeeting.location = {
    address: meetingLocations[minIndex],
    lat: candidateCoordinates[minIndex].lat,
    lng: candidateCoordinates[minIndex].lng
  };
  optimalMeeting.distance = minDistance;
  return optimalMeeting;
}

function address2Coordinates(address) {
  return geocodingClient.geocode({
    params: {
      address: address,
      key: geocodingKey
    },
    timeout: 1000
  })
  .then(res => res.data.results[0].geometry.location)
  .catch(err => console.error(err));
}

function distance(l1, l2, scale = 1000) {
  return Math.sqrt((scale * (l1.lat - l2.lat))^2 + (scale * (l1.lng - l2.lng))^2);
}

// TODO 
// custom time zone (group prefs)
// option for recurrence
// option for reminders
/**
 * Returns a promise that creates a meeting and Google event with the given parameters.
 * The ID of the meeting stored in the database is based on the ID of the newly-
 * generated Google event.
 * @param {string} meetingProperties.groupId the ID of the group of this meeting
 * @param {string} meetingProperties.startTime the start time of the meeting, formatted as an ISO string
 * @param {string} meetingProperties.endTime the start time of the meeting, formatted as an ISO string
 * @param {string} meetingProperties.location the address location of this meeting
 */
async function createMeeting(meetingProperties) {
  const id = new ObjectId(meetingProperties.groupId)
  const group = await groupsCursor.findOne({ _id: id });
  const attendees = await Promise.all(group.members.map(m => { return { email: m }; }));
  const eventTemplate = {
    'summary': `${group.name} Meeting`,
    'location': meetingProperties.location,
    'description': 'Event automatically generated by Campus Scheduler.',
    'source': {
      title: 'Campus Scheduler',
      url: 'https://campus-scheduler.herokuapp.com/'
    },
    'start': {
      'dateTime': meetingProperties.startTime,
      'timeZone': 'America/New_York',
    },
    'end': {
      'dateTime': meetingProperties.endTime,
      'timeZone': 'America/New_York',
    },
    'recurrence': [ ],
    'attendees': attendees,
    'reminders': {
      'useDefault': true,
    }
  };

  const user = await usersCursor.findOne({ _id: currentUser });
  const googleCalendar = googleCalendarAPI(user.token);

  return googleCalendar.events.insert({
    auth: oAuth2Client,
    calendarId: 'primary',
    resource: eventTemplate,
    // Uncomment line below to send email invites
    // sendNotifications: 'all'
  })
  .then(event => {
    const meetingToAdd = {
      id: event.data.id,
      start: event.data.start.dateTime,
      end: event.data.end.dateTime,
      location: event.data.location
    };
    return groupsCursor.updateOne(
      { _id: id },
      { $push: { meetings: meetingToAdd } }
    );
  })
  .catch(err => console.error(err));
}

/**
 * Returns a promise that deletes the given meeting from the given group.
 * @param {string} groupId the ID of the group
 * @param {string} meetingId the ID of the meeting
 */
async function deleteMeeting(groupId, meetingId) {
  const id = new ObjectId(groupId)
  const user = await usersCursor.findOne({ _id: currentUser });
  const googleCalendar = googleCalendarAPI(user.token);

  // Remove meeting from database
  groupsCursor.updateOne(
    { _id: id },
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
app.get("/test", (req, res) => {
  // const meeting = {
  //   groupId: '5ea1e09ac3b7ed2a60d398f3',
  //   startTime: '2020-04-24T14:00:00-05:00',
  //   endTime: '2020-04-24T16:00:00-05:00',
  //   location: '11038 Bellflower Rd, Cleveland, OH 44106'
  // };
  // createMeeting(meeting)
  const meetingParams = {
    groupId: '5ea1e09ac3b7ed2a60d398f3',
    startDate: '2020-02-19T00:00:00',
    endDate: '2020-02-19T00:00:00',
    startTime: '04:30:00-05:00',
    endTime: '23:30:00-05:00',
    duration: '00:40:00',
    interval: '00:05:00',
  };
  scheduleMeeting(meetingParams)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err));
});

app.get("/home", (req, res) => {
  groupsOfCurrentUser()
  .then(events => res.send(events))
  .catch(err => res.status(500).send(err));
});

app.post("/home", (req, res) => {
  res.redirect('/home');
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
  console.log(userIds);
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
  const meetingProperties = req.body;
  createMeeting(meetingProperties)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});

app.post("/delete-meeting", (req, res) => {
  const {groupId, meetingId} = req.body;
  deleteMeeting(groupId, meetingId)
  .then(result => res.send(result))
  .catch(err => res.status(500).send(err))
});