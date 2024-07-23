import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { userDomainUrl } from 'src/shared/contants';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { FetchService } from 'src/shared/services/helper/fetch.services';
import { SignalrService } from 'src/shared/services/signalr.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'my-angular-app';
  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private signalrService: SignalrService,
    private fetchService: FetchService
  ) { }

  ngOnInit(): void {
    this.authService.refreshSession();

    this.authService.isLoggedInObservable().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
      var isSignalREnable = false;
      if (isSignalREnable && isLoggedIn) {
        this.signalrService.startConnection().then(() => {
          const userId = this.authService.getUserId();
          if (userId) {
            this.signalrService.registerUser(userId);
          } else {
            console.error('No userId found');
          }
        }).catch(err => console.error('Failed to establish connection or get userId', err));
      }
    });
  }

  home(): void {
    this.router.navigate(['/dashboard']);
  }
  logout(): void {
    this.isLoggedIn = false;
    this.authService.logout();
  }
}
