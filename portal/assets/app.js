const AUTH_KEY = "finance-portal-auth";
const DEMO_USER = "admin";
const DEMO_PASSWORD = "admin123";

const authPanel = document.getElementById("auth-panel");
const appsPanel = document.getElementById("apps-panel");
const loginForm = document.getElementById("login-form");
const logoutButton = document.getElementById("logout-button");
const errorMessage = document.getElementById("error-message");

function render() {
  const isLoggedIn = sessionStorage.getItem(AUTH_KEY) === "true";

  authPanel.classList.toggle("hidden", isLoggedIn);
  appsPanel.classList.toggle("hidden", !isLoggedIn);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === DEMO_USER && password === DEMO_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "true");
    errorMessage.textContent = "";
    render();
    return;
  }

  sessionStorage.removeItem(AUTH_KEY);
  errorMessage.textContent = "Invalid credentials. Use the default demo login for now.";
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_KEY);
  render();
});

render();
