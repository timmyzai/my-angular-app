import { Injectable } from '@angular/core';
import * as forge from 'node-forge';

@Injectable({
    providedIn: 'root'
})
export class EccEncryptionService {
    constructor() { }
    async encryptWithPem(message: string, publicKeyPem: string): Promise<string> {
        try {
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            if (publicKey && typeof publicKey.encrypt === 'function') {
                const encryptedBytes = publicKey.encrypt(message, 'RSAES-PKCS1-V1_5');
                const encryptedBase64 = forge.util.encode64(encryptedBytes);

                return encryptedBase64;
            } else {
                console.error('Invalid or unsupported public key format');
                throw new Error('Invalid or unsupported public key format.');
            }
        } catch (e) {
            console.error('Encryption error:', e);
            throw new Error('Encryption failed. Please verify your input.');
        }
    }
}
