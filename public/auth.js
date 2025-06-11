// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem("token")
  if (token) {
    // Verify token is still valid
    fetch("/api/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/app"
        } else {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      })
      .catch(() => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      })
  }
}

// Show message function
function showMessage(message, type) {
  const messageDiv = document.getElementById("message")
  messageDiv.textContent = message
  messageDiv.className = `message ${type}`
  messageDiv.style.display = "block"

  setTimeout(() => {
    messageDiv.style.display = "none"
  }, 5000)
}

// Check auth on page load for login/signup pages
if (window.location.pathname === "/login" || window.location.pathname === "/signup") {
  checkAuth()
}
