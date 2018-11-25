import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CreateMeetingPage } from '../create-meeting/create-meeting';
import { MyMeetingsPage } from '../my-meetings/my-meetings';
import { JoinMeetingPage } from '../join-meeting/join-meeting';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {
    
  }
  
  clickCreateMeeting() {
    this.navCtrl.push(CreateMeetingPage);
  }

  clickJoinMeeting() {
    this.navCtrl.push(JoinMeetingPage);
  }

  clickMyMeetings() {
    this.navCtrl.push(MyMeetingsPage);
  }  

}
