import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { verify } from 'crypto';

export class LicenseService {
    // Embedded Public Key (Ed25519)
    // In a real app, this would be obfuscated or packed better.
    private static PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAUB5xnHy1rsC/Tfv1VJvbMpPQ2IyfQMQ5RVGpf8e6vEA=
-----END PUBLIC KEY-----`;

    private static getLicensePath() {
        const home = homedir();
        const dir = join(home, '.envcheck');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        return join(dir, 'license.json');
    }

    static async activate(key: string): Promise<boolean> {
        // Key Format: ENVCHK-PRO-<BASE64_PAYLOAD>.<BASE64_SIGNATURE>
        const parts = key.split('-');
        if (parts.length < 3 || parts[0] !== 'ENVCHK' || parts[1] !== 'PRO') {
            return false;
        }

        // The validation part (after PRO-)
        const dataPart = key.substring('ENVCHK-PRO-'.length);
        const [payloadB64, signatureB64] = dataPart.split('.');

        if (!payloadB64 || !signatureB64) return false;

        try {
            // Verify Signature
            const dataToVerify = Buffer.from(payloadB64);
            const signatureBuffer = Buffer.from(signatureB64, 'base64');

            const isValid = verify(null, dataToVerify, LicenseService.PUBLIC_KEY, signatureBuffer);

            if (!isValid) return false;

            const payloadString = Buffer.from(payloadB64, 'base64').toString('utf8');
            const payload = JSON.parse(payloadString);
            
            // Validate Fields
            if (payload.product !== 'envcheck' || payload.tier !== 'pro') return false;

            // Save License
            const license = {
                license_key: key,
                tier: 'pro',
                payload
            };
            writeFileSync(LicenseService.getLicensePath(), JSON.stringify(license, null, 2));
            return true;

        } catch (e) {
            console.error('License Verification Error:', e);
            return false;
        }
    }

    static checkLicense(): boolean {
        try {
            const path = LicenseService.getLicensePath();
            if (!existsSync(path)) return false;
            
            const content = readFileSync(path, 'utf8');
            const data = JSON.parse(content);
            
            return data.tier === 'pro';
        } catch (e) {
            return false;
        }
    }

    static getLicenseDetails(): any | null {
        try {
            const path = LicenseService.getLicensePath();
            if (!existsSync(path)) return null;
            
            const content = readFileSync(path, 'utf8');
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }
}
