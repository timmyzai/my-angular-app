import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { TwoFactorAuthModalComponent } from 'src/app/modals/two-factor-auth-modal/two-factor-auth-modal.component';
import { userDomainUrl } from 'src/shared/contants';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { ApiCallType, PassKeyChallengeHelper } from 'src/shared/services/helper/PassKeyChallengeHelper';
import { FetchService } from 'src/shared/services/helper/fetch.services';

interface PassKeyPayload {
  isEnable: boolean;
  pendingVerifyCredential?: string | null;
  twoFactorPin: string;
}

@Component({
  templateUrl: './passkey.component.html',
  styleUrls: ['./passkey.component.scss']
})
export class PassKeyComponent implements OnInit {
  isLoading: boolean = false;
  passKeyOptions = [
    { label: 'Enable', value: true },
    { label: 'Disable', value: false }
  ];

  private pinSubscription: Subscription;
  token: string | null | undefined;
  isEnable: boolean = false;
  @ViewChild('twoFactorModal') twoFactorModal: TwoFactorAuthModalComponent;

  constructor(
    private authService: AuthService,
    private fetchService: FetchService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadData();
  }

  loadData(): void {
    setTimeout(() => {
      this.token = this.authService.getAccessToken();
      this.getUserInfo();
    }, 500);
  }

  getUserInfo(): void {
    const url = `${userDomainUrl}/api/User/GetMyUserInfo`;
    this.fetchService.fetchGet(url, this.token)
      .then(data => {
        if (data.isSuccess) {
          this.isEnable = data.result.userData.isPassKeyEnabled;
        } else {
          console.error('Error:', data.error);
        }
      })
      .catch(error => console.error('Error:', error))
      .finally(() => this.isLoading = false);
  }
  async enableDisablePassKey(isEnable: boolean): Promise<void> {
    try {
      var userHasExistingPasskey = await this.GetUserHasExistingPassKey();
      if (isEnable && !userHasExistingPasskey) {
        this.createPassKey();
        return;
      }

      const payload: PassKeyPayload = {
        isEnable: isEnable,
        pendingVerifyCredential: null,
        twoFactorPin: ''
      };

      payload.pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Verify, this.token);
      const url = `${userDomainUrl}/api/User/EnableDisablePassKey`;
      this.fetchService.fetchPut(url, payload, this.token)
        .then(response => {
          if (response.isSuccess) {
            alert(`Passkey ${response.result.userData.isPassKeyEnabled ? 'enabled' : 'disabled'} successfully`);
          } else {
            throw new Error(response.error.errorMessage);
          }
        })
        .catch(error => {
          throw error;
        });
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Operation failed: ' + error);
    }
    finally {
      this.loadData()
    };
  }

  private async createPassKey() {
    const twoFactorPin = await this.getTwoFactorPin();
    const pendingCreateCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Create, this.token);
    const url = `${userDomainUrl}/api/PassKey/Create`;
    const payload = {
      twoFactorPin: twoFactorPin,
      pendingCreateCredential: pendingCreateCredential
    };
    this.fetchService.fetchPost(url, payload, this.token)
      .then(response => {
        if (response.isSuccess) {
          alert('Passkey created successfully');
        } else {
          throw new Error(response.error.errorMessage);
        }
      })
      .catch(error => {
        alert('Operation failed: ' + error.message);
      })
      .finally(() => this.loadData());

  }
  private async GetUserHasExistingPassKey(): Promise<Boolean> {
    const url = `${userDomainUrl}/api/PassKey/GetUserHasExistingPassKeyBool`;
    var response = await this.fetchService.fetchGet(url, this.token);
    if (!response.isSuccess) throw new Error(response.error.errorMessage);
    return response.result;
  }

  private getTwoFactorPin(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.twoFactorModal.displayModal = true;
      this.pinSubscription?.unsubscribe();
      this.pinSubscription = this.twoFactorModal.twoFactorPinResult.pipe(take(1)).subscribe((pin: string) => {
        if (pin && pin.length === 6) {
          resolve(pin);
          this.twoFactorModal.displayModal = false;
        } else {
          reject('Pin is invalid or not six digits long');
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.pinSubscription) {
      this.pinSubscription.unsubscribe();
    }
  }
}
