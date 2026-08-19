const crypto = require("crypto");

const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000; // 72h

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payloadObj, secret) {
  const payload = base64url(JSON.stringify(payloadObj));
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest();
  const signature = base64url(hmac);
  return `${payload}.${signature}`;
}

function verify(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw new Error("Jeton invalide.");
  }
  const [payload, signature] = token.split(".");
  const expected = base64url(crypto.createHmac("sha256", secret).update(payload).digest());

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Signature invalide.");
  }

  const data = JSON.parse(base64urlDecode(payload));
  if (!data.exp || Date.now() > data.exp) {
    throw new Error("Lien expiré.");
  }
  return data;
}

function createDownloadToken({ sessionId, secret, ttlMs = DEFAULT_TTL_MS }) {
  return sign({ sid: sessionId, exp: Date.now() + ttlMs }, secret);
}

module.exports = { createDownloadToken, verify };
