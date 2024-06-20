declare module 'src/assets/js/encryption.js' {
    export function encryptWithPemSHA256(message: object | string, publicKeyPem: string): Promise<string>;
}
