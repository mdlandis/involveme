import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HomePage } from '../pages/home/home';
import { IonicStorageModule } from '@ionic/storage';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { MyApp } from './app.component';
import { MeetingService } from './meeting.service';
import { CreateMeetingPage } from '../pages/create-meeting/create-meeting';
import { MyMeetingsPage } from '../pages/my-meetings/my-meetings';
import { JoinMeetingPage } from '../pages/join-meeting/join-meeting';
import { MeetingDetailPage } from '../pages/meeting-detail/meeting-detail';
import { ChartsModule } from 'ng2-charts';

export const firebaseConfig = {
  apiKey: "AIzaSyBow2si-XRnCEISts_6CHb5TzuIIvrJ2Pw",
  authDomain: "expo-involve.firebaseapp.com",
  databaseURL: "https://expo-involve.firebaseio.com",
  projectId: "expo-involve",
  storageBucket: "expo-involve.appspot.com",
  messagingSenderId: "347980264956"
};

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    CreateMeetingPage,
    JoinMeetingPage,
    MeetingDetailPage,
    MyMeetingsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    ChartsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    CreateMeetingPage,
    JoinMeetingPage,
    MeetingDetailPage,
    MyMeetingsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    MeetingService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
