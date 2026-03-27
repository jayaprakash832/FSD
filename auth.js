document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-auth-form]")
  const toast = document.getElementById("toast")

  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target")
      const input = document.getElementById(targetId)
      if (!input) return
      input.type = input.type === "password" ? "text" : "password"
      btn.textContent = input.type === "password" ? "Show" : "Hide"
    })
  })

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const authType = form.getAttribute("data-auth-form")
      showToast(
        authType === "signup" ? "Account created!" : "Welcome back!"
      )
      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 900)
    })
  }

  function showToast(message) {
    if (!toast) return
    toast.textContent = message
    toast.classList.add("show")
    setTimeout(() => toast.classList.remove("show"), 2200)
  }
})
