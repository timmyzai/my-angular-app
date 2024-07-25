import { Component, OnInit } from '@angular/core';
import { walletDomainUrl } from 'src/shared/contants';
import { AuthService } from 'src/shared/services/auth/auth.services';
import { EncryptionService } from 'src/shared/services/helper/encryption.services';
import { FetchService } from 'src/shared/services/helper/fetch.services';
import { ApiCallType, PassKeyChallengeHelper } from 'src/shared/services/helper/passKeyChallenge.services';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit {
  transferData = {
    symbol: 'USDT',
    amount: 10000,
    remark: 'timtest',
    twoFactorPin: '123456',
    ownerWalletGroupsId: "",
    receiverWalletAddress: '0x6A3B0Bd4E8C7Cbb06C871BCfcc7984C4ddcA96f1',
    network: 'ETH',
    pendingVerifyCredential: ''
  };
  walletGroups: any[] = [];
  ownerWalletGroupsId: string = '';
  token: string | null | undefined;
  username: string;
  transferMethod: string = 'tfa';

  constructor(
    private authService: AuthService,
    private fetchService: FetchService,
    private EncryptionService: EncryptionService
  ) { }

  ngOnInit(): void {
    this.token = this.authService.getAccessToken();
    var rememberMe = JSON.parse(localStorage.getItem('rememberMe'));
    if (rememberMe) {
      const rememberData = this.authService.getRememberData();
      if (rememberData) {
        this.username = rememberData.username || '';
      }
    }
    this.getWalletGroups();
  }

  selectWalletGroup(event: any) {
    console.log(event.target.value);
    this.transferData.ownerWalletGroupsId = event.target.value;
  }

  getWalletGroups() {
    const url = `${walletDomainUrl}/api/WalletGroups/GetMyWalletGroupLite`;
    this.fetchService.fetchGet(url, this.token)
      .then(data => {
        if (data.isSuccess) {
          this.walletGroups = data.result;
          this.transferData.ownerWalletGroupsId = this.walletGroups[0].id;
        } else {
          console.error('Error:', data.error);
        }
      })
      .catch((error) => console.error('Error:', error));
  }

  async transfer() {
    var pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Login, null, this.username)

    const url = `${walletDomainUrl}/api/Transactions/Transfer`;
    return this.fetchService.fetchPost(url, this.transferData, this.token)
      .then(data => {
        if (data.isSuccess) {
          console.log('Transfer successful:', data);
          this.transferData = {
            symbol: '',
            amount: 0,
            remark: '',
            twoFactorPin: '',
            ownerWalletGroupsId: null,
            receiverWalletAddress: '',
            network: '',
            pendingVerifyCredential: pendingVerifyCredential
          };
        } else if (data.error !== null && data.error.errorMessage !== null && data.error.errorMessage) {
          throw new Error(data.error.errorMessage);
        } else {
          throw new Error('An unknown error occurred');
        }
      })
      .catch(error => {
        console.error('Transfer failed:', error);
        alert('Transfer failed: ' + error.message);
        throw error;
      });
  }

  async encrptyedTransfer() {
    const url = `${walletDomainUrl}/api/v2.0/Transactions/Transfer`;
    var publicKey = this.authService.getPublicKey();
    const encrptyedData = await this.EncryptionService.encryptWithPem_Chunk(JSON.stringify(this.transferData), publicKey);

    var body = {
      EncryptedData: encrptyedData,
      PendingVerifyCredential: null as any,
    };

    debugger;
    console.log("transferMethod", this.transferMethod);
    if (this.transferMethod === 'passkey') {
      var pendingVerifyCredential = await PassKeyChallengeHelper.getChallenge(ApiCallType.Login, null, this.username)
      body.PendingVerifyCredential = pendingVerifyCredential;
    }


    return this.fetchService.fetchPost(url, body, this.token)
      .then(data => {
        if (data.isSuccess) {
          console.log('EncrptyedTransfer successful:', data);
          this.transferData = {
            symbol: '',
            amount: 0,
            remark: '',
            twoFactorPin: '',
            ownerWalletGroupsId: null,
            receiverWalletAddress: '',
            network: '',
            pendingVerifyCredential: ''
          };
        } else if (data.error !== null && data.error.errorMessage !== null && data.error.errorMessage) {
          throw new Error(data.error.errorMessage);
        } else {
          throw new Error('An unknown error occurred');
        }
      })
      .catch(error => {
        console.error('EncrptyedTransfer failed:', error);
        alert('EncrptyedTransfer failed: ' + error.message);
        throw error;
      });
  }
}
