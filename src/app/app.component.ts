import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { SignalrService } from 'src/shared/services/signalr.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'my-angular-app';
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService, private router: Router, private signalrService: SignalrService) { }

  ngOnInit(): void {
    this.authService.isLoggedInObservable().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
    });
    // this.signalrService.startConnection();
  }
  home(): void {
    this.router.navigate(['/dashboard']);
  }
  logout(): void {
    this.isLoggedIn = false;
    this.authService.logout();
  }
}
