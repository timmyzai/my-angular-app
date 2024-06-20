const forge = require('node-forge');

function encryptWithPemSHA256(message, publicKeyPem) {
    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const md = forge.md.sha256.create();
        const keySizeBytes = publicKey.n.bitLength() / 8;
        const maxMessageLength = keySizeBytes - 2 * md.digestLength - 2;
        if (typeof message !== 'string' || !IsJsonString(message)) {
            message = JSON.stringify(message);
        }
        const chunks = Array.from({ length: Math.ceil(message.length / maxMessageLength) }, (_, i) =>
            publicKey.encrypt(message.substring(i * maxMessageLength, (i + 1) * maxMessageLength), 'RSA-OAEP', { md: md, mgf1: { md: md } })
        );
        return forge.util.encode64(chunks.join(''));
    } catch (e) {
        console.error('Encryption error:', e);
        throw new Error('Encryption failed. Please verify your input.');
    }
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}
module.exports = { encryptWithPemSHA256 };
