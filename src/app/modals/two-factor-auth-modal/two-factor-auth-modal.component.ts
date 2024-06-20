import { Component, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-two-factor-auth-modal',
  templateUrl: './two-factor-auth-modal.component.html',
  styleUrls: ['./two-factor-auth-modal.component.css']
})
export class TwoFactorAuthModalComponent {
  displayModal: boolean = false;
  otpLength: number = 6;
  otpBoxes: string[] = Array(this.otpLength).fill('');
  isValidInput: boolean = false;
  isInvalidPin: boolean = false;
  twoFactorPinResult: EventEmitter<string> = new EventEmitter<string>();

  hideModal(): void {
    this.twoFactorPinResult.emit(undefined);
    this.otpBoxes = Array(this.otpLength).fill('');
    this.displayModal = false;
  }

  onOtpChange(event: any): void {
    const otp = event.target.value;
    if (otp && isNaN(otp)) {
      event.target.value = otp.slice(0, -1);
      return;
    }

    this.otpBoxes = Array(this.otpLength).fill('');
    for (let i = 0; i < otp.length; i++) {
      this.otpBoxes[i] = otp[i];
    }
    this.isInvalidPin = false;
    this.isValidInput = otp.length === this.otpLength;
  }

  submit(): void {
    const twoFactorPin = this.otpBoxes.join('');
    this.twoFactorPinResult.emit(twoFactorPin);
    this.displayModal = false;
  }
}
