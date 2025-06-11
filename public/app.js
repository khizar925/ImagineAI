let currentImageData = null
let currentImageId = null
let historyCache = []
let isHistoryLoading = false
let currentPage = 0
const ITEMS_PER_PAGE = 12
let hasMoreItems = true

// Image cache for faster loading
const imageCache = new Map()

// Check authentication
function checkAuth() {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "/login"
    return false
  }
  return token
}

// Initialize app
function initApp() {
  const token = checkAuth()
  if (!token) return

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  document.getElementById("userWelcome").textContent = `Welcome, ${user.username}!`

  // Initialize theme
  initTheme()

  // Load history immediately but asynchronously
  loadHistoryAsync()
  setupEventListeners()
}

// Initialize theme functionality
function initTheme() {
  const themeToggle = document.getElementById("themeToggle")
  const themeIcon = document.getElementById("themeIcon")
  const html = document.documentElement

  // Check for saved theme preference or default to dark mode
  const currentTheme = localStorage.getItem("theme") || "dark"
  html.setAttribute("data-theme", currentTheme)
  updateThemeIcon(currentTheme)

  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    html.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    updateThemeIcon(newTheme)
  })

  function updateThemeIcon(theme) {
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙"
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById("generateBtn").addEventListener("click", generateImage)
  document.getElementById("downloadBtn").addEventListener("click", downloadImage)
  document.getElementById("logoutBtn").addEventListener("click", logout)
  document.getElementById("loadMoreBtn").addEventListener("click", loadMoreHistory)

  // Enter key in prompt input
  document.getElementById("promptInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      generateImage()
    }
  })
}

// Generate image
async function generateImage() {
  const prompt = document.getElementById("promptInput").value.trim()
  if (!prompt) {
    alert("Please enter a prompt")
    return
  }

  const token = checkAuth()
  const generateBtn = document.getElementById("generateBtn")
  const loadingOverlay = document.getElementById("loadingOverlay")

  generateBtn.textContent = "Generating..."
  generateBtn.disabled = true
  loadingOverlay.style.display = "flex"

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log("Image generation successful, displaying image...")
      displayImage(data.imageData, prompt)
      currentImageData = data.imageData
      currentImageId = data.imageId

      // Force show the image section on mobile
      const imageContainer = document.getElementById("imageContainer")
      const imageSection = document.querySelector(".generated-image-section")

      if (imageContainer && imageSection) {
        imageSection.style.display = "flex"
        imageContainer.style.display = "flex"
        console.log("Image container made visible")
      }

      document.getElementById("imageActions").style.display = "flex"

      // Add new image to history cache immediately
      const newHistoryItem = {
        id: data.imageId,
        prompt: prompt,
        created_at: new Date().toISOString(),
      }
      historyCache.unshift(newHistoryItem)

      // Cache the new image
      imageCache.set(data.imageId, data.imageData)

      // Refresh history display
      displayHistory(historyCache.slice(0, (currentPage + 1) * ITEMS_PER_PAGE))

      // Show note if using fallback method
      if (data.note) {
        const noteDiv = document.createElement("div")
        noteDiv.style.cssText =
          "background: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;"
        noteDiv.textContent = data.note
        document.getElementById("imageContainer").parentNode.appendChild(noteDiv)

        setTimeout(() => {
          noteDiv.remove()
        }, 5000)
      }
    } else {
      alert(data.error || "Failed to generate image")
      if (data.details) {
        console.error("Error details:", data.details)
      }
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Network error. Please try again.")
  }

  generateBtn.textContent = "✨ Generate Image"
  generateBtn.disabled = false
  loadingOverlay.style.display = "none"
}

// Display image with iOS Safari fixes
function displayImage(imageData, prompt) {
  const imageContainer = document.getElementById("imageContainer")
  const imageSection = document.querySelector(".generated-image-section")

  console.log("Displaying image on device:", navigator.userAgent.includes("iPhone") ? "iPhone" : "Other")

  // Clear any existing content
  imageContainer.innerHTML = ""

  // Create and configure the image element
  const img = document.createElement("img")
  img.src = imageData
  img.alt = prompt

  // iOS Safari specific styling
  if (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
    img.style.cssText = `
      max-width: 100% !important;
      max-height: 400px !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain !important;
      border-radius: var(--radius-md) !important;
      display: block !important;
      -webkit-transform: translateZ(0) !important;
      transform: translateZ(0) !important;
      -webkit-backface-visibility: hidden !important;
      backface-visibility: hidden !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 1 !important;
    `
  } else {
    img.style.maxWidth = "100%"
    img.style.maxHeight = "100%"
    img.style.objectFit = "contain"
    img.style.borderRadius = "var(--radius-md)"
    img.style.display = "block"
  }

  // Add load event listener for iOS Safari
  img.onload = () => {
    console.log("Image loaded successfully")
    if (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
      // Force repaint on iOS Safari
      imageContainer.style.transform = "translateZ(0)"
      setTimeout(() => {
        imageContainer.style.transform = ""
      }, 10)
    }
  }

  img.onerror = () => {
    console.error("Image failed to load")
    imageContainer.innerHTML = `
      <div class="image-placeholder">
        <div class="placeholder-icon">❌</div>
        <p>Failed to load image</p>
      </div>
    `
  }

  // Add the image to the container
  imageContainer.appendChild(img)
  imageContainer.classList.add("has-image")

  // iOS Safari specific container styling
  if (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
    imageContainer.style.cssText = `
      display: -webkit-flex !important;
      display: flex !important;
      -webkit-justify-content: center !important;
      justify-content: center !important;
      -webkit-align-items: flex-start !important;
      align-items: flex-start !important;
      border: 1px solid var(--border-color) !important;
      background: var(--bg-card) !important;
      padding: 12px !important;
      min-height: auto !important;
      -webkit-transform: translateZ(0) !important;
      transform: translateZ(0) !important;
      -webkit-backface-visibility: hidden !important;
      backface-visibility: hidden !important;
    `
  }

  // Ensure the section is visible on mobile
  if (imageSection) {
    if (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
      imageSection.style.cssText = `
        display: -webkit-flex !important;
        display: flex !important;
        -webkit-flex-direction: column !important;
        flex-direction: column !important;
        gap: 16px !important;
        min-height: 300px !important;
        margin-bottom: 20px !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
      `
    } else {
      imageSection.style.display = "flex"
      imageSection.style.minHeight = "auto"
    }
  }

  // Show download actions
  const imageActions = document.getElementById("imageActions")
  if (imageActions) {
    imageActions.style.display = "flex"
    if (navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
      imageActions.style.cssText = `
        display: -webkit-flex !important;
        display: flex !important;
        gap: 12px !important;
        -webkit-justify-content: center !important;
        justify-content: center !important;
        width: 100% !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
      `
    }
  }

  console.log("Image displayed successfully:", imageData.substring(0, 50) + "...")
}

// Download image
function downloadImage() {
  if (!currentImageData) {
    alert("No image to download")
    return
  }

  const link = document.createElement("a")
  link.href = currentImageData
  link.download = `imagineai-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Load history metadata only (fast)
async function loadHistoryAsync() {
  if (isHistoryLoading) return

  isHistoryLoading = true
  const token = checkAuth()

  // Show loading indicator in history
  const historyContainer = document.getElementById("historyContainer")
  historyContainer.innerHTML =
    '<div class="history-loading"><div class="mini-spinner"></div><p>Loading your creations...</p></div>'

  try {
    const response = await fetch(`/api/history-metadata?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()

      if (currentPage === 0) {
        historyCache = data.items
      } else {
        historyCache = [...historyCache, ...data.items]
      }

      hasMoreItems = data.hasMore
      displayHistory(historyCache)

      // Show/hide load more button
      const loadMoreBtn = document.getElementById("loadMoreBtn")
      loadMoreBtn.style.display = hasMoreItems ? "block" : "none"
    } else {
      throw new Error("Failed to load history")
    }
  } catch (error) {
    console.error("Error loading history:", error)
    historyContainer.innerHTML =
      '<div class="history-error"><p>Failed to load history. <button onclick="loadHistoryAsync()" class="retry-btn">Retry</button></p></div>'
  }

  isHistoryLoading = false
}

// Load more history items
async function loadMoreHistory() {
  currentPage++
  await loadHistoryAsync()
}

// Load individual image when needed
async function loadImage(imageId) {
  // Check cache first
  if (imageCache.has(imageId)) {
    return imageCache.get(imageId)
  }

  const token = checkAuth()

  try {
    const response = await fetch(`/api/image/${imageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      // Cache the image
      imageCache.set(imageId, data.imageData)
      return data.imageData
    }
  } catch (error) {
    console.error("Error loading image:", error)
  }

  return null
}

// Display history with optimized lazy loading
function displayHistory(history) {
  const historyContainer = document.getElementById("historyContainer")

  if (history.length === 0) {
    historyContainer.innerHTML = '<div class="history-placeholder"><p>Your image history will appear here</p></div>'
    return
  }

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment()

  history.forEach((item, index) => {
    const historyItem = document.createElement("div")
    historyItem.className = "history-item"

    // Create placeholder initially
    historyItem.innerHTML = `
      <div class="image-placeholder-small" data-image-id="${item.id}">
        <div class="placeholder-icon-small">🖼️</div>
        <div class="loading-spinner-small" style="display: none;"></div>
      </div>
      <div class="history-item-prompt">${item.prompt}</div>
      <div class="history-item-date">${new Date(item.created_at).toLocaleDateString()}</div>
    `

    // Add click handler
    historyItem.onclick = async () => {
      const imageData = await loadImage(item.id)
      if (imageData) {
        displayImage(imageData, item.prompt)
      }
    }

    fragment.appendChild(historyItem)
  })

  historyContainer.innerHTML = ""
  historyContainer.appendChild(fragment)

  // Set up intersection observer for lazy loading
  setupLazyLoading()
}

// Setup intersection observer for lazy loading images
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const placeholder = entry.target
          const imageId = placeholder.dataset.imageId

          if (imageId && !placeholder.classList.contains("loaded")) {
            // Show loading spinner
            const spinner = placeholder.querySelector(".loading-spinner-small")
            const icon = placeholder.querySelector(".placeholder-icon-small")

            spinner.style.display = "block"
            icon.style.display = "none"

            // Load the image
            const imageData = await loadImage(imageId)

            if (imageData) {
              // Replace placeholder with actual image
              placeholder.outerHTML = `<img src="${imageData}" alt="Generated image" loading="lazy" />`
            } else {
              // Show error state
              spinner.style.display = "none"
              icon.style.display = "block"
              icon.textContent = "❌"
            }

            placeholder.classList.add("loaded")
            imageObserver.unobserve(entry.target)
          }
        }
      }
    },
    {
      rootMargin: "50px", // Start loading 50px before the image comes into view
    },
  )

  // Observe all image placeholders
  document.querySelectorAll(".image-placeholder-small").forEach((placeholder) => {
    imageObserver.observe(placeholder)
  })
}

// Logout
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/"
}

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", initApp)
