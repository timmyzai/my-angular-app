import { userDomainUrl } from 'src/shared/contants';

export enum ApiCallType {
    Login,
    Verify,
    Create
}

export class PassKeyChallengeHelper {
    static baseUrl: string = `${userDomainUrl}/api/PassKey`;
    public static async getChallenge(callType: ApiCallType, token?: string | null, userLoginIdentityAddress?: string | null): Promise<any> {
        const url = this.getUrlSuffix(callType, userLoginIdentityAddress);
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        try {
            const response = await fetch(url, { method: 'GET', headers });
            if (!response.ok) throw new Error('Network response was not ok.');

            const data = await response.json();

            if (data.error && data.error.errorMessage) throw new Error(data.error.errorMessage);

            if (!data.isSuccess) throw new Error(data.error);
            return await WebAuthnHandler.handleWebAuthnResponse(callType, data);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    private static getUrlSuffix(callType: ApiCallType, userLoginIdentityAddress?: string | null): string {
        switch (callType) {
            case ApiCallType.Login: return `${this.baseUrl}/GetChallengeToLogin?UserLoginIdentityAddress=${encodeURIComponent(userLoginIdentityAddress)}`;
            case ApiCallType.Verify: return `${this.baseUrl}/GetChallengeToVerify`;
            case ApiCallType.Create: return `${this.baseUrl}/GetChallengeToCreate`;
            default: throw new Error('Invalid API call type');
        }
    }
}
class WebAuthnHandler {
    public static async handleWebAuthnResponse(callType: ApiCallType, data: any): Promise<any> {
        const method = callType === ApiCallType.Create ? 'create' : 'get';
        const options = data.result;
        options.challenge = this.base64ToUint8Array(options.challenge);
        if (callType == ApiCallType.Create) {
            options.excludeCredentials = this.mapCredentials(options.excludeCredentials);
            options.user.id = this.base64ToUint8Array(options.user.id);
        } else {
            options.allowCredentials = this.mapCredentials(options.allowCredentials);
        }
        const credential = await navigator.credentials[method]({ publicKey: options }) as PublicKeyCredential;

        if (!credential || credential.type !== 'public-key' || !('response' in credential)) {
            throw new Error('Invalid credential response');
        }
        const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
        return {
            id: credential.id,
            rawId: this.binaryToBase64(credential.rawId),
            type: credential.type,
            response: this.formatResponse(response)
        };
    }
    private static mapCredentials(creds: { id: string }[]) {
        return creds.map(cred => ({
            ...cred,
            id: this.base64ToUint8Array(cred.id)
        }));
    }
    private static formatResponse(response: AuthenticatorResponse): any {
        const responseInfo: any = {
            clientDataJSON: this.binaryToBase64(response.clientDataJSON),
        };
        if (this.isAuthenticatorAssertionResponse(response)) {
            responseInfo.signature = this.binaryToBase64(response.signature);
            responseInfo.authenticatorData = this.binaryToBase64(response.authenticatorData);
            responseInfo.userHandle = response.userHandle ? this.binaryToBase64(response.userHandle) : null;
        }
        if (this.isAuthenticatorAttestationResponse(response)) {
            responseInfo.attestationObject = this.binaryToBase64(response.attestationObject);
        }
        return responseInfo;
    }
    private static base64ToUint8Array(base64String: string): Uint8Array {
        const base64 = base64String.replace(/\-/g, '+').replace(/_/g, '/');
        return Uint8Array.from(window.atob(base64), c => c.charCodeAt(0));
    }
    private static binaryToBase64(binaryData: ArrayBuffer): string {
        return btoa(String.fromCharCode(...new Uint8Array(binaryData)));
    }
    private static isAuthenticatorAssertionResponse(response: any): response is AuthenticatorAssertionResponse {
        return 'signature' in response;
    }
    private static isAuthenticatorAttestationResponse(response: any): response is AuthenticatorAttestationResponse {
        return 'attestationObject' in response;
    }
}
