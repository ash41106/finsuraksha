export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || (status ? `Request failed (${status})` : "Network error - please check your connection."));
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

async function request(method, url, body) {
  const opts = { method, headers: { Accept: "application/json" }, credentials: "same-origin" };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new ApiError(0, null);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body = {}) => request("POST", url, body),
  patch: (url, body = {}) => request("PATCH", url, body),
  del: (url, body = {}) => request("DELETE", url, body),
};
