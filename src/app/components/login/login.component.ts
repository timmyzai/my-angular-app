import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { ApiCallType, PassKeyChallengeHelper } from 'src/shared/services/helper/PassKeyChallengeHelper';
import { FetchService } from 'src/shared/services/helper/fetch.services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  tfa: string = '';
  errorMessage: string = '';
  rememberMe: boolean = false;
  showLoginMethods: boolean = false;
  token: string | null | undefined;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private fetchService: FetchService
  ) { }

  ngOnInit(): void {
    const rememberMe = localStorage.getItem('rememberMe');
    this.rememberMe = rememberMe ? JSON.parse(rememberMe) : false;
    if (this.rememberMe) {
      const rememberData = this.authService.getRememberData();
      if (rememberData) {
        this.username = rememberData.username || '';
        this.password = rememberData.password || '';
        this.tfa = rememberData.tfa || '';
      }
    }
  }

  onUsernameSubmit() {
    this.showLoginMethods = true;
  }
  login(): void {
    this.authService.login(this.username, this.password, this.tfa)
      .then(() => {
        localStorage.setItem('rememberMe', JSON.stringify(this.rememberMe));
        if (this.rememberMe) {
          this.authService.cacheRememberData(this.username, this.password, this.tfa);
        }
      })
      .catch(error => {
        this.errorMessage = 'Login failed: ' + error.message;
      });
  }
  async initiatePasswordlessLogin() {
    try {
      var pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Login, null, this.username)
      await this.authService.passwordlessLogin(this.username, pendingVerifyCredential);
    } finally {
      this.isLoading = false;
    }
  }
}
