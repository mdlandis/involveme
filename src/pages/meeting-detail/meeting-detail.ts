import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { MeetingService } from '../../app/meeting.service';
import { Observable } from 'rxjs/Observable';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

/**
 * Generated class for the MeetingDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-meeting-detail',
  templateUrl: 'meeting-detail.html',
})
export class MeetingDetailPage {

  public meeting: Observable<any>;
  
  public answerQuestionsForm; 
  private meetingId;
  public meetingObject;
  private phase;
  private creator;

  public doughnutChartLabels = [[9, 9]];
  public doughnutChartData = [['foo', 'bar']];
  public doughnutChartType:string = 'doughnut';

  initQuestionFields() : FormGroup
  {
    return this.formBuilder.group({
        selectedItem: [[], [Validators.required]]
    });
  }

  addNewInputField() : void
  {
    const control = <FormArray>this.answerQuestionsForm.controls.questions;
    control.push(this.initQuestionFields());
  }
  
  constructor(public navCtrl: NavController, public navParams: NavParams, private meetingService : MeetingService, private formBuilder : FormBuilder) {
    this.meetingId = this.navParams.get("meetingParam");
    this.creator = this.navParams.get("creatorParam");
    this.meeting = this.meetingService.loadMeetingDetailsById(this.meetingId, this);
    this.answerQuestionsForm = this.formBuilder.group({
      questions     : this.formBuilder.array([])
    });
    //console.log("Constructor finished");
  }

  manage(val : any) : void
  {
    //console.log("?");
    //console.log(val);
    this.meetingService.addResponsesById(this.meetingId, val, this, this.creator);
  }

  countAndCreateQuestions() {
    //console.log("Phase 1"); 
    var questions = [];
    for(var i = 0; i < this.meetingObject.questions.length; i++) {
      var q = this.meetingObject.questions[i];
      if(!this.myInclude(questions, q)) {
        //console.log(q.responses);
        questions.push(q.ask);
        this.addNewInputField();
      } 
    }
    this.phase = 0;
  }

  initializeFeedbackPhase() {
    //console.log("Phase 2");
    this.doughnutChartLabels = [];
    this.doughnutChartData = [];
    for(var i = 0; i < this.meetingObject.questions.length; i++) {
      var labelData = [];
      var numberData = [];
      for(var j = 0; j < this.meetingObject.questions[i].responses.length; j++) {
        labelData.push(this.meetingObject.questions[i].responses[j][0]);
        numberData.push(this.meetingObject.questions[i].responses[j][1]);
      }
      this.doughnutChartLabels.push(labelData);
      this.doughnutChartData.push(numberData);
    }
    //console.log(this.doughnutChartData);
    this.phase = 1;
  }

  thankForResponse() {
    this.phase = 2;
  }

  myInclude(list, obj) {
    for(var i = 0; i < list.length; i++) {
      /*
      console.log("___");
      console.log(obj);
      console.log("vs");
      console.log(list[i]);
      console.log("___");
      */
      if(list[i] === obj.ask) {
        return true;
      } 
    }
    return false;
  }

  leaveMeeting() {
    this.meetingService.leaveMeetingById(this.meetingId, this, this.creator);
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad MeetingDetailPage');
  }

  redirectLeave() {
    this.navCtrl.pop();
  }

  refresh() {
    this.meeting = this.meetingService.loadMeetingDetailsById(this.meetingId, this);
  }

  public chartClicked(e:any):void {
    //console.log(e);
  }
 
  public chartHovered(e:any):void {
    //console.log(e);
  }

}
