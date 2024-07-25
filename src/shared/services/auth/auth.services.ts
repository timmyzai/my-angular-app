import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { userDomainUrl } from '../../contants';
import { FetchService } from '../helper/fetch.services';
import { EncryptionService } from '../helper/encryption.services';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.isLoggedIn());
    private accessToken: string = '';
    private publicKey: string = '';
    private rememberDataKey = 'rememberData';
    private userId: string = '';

    constructor(
        private router: Router,
        private fetchService: FetchService,
        private encryptService: EncryptionService
    ) {
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

    async refreshSession(): Promise<void> {
        if (this.isLoggedIn()) {
            const url = `${userDomainUrl}/api/User/RefreshSession`;
            const token = this.getAccessToken();

            await this.fetchService.fetchGet(url, token).then((response) => {
                if (response.isSuccess) {
                    this.accessToken = response.result.encryptedAccessToken;
                    localStorage.setItem('accessToken', this.accessToken);
                }
                else {
                    this.logout();
                }
            }).catch((error) => {
                this.logout();
                console.error('Failed to refresh session:', error);
            });
        }
    }

    login(username: string, password: string, tfa: string, rememberMe: boolean): Promise<void> {
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
                    this.userId = data.result?.user?.userId || '';

                    localStorage.setItem('accessToken', this.accessToken);
                    localStorage.setItem('publicKey', this.publicKey);
                    localStorage.setItem('userId', this.userId);
                    localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
                    if (rememberMe) {
                        this.cacheRememberData(username, password, tfa);
                    }
                    this.setIsLoggedIn(true);
                    this.router.navigate(['/dashboard']);
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

    getUserId(): string {
        return this.userId || localStorage.getItem('userId') || '';
    }
    cacheRememberData(username: string, password: string, tfa: string): void {
        const rememberData = { username, password, tfa };
        localStorage.setItem(this.rememberDataKey, JSON.stringify(rememberData));
    }

    getRememberData(): { username: string, password: string, tfa: string } | null {
        const rememberDataString = localStorage.getItem(this.rememberDataKey);
        return rememberDataString ? JSON.parse(rememberDataString) : null;
    }

    async passwordlessLogin(username: string, pendingVerifyCredential: any): Promise<void> {
        const url = `${userDomainUrl}/api/User/LoginWithPassKey`;
        const body = {
            userLoginIdentityAddress: username,
            pendingVerifyCredential: pendingVerifyCredential
        };

        // const message = await this.encryptService.encryptString(JSON.stringify(pendingVerifyCredential));
        // const extraHeaders = {
        //     'X-Pending-Login': message
        // };

        this.fetchService.fetchPost(url, body, null)
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
