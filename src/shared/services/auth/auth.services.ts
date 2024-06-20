import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { userDomainUrl } from '../../contants';
import { FetchService } from '../helper/fetch.services';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.isLoggedIn());
    private accessToken: string = '';
    private publicKey: string = '';
    private rememberDataKey = 'rememberData';

    constructor(private router: Router, private fetchService: FetchService) {
        this.isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    }

    isLoggedIn(): boolean {
        return !!this.getAccessToken() && !!this.getPublicKey();
    }

    isLoggedInObservable(): Observable<boolean> {
        return this.isLoggedInSubject.asObservable();
    }

    setIsLoggedIn(isLoggedIn: boolean): void {
        this.isLoggedInSubject.next(isLoggedIn);
    }

    login(username: string, password: string, tfa: string): Promise<void> {
        const url = `${userDomainUrl}/api/User/Login`;
        const body = {
            userLoginIdentityAddress: username,
            password: password,
            twoFactorPin: tfa
        };

        return this.fetchService.fetchPost(url, body)
            .then(data => {
                if (data.isSuccess) {
                    this.accessToken = data.result?.encryptedAccessToken || '';
                    this.publicKey = data.result?.publicKey || '';

                    localStorage.setItem('accessToken', this.accessToken);
                    localStorage.setItem('publicKey', this.publicKey);

                    this.setIsLoggedIn(true);
                    this.router.navigate(['/dashboard']); // Navigate after successful login
                } else if (data.error !== null && data.error.errorMessage !== null && data.error.errorMessage) {
                    throw new Error(data.error.errorMessage);
                } else {
                    throw new Error('An unknown error occurred');
                }
            })
            .catch(error => {
                console.error('Login failed:', error);
                alert('Login failed: ' + error.message);
                throw error;
            });
    }

    logout(): void {
        const url = `${userDomainUrl}/api/User/Logout`;
        this.fetchService.fetchPost(url, {}, this.getAccessToken())
            .then(() => {
                // Remove access token and public key
                this.accessToken = '';
                this.publicKey = '';

                localStorage.removeItem('accessToken');
                localStorage.removeItem('publicKey');
                // Navigate to the login page
                this.router.navigate(['/login']);
                this.setIsLoggedIn(false);
            })
    }

    getAccessToken(): string {
        return this.accessToken || localStorage.getItem('accessToken') || '';
    }

    getPublicKey(): string {
        return this.publicKey || localStorage.getItem('publicKey') || '';
    }

    cacheRememberData(username: string, password: string, tfa: string): void {
        const rememberData = { username, password, tfa };
        localStorage.setItem(this.rememberDataKey, JSON.stringify(rememberData));
    }

    getRememberData(): { username: string, password: string, tfa: string } | null {
        const rememberDataString = localStorage.getItem(this.rememberDataKey);
        return rememberDataString ? JSON.parse(rememberDataString) : null;
    }

    passwordlessLogin(username: string, pendingVerifyCredential: any): void {
        const url = `${userDomainUrl}/api/User/LoginWithPassKey`;
        const body = {
            userLoginIdentityAddress: username,
            pendingVerifyCredential: pendingVerifyCredential
        };
        this.fetchService.fetchPost(url, body)
            .then(data => {
                if (data.isSuccess) {
                    this.accessToken = data.result?.encryptedAccessToken || '';
                    this.publicKey = data.result?.publicKey || '';

                    localStorage.setItem('accessToken', this.accessToken);
                    localStorage.setItem('publicKey', this.publicKey);

                    this.setIsLoggedIn(true);
                    this.router.navigate(['/dashboard']);
                } else {
                    throw new Error(data.error.errorMessage);
                }
            })
            .catch(error => {
                console.error('Login failed:', error);
                alert('Login failed: ' + error.message);
                throw error;
            });

    }
}
