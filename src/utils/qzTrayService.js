import qz from 'qz-tray';
import forge from 'node-forge';

// Load certificate and private key relative to the build
// In Vite, these imports will resolve to the file contents if configured or URLs
// Note: We use ?raw to import the content as string
import certPromise from '../assets/digital-certificate-v2.txt?raw';
import privateKeyPromise from '../assets/private-key-v2.pem?raw';

export const qzTrayService = {
    isConnected: false,

    async connect() {
        if (qz.websocket.isActive()) {
            return;
        }

        // Configure Security
        qz.security.setCertificatePromise(function (resolve, reject) {
            resolve(certPromise);
        });

        qz.security.setSignatureAlgorithm("SHA256"); // SHA256 is required for modern QZ Tray 2.1+

        qz.security.setSignaturePromise(function (toSign) {
            return function (resolve, reject) {
                try {
                    console.log("QZ Signing Request (Forge):", toSign);
                    if (!privateKeyPromise) {
                        throw new Error("Private Key is empty or undefined");
                    }

                    const privateKey = forge.pki.privateKeyFromPem(privateKeyPromise);
                    const md = forge.md.sha256.create();
                    md.update(toSign, 'utf8');
                    const signature = privateKey.sign(md);

                    // node-forge inserts newlines every 64 chars by default. 
                    // QZ Tray (and standard signature validation) expects a single line string.
                    const base64Signature = forge.util.encode64(signature).replace(/[\r\n]/g, '');
                    console.log("Signed successfully (Forge), base64 length:", base64Signature.length);

                    resolve(base64Signature);
                } catch (err) {
                    console.error("QZ Signing Failed:", err);
                    reject(err);
                }
            };
        });

        try {
            await qz.websocket.connect();
            this.isConnected = true;
            console.log("Connected to QZ Tray");
        } catch (err) {
            console.error("Failed to connect to QZ Tray", err);
            throw err;
        }
    },

    async getPrinter(printerName) {
        if (!qz.websocket.isActive()) {
            await this.connect();
        }

        // exact match or contained match
        const printers = await qz.printers.find(printerName);
        return printers;
    },

    async printImages(base64Images, printerConfig) {
        if (!qz.websocket.isActive()) {
            await this.connect();
        }

        const printerName = printerConfig.name;

        // Check printer availability REMOVED for speed. 
        // qz.print will fail if printer not found anyway.
        // try { await qz.printers.find(printerName); } catch (e) { ... }

        const config = qz.configs.create(printerName, {
            size: { width: printerConfig.width, height: printerConfig.height },
            units: 'mm',
            margins: 0,
            scaleContent: false, // OPTIMIZATION: Turning this OFF is the only way to fix the 12s delay.
            density: 203,
            orientation: printerConfig.orientation || 'portrait',
            colorType: 'color',
            copies: 1
        });

        // Create data array from images
        const data = base64Images.map(img => ({
            type: 'pixel',
            format: 'image',
            flavor: 'base64',
            data: img
        }));

        console.log(`Sending ${base64Images.length} images. Size: ${Math.round(base64Images[0].length / 1024)} KB`);

        try {
            await qz.print(config, data);
            console.log(`Sent ${data.length} images to ${printerName}`);
        } catch (err) {
            console.error("Printing failed", err);
            throw err;
        }
    },

    async printPDF(base64Pdf, printerConfig) {
        if (!qz.websocket.isActive()) {
            await this.connect();
        }

        const printerName = printerConfig.name;

        // Check printer check removed for speed

        const config = qz.configs.create(printerName, {
            size: { width: printerConfig.width, height: printerConfig.height },
            units: 'mm',
            margins: 0,
            scaleContent: false, // PDF should be 1:1
            rasterize: false, // OPTIMIZATION: Send Raw PDF to printer (hardware rendering) instead of Java rendering
            density: 203,
            // Orientation: STOPPING AUTO-DETECT. Respecting user manual setting from Printer Manager.
            orientation: printerConfig.orientation || 'portrait',
            colorType: 'color',
            copies: 1
        });

        const data = [{
            type: 'pixel',
            format: 'pdf',
            flavor: 'base64',
            data: base64Pdf
        }];

        console.log(`Sending PDF to ${printerName}. Size: ${Math.round(base64Pdf.length / 1024)} KB`);

        try {
            await qz.print(config, data);
            console.log("Print sent to " + printerName);
        } catch (err) {
            console.error("Printing failed", err);
            throw err;
        }
    }
};
