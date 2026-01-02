import { sign } from 'crypto';

/**
 * Vercel Serverless Function: Gumroad License Signer
 * Refined to match Ed25519 requirements and CLI verification model.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { product_id, license_key } = req.body;

  const privateKeyB64 = process.env.ENVCHK_PRIVATE_KEY;
  const targetProductId = process.env.GUMROAD_PRODUCT_ID;

  if (!product_id || product_id !== targetProductId) {
    return res.status(400).json({ error: 'Invalid product_id' });
  }

  if (!license_key) {
    return res.status(400).json({ error: 'Missing license_key' });
  }

  try {
    // 1. Create payload
    const payload = {
      product: 'envcheck',
      tier: 'pro',
      license_id: license_key,
      issued_at: new Date().toISOString().split('T')[0]
    };

    // 2. Encode payload
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadJson).toString('base64');

    // 3. Load Ed25519 private key
    // Expected: PKCS8 DER Base64 encoded
    const privateKey = Buffer.from(privateKeyB64, 'base64');

    // 4. Sign the base64 payload (Exactly what the CLI will receive)
    const signature = sign(
      null,
      Buffer.from(payloadBase64),
      {
        key: privateKey,
        format: 'der',
        type: 'pkcs8'
      }
    );

    const signatureBase64 = signature.toString('base64');

    // 5. Final license format
    const license = `ENVCHK-PRO-${payloadBase64}.${signatureBase64}`;

    // 6. Return for Gumroad injection
    return res.status(200).json({
      ENVCHK_LICENSE: license
    });

  } catch (err) {
    console.error('License signing failed:', err);
    return res.status(500).json({ error: 'Signing failed' });
  }
}
