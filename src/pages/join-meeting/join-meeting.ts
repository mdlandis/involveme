import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { MeetingService } from '../../app/meeting.service';
import { MeetingDetailPage } from '../meeting-detail/meeting-detail';
import { MyMeetingsPage } from '../my-meetings/my-meetings';

/**
 * Generated class for the JoinMeetingPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-join-meeting',
  templateUrl: 'join-meeting.html',
})
export class JoinMeetingPage {

  meetingId: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private meetingService : MeetingService, private alertCtrl : AlertController) {
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad JoinMeetingPage');
    this.meetingService.fetchCreatedMeetingKeys();
    this.meetingService.fetchJoinedMeetingKeys();
  }

  attemptJoinMeeting() {
    this.meetingService.joinMeetingById(parseInt(this.meetingId, 10), this);
  }
  
  redirectToId(id) {
    //console.log(id);
    this.navCtrl.push(MeetingDetailPage, {
      meetingParam : id
    }).catch(err => console.log(err));
    this.navCtrl.remove(1);
    this.navCtrl.insert(1, MyMeetingsPage);
    //TODO: Unhackify this
  }

  failJoinMeeting(message) {
    //console.log("?");
    let mistake = this.alertCtrl.create({
      title: 'Failed to join meeting',
      message: message,
      buttons: [
        {
          text: 'Ok'
        }
      ]
    });
    mistake.present();
  }



}
