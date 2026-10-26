// Small input-validation helpers shared by the routes.
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

export function str(value, { field = "value", min = 0, max = 500, required = false } = {}) {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string") throw new HttpError(400, `${field} must be text.`);
  const v = value.replace(/\u0000/g, "").trim();
  if (required && !v) throw new HttpError(400, `${field} is required.`);
  if (v && v.length < min) throw new HttpError(400, `${field} must be at least ${min} characters.`);
  if (v.length > max) throw new HttpError(400, `${field} must be at most ${max} characters.`);
  return v;
}

export function oneOf(value, list, field) {
  if (!list.includes(value)) throw new HttpError(400, `Choose a valid ${field}.`);
  return value;
}

const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAGIC = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  webp: (b) => b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP",
};

// Accepts a data: URL produced by the browser (already re-encoded, so EXIF is gone).
export function parseImage(dataUrl, maxBytes = 2_500_000) {
  if (!dataUrl) return null;
  if (typeof dataUrl !== "string") throw new HttpError(400, "Image must be a data URL.");
  const m = dataUrl.match(IMAGE_RE);
  if (!m) throw new HttpError(400, "Only JPEG, PNG or WebP images are accepted.");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > maxBytes) throw new HttpError(413, "Image is too large (max 2.5 MB).");
  if (!MAGIC[m[1]](buf)) throw new HttpError(400, "That file doesn't look like a real image.");
  return { ext: m[1] === "jpeg" ? "jpg" : m[1], mediaType: `image/${m[1]}`, buffer: buf, data: m[2] };
}

// 8-128 characters with at least one letter and one digit (any script).
export function checkPassword(value, field = "Password") {
  const pw = typeof value === "string" ? value : "";
  if (pw.length < 8 || pw.length > 128 || !/\p{L}/u.test(pw) || !/\p{Nd}/u.test(pw)) {
    throw new HttpError(400, `${field} needs 8+ characters with at least one letter and one number.`);
  }
  return pw;
}

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
