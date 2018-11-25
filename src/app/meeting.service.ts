import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';



@Injectable()
export class MeetingService {

    createdMeetings;
    joinedMeetings;

    constructor(private storage : Storage, private db: AngularFireDatabase) {

    }

    /*
    Queries the database for the meeting with given ID, then calls the callback function on it,
    using self as a reference to this. Returns a snapshot:
        meeting's key = Object.keys(snapshot.val())[0];
        meeting json = snapshot.val()[meetingKey];

    id = id of meeting
    callback = function to call when finished
    returnPage = page of origin
    param = optional data for callback
    */
    findMeetingObjectById(id, callback, returnPage, creator, param) {
        var self = this;
        this.db.database.ref('meetings').orderByChild('id').equalTo(id)
        .once('value')
        .then(snapshot => {
          callback(id, snapshot, returnPage, self, creator, param);
        })
        .catch();  
    }

    /*
    This is called when a new meeting is created. A new meeting is added to the database,
    with data statically (for now) populated as shown below. It also adds the meeting to
    the created meetings list, so created meetings MUST BE FETCHED, and redirects to that
    meeting's detail page afterwards.
    */
    newMeeting(createPage, meetingTitle, hidden) {
        
        var self = this;
        this.getNextId().then(function(result) {
          var idNum = result.snapshot.node_.value_;
          if(meetingTitle === undefined) {
            meetingTitle = "Meeting Number " + idNum;
          }
          if(hidden === undefined) {
            hidden = false;  
          }
          var newMeeting = {
            id: idNum,
            title: meetingTitle,
            creatorPresent: true,
            hideResponses: hidden,
            attendees: 1,
            respondees: 0,
            questions: [
              {
                ask: "My ideas have been heard.",
                responses: [["Agree", 0], ["Disagree", 0]]
              },
              {
                ask: "I have received my fair share of the airtime.",
                responses: [["Agree", 0], ["Disagree", 0]]
              },
              {
                ask: "I support the decisions we have made.",
                responses: [["Agree", 0], ["Disagree", 0]]
              },
              {
                ask: "This meeting was a good use of my time.",
                responses: [["Agree", 0], ["Disagree", 0]]
              }
            ]
          };
          const newObjKey = self.db.list('/meetings').push(newMeeting).key;
          self.addToCreatedMeetings(newObjKey);
          createPage.redirectToId(newMeeting.id);
        }); 
    }

    /*
    Joins a meeting from the join meeting page by the given ID. See bySnapshot for more. 
    */
    joinMeetingById(id, joinPage) {
        this.findMeetingObjectById(id, this.joinMeetingBySnapshot, joinPage, null, null);    
    }

    /*
    Does some error checking on the given snapshot before joining it:
    - Meeting must exist
    - Meeting's creator must still be present
    - User must not already be the creator of the meeting
    - User must not already have joined the meeting

    Increments the attendees for the meeting, adds it to the joined list, then redirects.

    Because of error checking, CREATED AND JOINED MEETINGS MUST BE FETCHED!
    */
    joinMeetingBySnapshot(id, snapshot, joinPage, self, creator, param) {
        if(snapshot.val() == null) {
            joinPage.failJoinMeeting("Meeting " + id + " does not exist.");
            return;
        }
        const meetingKey = Object.keys(snapshot.val())[0];
        var meetingObject = snapshot.val()[meetingKey];

        if(!meetingObject.creatorPresent) {
            joinPage.failJoinMeeting("Meeting " + id + " has already been disbanded, so you cannot join it.");
            return;
        }
        if(self.getKeyPhase(meetingKey) != -1) {
            joinPage.failJoinMeeting("You are already a participant in meeting " + id + ".");
            return;
        }
        self.incrementAttendees(meetingKey);
        self.addToJoinedMeetings(meetingKey);
        joinPage.redirectToId(id);   
    }

    /*
    Leaves the meeting with given ID. See the bySnapshot for details.
    */
    leaveMeetingById(id, meetingsPage, creator) {
        this.findMeetingObjectById(id, this.leaveMeetingBySnapshot, meetingsPage, creator, null);
    }

    /*
    Leaves the meeting by removing it from the joined/created meetings list. If the creator left,
    sets the creatorPresent boolean to false so that new people cannot join it.

    CREATED/JOINED MEETINGS MUST BE FETCHED, OR ELSE BE OVERWRITTEN!
    */
    leaveMeetingBySnapshot(id, snapshot, meetingsPage, self, creator, param) {
        const meetingKey = Object.keys(snapshot.val())[0];       
        if(creator) {
            self.removeFromMeetings(self.createdMeetings, meetingKey);
            self.writeToStorage('created');
            var creatorPresentRef = self.db.object('/meetings/' + meetingKey + '/creatorPresent').query.ref;
            creatorPresentRef.set(false).catch();            
        } else {
            self.removeFromMeetings(self.joinedMeetings, meetingKey);
            self.writeToStorage('joined');
        }
        
        meetingsPage.refreshMeetings();
    }

    /*
    Updates a meeting. See bySnapshot for details.
    */
    addResponsesById(id, responses, detailPage, creator) {
        this.findMeetingObjectById(id, this.addResponsesBySnapshot, detailPage, creator, responses); 
    }

    /*
    Updates a meeting's responses to include feedback from the responses object. Uses
    transactions to do so safely.
    */
    addResponsesBySnapshot(id, snapshot, detailPage, self, creator, responses) {
        const meetingKey = Object.keys(snapshot.val())[0];   
        
        var realMeeting = snapshot.val()[meetingKey];
        var amount = 1;
        if(realMeeting.hideResponses && !creator) {
          amount = 2;
        }
        self.incrementKeyPhase(meetingKey, amount);
        self.incrementRespondees(meetingKey);
        var answers = responses.questions;
        for(var i = 0; i < answers.length; i++) {
            var index = self.findResponse(answers[i].selectedItem, realMeeting.questions[i].responses);
            self.incrementResponse(meetingKey, i, index);
        }
        detailPage.meeting = self.loadMeetingDetailsById(id, detailPage);
    }

    /*
    Queries the database for a meeting by its id, then loads the information about
    that meeting to the detail page. Identifies which phase the meeting is in and loads it
    accordingly. Reloading a meeting effectively refreshes the page.
    */
    loadMeetingDetailsById(id, detailPage) {
        return Observable.create(observer => {
            this.db.database.ref('meetings').orderByChild('id').equalTo(id)
            .once('value')
            .then(snapshot => {
                var hack = [];
                const meetingKey = Object.keys(snapshot.val())[0];
                var meetingObject = snapshot.val()[meetingKey];
                //console.log(meetingObject);

                hack.push(meetingObject);
                detailPage.meetingObject = meetingObject;
                var currentPhase = this.getKeyPhase(meetingKey);
                if(currentPhase == 0) {
                    detailPage.countAndCreateQuestions();
                } else if(currentPhase == 1) {
                    detailPage.initializeFeedbackPhase();
                } else {
                    detailPage.thankForResponse();
                }
                observer.next(hack);
            })
            .catch(error => console.log(error));      
        });
    }

    /*
    Uses transactions to safely increment the global transaction counter.
    Value accessed with result.snapshot.node_.value_
    */
    getNextId() {
        var countRef = this.db.object('/count').query.ref;
        return countRef.transaction(function(current) {
            return (current || 0) + 1;
        });
    }

    /*
    Syncs the local list to the list from memory for created meetings.
    */
    fetchCreatedMeetingKeys(returnPage = null) {
        return this.storage.get('created')
        .then(
            (createdMeetings) => {
              createdMeetings? this.createdMeetings = createdMeetings: this.createdMeetings = [];
              if(returnPage != null) {
                  returnPage.processLists(this.createdMeetings, null);
              }
              //console.log("Fetch done");
        })
        .catch(
            err => console.log(err)
        );
    }

    /*
    Syncs the local list to the list from memory for joined meetings.
    */
    fetchJoinedMeetingKeys(returnPage = null) {
        return this.storage.get('joined')
        .then(
            (joinedMeetings) => {
              joinedMeetings? this.joinedMeetings = joinedMeetings: this.joinedMeetings = [];
              if(returnPage != null) {
                  returnPage.processLists(null, this.joinedMeetings);
              }
              //console.log("Fetch done");
        })
        .catch(
            err => console.log(err)
        );
    }

    /*
    Uses a promise to fetch created meetings, then return a list of all created meetings
    via an observable that can be piped through async.
    */
    generateCreatedMeetingList(returnPage = null) {
        return Observable.create(observer => {
            var self = this;
            var meetings = [];
            this.fetchCreatedMeetingKeys(returnPage).then(function () {
                var i;
                for(i = 0; i < self.createdMeetings.length; i++) {
                    self.db.database.ref('/meetings/' + self.createdMeetings[i][0]).once('value').then(function(snapshot) {
                        var dbmeet = snapshot.val();
                        meetings.push(dbmeet);
                    });                   
                }
            });   
            observer.next(meetings);     
        });    
    }

    /*
    Uses a promise to fetch created meetings, then return a list of all joined meetings
    via an observable that can be piped through async.
    */
    generateJoinedMeetingList(returnPage = null) {
        return Observable.create(observer => {
            var self = this;
            var meetings = [];
            this.fetchJoinedMeetingKeys(returnPage).then(function () {
                var i;
                for(i = 0; i < self.joinedMeetings.length; i++) {
                    self.db.database.ref('/meetings/' + self.joinedMeetings[i][0]).once('value').then(function(snapshot) {
                        var dbmeet = snapshot.val();
                        meetings.push(dbmeet);
                    });                   
                }
            });   
            observer.next(meetings);     
        });    
    }

    /*
    Adds a newly-created meeting to the list of created meetings, initializing phase to 0.
    Writes the local list -> storage, so list must have been FETCHED!
    */
    addToCreatedMeetings(meetingKey) {
        var keyPair = [meetingKey, 0];
        this.createdMeetings.push(keyPair);
        this.writeToStorage('created');
    }

    /*
    Adds a newly-joined meeting to the yada yada yada...
    */
    addToJoinedMeetings(meetingKey) {
        var keyPair = [meetingKey, 0];
        this.joinedMeetings.push(keyPair);
        this.writeToStorage('joined')
    }

    /*
    Removes a specified meeting key from a specified list, but does not write to storage,
    so storage must be written to afterwards.
    */
    removeFromMeetings(list, meetingKey) {
        for(var i = 0; i < list.length; i++) {
            if(list[i][0] === meetingKey) {
                list.splice(i, 1);
                return;
            }
        }
        //console.log("Wait, what?");
    }

    /*
    Syncs the list in memory with the local list. Opposite of fetch.
    */
    writeToStorage(meetingList) {
        var list;
        if(meetingList === "created") {
          list = this.createdMeetings;
        } else {
          list = this.joinedMeetings;
        }
        this.storage.set(meetingList, list)
        .then(
          //success
        )
        .catch(err => {
            err => console.log(err);
        });
        //console.log(this.storage);
    }

    /*
    Searches created and joined meetings for a particular key, and returns the phase of that key.
    If it isn't found, returns -1, so it can also be used to check if a meeting has already
    been created or joined.

    If increment is true, will also increment the key phase.
    */
    findKey(meetingKey, increment, amount) {
        for(var i = 0; i < this.createdMeetings.length; i++) {
            if(this.createdMeetings[i][0] === meetingKey) {
                if(increment) {
                    this.createdMeetings[i][1] += amount;
                    this.writeToStorage('created');
                }
                return this.createdMeetings[i][1];
            }
        }
        for(var j = 0; j < this.joinedMeetings.length; j++) {
            if(this.joinedMeetings[j][0] === meetingKey) {
                if(increment) {
                    this.joinedMeetings[j][1] += amount;
                    this.writeToStorage('joined');
                }
                return this.joinedMeetings[j][1];
            }
        }
        return -1;
    }

    /*
      Gets key phase.
    */
    getKeyPhase(meetingKey) {
        return this.findKey(meetingKey, false, 0);
    }

    /*
       Gets and increments key phase.
    */
    incrementKeyPhase(meetingKey, amount) {
        return this.findKey(meetingKey, true, amount);
    }

    /*
    Finds a response within the field of possible responses and returns the index.
    */
    findResponse(given, possible) {
        for(var i = 0; i < possible.length; i++) {
            if(possible[i][0] === given) {
                return i;
            }
        }
        return -1;
    }

    /*
    Uses a transaction to safely increment a response based on its index.
    */
    incrementResponse(key, i, index) {
        this.safelyIncrementPath('/meetings/' + key + '/questions/' + i + '/responses/' + index + '/1', 1);
    }

    /*
    Uses a transaction to safely increment the number of people attending a meeting.
    */
    incrementAttendees(key) {
        this.safelyIncrementPath('/meetings/' + key + '/attendees', 1);
    }

    incrementRespondees(key) {
        this.safelyIncrementPath('/meetings/' + key + '/respondees', 1);
    }

    safelyIncrementPath(path, amount) {
        var countRef = this.db.object(path).query.ref;
        return countRef.transaction(function(current) {
            return (current || 0) + amount;
        });
    }
}

/*
    
    joinMeetingById(id, joinPage) {
        //console.log(this.db.database.ref('meetings'));
        //console.log(this.db.database.ref('/meetings'));
        //console.log(this.db.database.ref('/meetings/'));
        var self = this;
        this.db.database.ref('meetings').orderByChild('id').equalTo(id)
        .once('value')
        .then(snapshot => {
            if(snapshot.val() == null) {
                joinPage.failJoinMeeting("There is no meeting with id " + id + ".");
                return;
            }
            const foundMeeting = Object.keys(snapshot.val())[0];

            var realMeeting = snapshot.val()[foundMeeting];
            if(!realMeeting.creatorPresent) {
                joinPage.failJoinMeeting("Meeting " + id + " has already been disbanded, so you cannot join it.");
                return;
            }
            if(this.getKeyPhase(foundMeeting) != -1) {
                joinPage.failJoinMeeting("You are already a participant in meeting " + id + ".");
                return;
            }
            this.incrementAttendees(foundMeeting);
            self.addToJoinedMeetings(foundMeeting);
            joinPage.redirectToId(id);
        })
        .catch();      
    }
    */

    /*
    //As far as I can tell, this function is unused?
    getMeetingByKey(key) {
        return Observable.create(observer => {
            this.db.database.ref('/meetings/' + key).once('value').then(function(snapshot) {
                observer.next(snapshot.val());
            });   
        });
    }
    */