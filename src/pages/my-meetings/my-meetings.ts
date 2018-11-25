import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs';
import { MeetingService } from '../../app/meeting.service';
import { MeetingDetailPage } from '../meeting-detail/meeting-detail';


/**
 * Generated class for the MyMeetingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-my-meetings',
  templateUrl: 'my-meetings.html',
})
export class MyMeetingsPage {

  createdEmpty;
  joinedEmpty;

  createdMeetingList: Observable<any[]>

  joinedMeetingList: Observable<any[]>

  constructor(public navCtrl: NavController, public navParams: NavParams, private meetingService: MeetingService) {
    
  }

  ngOnInit() {
    
    //this.createdMeetingList = Observable.interval(2200).map(i=> [{name: 'car 1'},{name: 'car 2'}]);
    
  }

  ionViewWillEnter() {
    //console.log("Hello!!!");
    this.refreshMeetings();
  }

  ionViewDidLoad() {
    
  }

  onItemClick(meeting, creator) {
    //console.log("Will you own this meeting? " + creator);
    this.navCtrl.push(MeetingDetailPage, {
      meetingParam : meeting.id,
      creatorParam : creator
    }).catch(err => console.log(err));
  }

  leaveMeeting(meeting, creator) {
    this.meetingService.leaveMeetingById(meeting.id, this, creator);
  }

  refreshMeetings() {
    this.createdMeetingList = this.meetingService.generateCreatedMeetingList(this);   
    this.joinedMeetingList = this.meetingService.generateJoinedMeetingList(this);
  }

  processLists(createdMeetings, joinedMeetings) {
    //console.log("Processing");
    if(createdMeetings != null) {
      if(createdMeetings.length == 0) {
        //console.log("Bingo1");
        this.createdEmpty = true;
      } else {
        //console.log("Bango1");
        this.createdEmpty = false;
      }
    }
    if(joinedMeetings != null) {
      if(joinedMeetings.length == 0) {
        //console.log("Bingo2");
        this.joinedEmpty = true;
      } else {
        //console.log("Bango2");
        this.joinedEmpty = false;
      }
    }
  }
}
