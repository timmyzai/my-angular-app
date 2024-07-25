import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { TwoFactorAuthModalComponent } from 'src/app/modals/two-factor-auth-modal/two-factor-auth-modal.component';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { ApiCallType, PassKeyChallengeHelper } from 'src/shared/services/helper/passKeyChallenge.services';

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
  private pinSubscription: Subscription;
  @ViewChild('twoFactorModal') twoFactorModal: TwoFactorAuthModalComponent;

  constructor(
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.rememberMe = JSON.parse(localStorage.getItem('rememberMe'));
    if (this.rememberMe) {
      const rememberData = this.authService.getRememberData();
      if (rememberData) {
        this.username = rememberData.username || '';
        this.password = rememberData.password || '';
        this.tfa = rememberData.tfa || '';
      }
    }
  }
  onEnterPress(event: Event) {
    event.preventDefault();
    if (event instanceof KeyboardEvent && !this.showLoginMethods) this.showLoginMethods = true;
  }

  onUsernameSubmit() {
    this.showLoginMethods = true;
  }
  async login(): Promise<void> {
    this.authService.login(this.username, this.password, this.tfa, this.rememberMe);
  }
  async initiatePasswordlessLogin() {
    try {
      var pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Login, null, this.username)
      if (pendingVerifyCredential) {
        await this.authService.passwordlessLogin(this.username, pendingVerifyCredential);
      }
    } finally {
      this.isLoading = false;
    }
  }
}
