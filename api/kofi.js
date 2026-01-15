import { sign } from 'crypto';

/**
 * Vercel Serverless Function: Ko-fi License Signer
 * Validates Ko-fi webhook and returns a signed Ed25519 license key.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Ko-fi sends data as application/x-www-form-urlencoded if it's a real webhook
  // but the spec says JSON. Let's handle both or assume JSON for now as per spec.
  // Actually, Vercel parses both into req.body.
  const { verification_token, transaction_id, shop_item_id, email, data } = req.body;

  // Ko-fi Webhook may contain a 'data' field which is a JSON string of the order
  let orderData = {};
  if (data) {
    try {
      orderData = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse Ko-fi data field');
    }
  }

  const kofiToken = process.env.KOFI_TOKEN;
  const privateKeyB64 = process.env.ENVCHK_PRIVATE_KEY;
  const targetProductId = process.env.ENVCHK_PRODUCT_ID;

  // 1. Verify Webhook Token
  if (!verification_token || verification_token !== kofiToken) {
    console.error('Invalid verification token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate Product (shop_item_id)
  // Ko-fi may send shop_item_id directly or inside data.shop_item_id
  const actualProductId = shop_item_id || orderData.shop_item_id;
  if (!actualProductId || actualProductId !== targetProductId) {
    console.error(`Invalid product_id: ${actualProductId}`);
    return res.status(400).json({ error: 'Invalid product_id' });
  }

  try {
    // 3. Create payload
    const payload = {
      product: 'envcheck',
      tier: 'pro',
      order_id: transaction_id || orderData.transaction_id || 'manual_txn',
      issued_at: new Date().toISOString().split('T')[0]
    };

    // 4. Encode payload
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadJson).toString('base64');

    // 5. Load Ed25519 private key
    // Expected: PKCS8 DER Base64 encoded (as in gumroad.js)
    const privateKey = Buffer.from(privateKeyB64, 'base64');

    // 6. Sign the base64 payload
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

    // 7. Final license format
    const license = `ENVCHK-PRO-${payloadBase64}.${signatureBase64}`;

    // 8. Return response for Ko-fi to display/email
    return res.status(200).json({
      message: `Your envcheck Pro license:\n${license}\n\nActivate with:\n$ envcheck activate ${license}`
    });

  } catch (err) {
    console.error('License signing failed:', err);
    return res.status(500).json({ error: 'Signing failed' });
  }
}
