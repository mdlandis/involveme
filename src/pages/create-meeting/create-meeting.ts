import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { MeetingService } from '../../app/meeting.service';
import { MeetingDetailPage } from '../meeting-detail/meeting-detail';
import { MyMeetingsPage } from '../my-meetings/my-meetings';

/**
 * Generated class for the CreateMeetingPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-create-meeting',
  templateUrl: 'create-meeting.html',
})
export class CreateMeetingPage {

  private title;
  private anon;

  constructor(public navCtrl: NavController, public navParams: NavParams, private meetingService: MeetingService) {
  }

  createMeeting() {
    //console.log(this.title, this.anon);
    this.meetingService.newMeeting(this, this.title, this.anon);
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad CreateMeetingPage');
    this.meetingService.fetchCreatedMeetingKeys();
  }

  redirectToId(id) {
    //console.log(id);
    this.navCtrl.push(MeetingDetailPage, {
      meetingParam : id,
      creatorParam : true
    }).catch(err => console.log(err));
    this.navCtrl.remove(1);
    this.navCtrl.insert(1, MyMeetingsPage);
  }

}
