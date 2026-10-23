// PII redaction. Applied to (a) anything sent to the AI provider and (b) free
// text we store in community reports. The reported entity itself (scammer's
// handle / number) is stored separately on purpose.

const RULES = [
  { type: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, mask: () => "[email]" },
  // OTP / PIN codes next to the keyword - keep the keyword, hide the digits.
  {
    type: "otp",
    re: /\b(otp|one[- ]time password|pin|mpin|cvv|passcode|password)(\s*(?:is|:|-|=)?\s*)(\d{3,8})\b/gi,
    mask: (_m, k, sep) => `${k}${sep}[code]`,
  },
  { type: "pan", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g, mask: () => "[PAN]" },
  { type: "aadhaar", re: /(?<!\d)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g, mask: () => "[Aadhaar]" },
  {
    type: "account",
    re: /\b(a\/c|acct|account|ac no|account no|account number|khata|खाता)(\s*(?:no\.?|number)?\s*[:\-]?\s*)(\d{9,18})\b/gi,
    mask: (_m, k, sep, d) => `${k}${sep}[account ••${d.slice(-2)}]`,
  },
  { type: "card", re: /(?<!\d)(?:\d{4}[\s-]){3}\d{4}(?!\d)/g, mask: () => "[card]" },
  // UPI IDs: hide the personal part but keep the handle so "@valid" vs personal is still visible.
  {
    type: "upi",
    re: /\b[a-z0-9][a-z0-9._-]{1,63}@([a-z][a-z0-9]{2,30})\b(?![@\w-]|\.\w)/gi,
    mask: (_m, handle) => `[upi]@${handle}`,
  },
  {
    type: "phone",
    re: /(?<![\d+])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g,
    mask: (m) => `[phone ••${m.replace(/\D/g, "").slice(-2)}]`,
  },
];

export function redact(text) {
  if (!text) return { text: "", counts: {} };
  let out = String(text);
  const counts = {};
  for (const rule of RULES) {
    out = out.replace(rule.re, (...args) => {
      counts[rule.type] = (counts[rule.type] || 0) + 1;
      return rule.mask(...args);
    });
  }
  return { text: out, counts };
}

export function maskPhone(value) {
  const d = String(value).replace(/\D/g, "").slice(-10);
  if (d.length < 10) return value;
  return `+91 ${d.slice(0, 2)}XXX XX${d.slice(-3)}`;
}
