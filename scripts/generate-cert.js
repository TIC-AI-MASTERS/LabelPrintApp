import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output paths
const certPath = path.join(__dirname, '../src/assets/digital-certificate-v2.txt');
const keyPath = path.join(__dirname, '../src/assets/private-key-v2.pem');

console.log("Generating 2048-bit key-pair...");
const keys = forge.pki.rsa.generateKeyPair(2048);
console.log("Key-pair generated.");

console.log("Creating certificate...");
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '02'; // v2
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2); // 2 years validity
const attrs = [{
    name: 'commonName',
    value: 'Tica Label App V2'
}, {
    name: 'countryName',
    value: 'NL'
}, {
    shortName: 'ST',
    value: 'Noord-Holland'
}, {
    name: 'localityName',
    value: 'Aalsmeer'
}, {
    name: 'organizationName',
    value: 'Tica'
}, {
    shortName: 'OU',
    value: 'IT'
}];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey, forge.md.sha256.create());

console.log("Saving certificate and private key...");

// PEM-format keys and cert
const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
const pemCert = forge.pki.certificateToPem(cert);

// Ensure assets directory exists
const assetsDir = path.dirname(certPath);
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(certPath, pemCert);
fs.writeFileSync(keyPath, pemKey);

console.log(`
---------------------------------------------------
Certificate generated successfully!
---------------------------------------------------
Certificate: ${certPath}
Private Key: ${keyPath}

INSTRUCTIONS:
1. Open QZ Tray
2. Go to Advanced -> Site Certificates
3. Import the file: src/assets/digital-certificate.txt
---------------------------------------------------
`);
