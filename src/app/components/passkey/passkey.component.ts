import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { TwoFactorAuthModalComponent } from 'src/app/modals/two-factor-auth-modal/two-factor-auth-modal.component';
import { userDomainUrl } from 'src/shared/contants';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { EncryptionService } from 'src/shared/services/helper/encryption.services';
import { FetchService } from 'src/shared/services/helper/fetch.services';
import { ApiCallType, PassKeyChallengeHelper } from 'src/shared/services/helper/passKeyChallenge.services';

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
  userName: string = '';

  constructor(
    private authService: AuthService,
    private fetchService: FetchService,
    private encryptService: EncryptionService
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
          this.userName = data.result.userData.userName;
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
      var pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Verify, this.token);

      const payload: PassKeyPayload = {
        isEnable: isEnable,
        twoFactorPin: '',
        pendingVerifyCredential: pendingVerifyCredential
      };
      // const message = JSON.stringify(pendingVerifyCredential);
      // var publicKey = this.authService.getPublicKey();
      // const encryptedPendingVerifyCredential = await this.encryptService.encryptWithPem_Chunk(message, publicKey);
      // const extraHeaders = {
      //   'X-Pending-Verify': encryptedPendingVerifyCredential
      // };

      const url = `${userDomainUrl}/api/User/EnableDisablePassKey`;
      this.fetchService.fetchPut(url, payload, this.token)
        .then(response => {
          if (response.isSuccess) {
            alert(`Passkey ${response.result.userData.isPassKeyEnabled ? 'enabled' : 'disabled'} successfully`);
            this.loadData()
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
  }

  private async createPassKey() {
    const twoFactorPin = await this.getTwoFactorPin();
    const pendingCreateCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Create, this.token);
    // const message = JSON.stringify(pendingCreateCredential);
    // var publicKey = this.authService.getPublicKey();
    // const encryptedPendingCreateCredential = await this.encryptService.encryptWithPem_Chunk(message, publicKey);

    // const extraHeaders = {
    //   'X-Pending-Create': encryptedPendingCreateCredential
    // };
    const url = `${userDomainUrl}/api/PassKey/Create`;
    const payload = {
      userName: this.userName,
      twoFactorPin: twoFactorPin,
      pendingCreateCredential: pendingCreateCredential
    };
    this.fetchService.fetchPost(url, payload, this.token)
      .then(response => {
        if (response.isSuccess) {
          alert('Passkey created successfully');
        } else {
          if (response.error && response.error.errorMessage) throw new Error(response.error.errorMessage);
          throw new Error('An unknown error occurred');
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
