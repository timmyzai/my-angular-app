import { Injectable } from '@angular/core';
import { AES, enc, lib, mode, pad } from 'crypto-js';
import * as forge from 'node-forge';

@Injectable({
    providedIn: 'root'
})
export class EncryptionService {
    constructor() { }
    async encryptWithPem(message: string, publicKeyPem: string): Promise<string> {
        try {
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            if (!publicKey || typeof publicKey.encrypt !== 'function') {
                console.error('Invalid or unsupported public key format');
                throw new Error('Invalid or unsupported public key format.');
            }

            const encryptedBytes = publicKey.encrypt(message, 'RSA-OAEP', { md: forge.md.sha256.create() });
            const encryptedBase64 = forge.util.encode64(encryptedBytes);
            return encryptedBase64;
        } catch (e) {
            console.error('Encryption error:', e);
            throw new Error('Encryption failed. Please verify your input.');
        }
    }
    async encryptWithPem_Chunk(message: string, pemPublicKey: string): Promise<string> {
        const publicKey = forge.pki.publicKeyFromPem(pemPublicKey);
        const dataToEncrypt = forge.util.encodeUtf8(message);
        const maxChunkSize = 190;
        let offset = 0;
        let encryptedData = [];

        // Encrypt in chunks
        while (offset < dataToEncrypt.length) {
            const chunkSize = Math.min(maxChunkSize, dataToEncrypt.length - offset);
            const chunk = dataToEncrypt.substring(offset, offset + chunkSize);
            const encryptedChunk = publicKey.encrypt(chunk, 'RSA-OAEP', {
                md: forge.md.sha256.create()
            });
            encryptedData.push(encryptedChunk);
            offset += chunkSize;
        }

        // Combine all encrypted chunks into one array
        const combinedEncryptedData = encryptedData.join('');
        const encryptedBase64 = forge.util.encode64(combinedEncryptedData);

        return encryptedBase64;
    }
    async encryptString(toEncryptText: string): Promise<string> {
        if (!toEncryptText) return null;
        const key = "timmy's secret phrase is 32 char";
        const keyBytes = enc.Utf8.parse(key);
        const iv = enc.Utf8.parse('');

        const encrypted = AES.encrypt(toEncryptText, keyBytes, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7
        });
        return encrypted.toString();
    }
}
