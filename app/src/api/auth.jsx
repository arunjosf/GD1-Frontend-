const BASE = "https://localhost:7108/api/auth";

// All requests include credentials so cookies are sent/received
const opts = (method, body) => ({
  method,
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  ...(body ? { body: JSON.stringify(body) } : {})
});

export const authApi = {
  register: (data) =>
    fetch(`${BASE}/register`, opts("POST", data)).then(r => r.json()),

  login: (data) =>
    fetch(`${BASE}/login`, opts("POST", data)).then(r => r.json()),

  googleLogin: (idToken) =>
    fetch(`${BASE}/google`, opts("POST", { idToken })).then(r => r.json()),

  sendOtp: (email) =>
    fetch(`${BASE}/send-otp`, opts("POST", { email })).then(r => r.json()),

  verifyEmail: (email, otp) =>
    fetch(`${BASE}/verify-email`, opts("POST", { email, otp })).then(r => r.json()),

  refresh: () =>
    fetch(`${BASE}/refresh`, opts("POST")).then(r => r.json()),

  logout: () =>
    fetch(`${BASE}/logout`, opts("POST")).then(r => r.json()),

  me: () =>
    fetch(`${BASE}/me`, opts("GET")).then(r => r.json()),
};