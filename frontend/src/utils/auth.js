export function logout() {
  localStorage.removeItem("nexora_token");
  localStorage.removeItem("nexora_logged_in");

  window.location.replace("/login");
}