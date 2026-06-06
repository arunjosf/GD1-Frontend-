const BASE = "https://localhost:7108/api/auth";

export const getToken = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const opts = (method, body) => {
  const token = getToken('AccessToken');
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  };
};

const saveTokens = (res) => {
  const data = res?.data || res;
  const access = data?.accessToken || data?.AccessToken;
  const refresh = data?.refreshToken || data?.RefreshToken;
  
  if (access && access !== 'undefined') {
    document.cookie = `AccessToken=${access}; path=/; max-age=1296000;`;
    document.cookie = `RefreshToken=${refresh}; path=/; max-age=1296000;`;
  }
};

export const authApi = {
  register: (data) =>
    fetch(`${BASE}/register`, opts("POST", data))
      .then(r => r.json())
      .then(res => { saveTokens(res); return res; }),

  login: (data) =>
    fetch(`${BASE}/login`, opts("POST", data))
      .then(r => r.json())
      .then(res => { saveTokens(res); return res; }),

  googleLogin: (idToken) =>
    fetch(`${BASE}/google`, opts("POST", { idToken }))
      .then(r => r.json())
      .then(res => { saveTokens(res); return res; }),

  sendOtp: (email) =>
    fetch(`${BASE}/send-otp`, opts("POST", { email })).then(r => r.json()),

  verifyEmail: (email, otp) =>
    fetch(`${BASE}/verify-email`, opts("POST", { email, otp }))
      .then(r => r.json())
      .then(res => { saveTokens(res); return res; }),

  refresh: () => {
    const rToken = getToken("RefreshToken");
    return fetch(`${BASE}/refresh`, opts("POST", { refreshToken: rToken }))
      .then(r => r.json())
      .then(res => { saveTokens(res); return res; });
  },

  logout: () => {
    const rToken = getToken("RefreshToken");
    document.cookie = "AccessToken=; path=/; max-age=0;";
    document.cookie = "RefreshToken=; path=/; max-age=0;";
    return fetch(`${BASE}/logout`, opts("POST", { refreshToken: rToken })).then(r => r.json());
  },

  me: async () => {
    try {
      const r = await fetch(`${BASE}/me`, opts("GET"));
      if (!r.ok) {
        return null;
      }
      return await r.json();
    } catch {
      return { success: false, message: 'Could not connect to the server' };
    }
  },

  forgotPassword: (email) =>
    fetch(`${BASE}/forgot-password`, opts("POST", { email })).then(r => r.json()),

  resetPassword: (email, otp, newPassword, confirmNewPassword) =>
    fetch(`${BASE}/reset-password`, opts("POST", { email, otp, newPassword, confirmNewPassword })).then(r => r.json()),
};