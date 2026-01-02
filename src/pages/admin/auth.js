const TOKEN_KEY = 'admin_token';

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function login(username, password) {
  const envUser = import.meta.env.VITE_ADMIN_USER || 'admin';
  const envPass = import.meta.env.VITE_ADMIN_PASS || 'admin123';
  if (username === envUser && password === envPass) {
    localStorage.setItem(TOKEN_KEY, 'ok');
    return true;
  }
  return false;
}