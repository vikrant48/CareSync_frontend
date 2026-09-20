const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
    const env = {};
    if (!fs.existsSync(filePath)) return env;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            env[key] = val;
        }
    });
    return env;
}

const envPath = path.join(__dirname, '..', '.env');
const parsed = parseEnv(envPath);

const apiBaseUrl = process.env.API_BASE_URL || parsed.API_BASE_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID || parsed.GOOGLE_CLIENT_ID || '';
const merchantUpiId = process.env.MERCHANT_UPI_ID || parsed.MERCHANT_UPI_ID || 'caresync@paytm';
const qrCodeBaseUrl = process.env.QR_CODE_BASE_URL || parsed.QR_CODE_BASE_URL || `upi://pay?pa=${merchantUpiId}&pn=CareSync&cu=INR`;
const jitsiDomain = process.env.JITSI_DOMAIN || parsed.JITSI_DOMAIN || 'meet.jit.si';

const targetDir = path.join(__dirname, '..', 'environments');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const envFileContent = `// Auto-generated environment file (Do NOT edit directly or commit secrets)
export const environment = {
  apiBaseUrl: '${apiBaseUrl}',
  googleClientId: '${googleClientId}',
  qrCodeBaseUrl: '${qrCodeBaseUrl}',
  merchantUpiId: '${merchantUpiId}',
  jitsiDomain: '${jitsiDomain}'
};
`;

fs.writeFileSync(path.join(targetDir, 'environment.ts'), envFileContent);
fs.writeFileSync(path.join(targetDir, 'environment.prod.ts'), envFileContent);

console.log(`✅ Angular environment files generated successfully with API_BASE_URL: ${apiBaseUrl}`);
