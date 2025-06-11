let currentImageData = null;
let currentImageId = null;
let historyCache = [];
let isHistoryLoading = false;

// Check authentication
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return false;
  }
  return token;
}

// Initialize app
function initApp() {
  const token = checkAuth();
  if (!token) return;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById(
    "userWelcome"
  ).textContent = `Welcome, ${user.username}!`;

  // Load history immediately but asynchronously
  loadHistoryAsync();
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  document
    .getElementById("generateBtn")
    .addEventListener("click", generateImage);
  document
    .getElementById("downloadBtn")
    .addEventListener("click", downloadImage);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Enter key in prompt input
  document.getElementById("promptInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      generateImage();
    }
  });
}

// Generate image
async function generateImage() {
  const prompt = document.getElementById("promptInput").value.trim();
  if (!prompt) {
    alert("Please enter a prompt");
    return;
  }

  const token = checkAuth();
  const generateBtn = document.getElementById("generateBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");

  generateBtn.textContent = "Generating...";
  generateBtn.disabled = true;
  loadingOverlay.style.display = "flex";

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (response.ok) {
      displayImage(data.imageData, prompt);
      currentImageData = data.imageData;
      currentImageId = data.imageId;
      document.getElementById("imageActions").style.display = "flex";

      // Add new image to history cache immediately
      const newHistoryItem = {
        id: data.imageId,
        prompt: prompt,
        image_data: data.imageData,
        created_at: new Date().toISOString(),
      };
      historyCache.unshift(newHistoryItem);
      displayHistory(historyCache);

      // Show note if using fallback method
      if (data.note) {
        const noteDiv = document.createElement("div");
        noteDiv.style.cssText =
          "background: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;";
        noteDiv.textContent = data.note;
        document
          .getElementById("imageContainer")
          .parentNode.appendChild(noteDiv);

        setTimeout(() => {
          noteDiv.remove();
        }, 5000);
      }
    } else {
      alert(data.error || "Failed to generate image");
      if (data.details) {
        console.error("Error details:", data.details);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Network error. Please try again.");
  }

  generateBtn.textContent = "Generate Image";
  generateBtn.disabled = false;
  loadingOverlay.style.display = "none";
}

// Display image
function displayImage(imageData, prompt) {
  const imageContainer = document.getElementById("imageContainer");
  imageContainer.innerHTML = `
        <img src="${imageData}" alt="${prompt}" />
    `;
  imageContainer.classList.add("has-image");
}

// Download image
function downloadImage() {
  if (!currentImageData) {
    alert("No image to download");
    return;
  }

  const link = document.createElement("a");
  link.href = currentImageData;
  link.download = `imagineai-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Load history asynchronously with optimization
async function loadHistoryAsync() {
  if (isHistoryLoading) return;

  isHistoryLoading = true;
  const token = checkAuth();

  // Show loading indicator in history
  const historyContainer = document.getElementById("historyContainer");
  historyContainer.innerHTML =
    '<div class="history-loading"><div class="mini-spinner"></div><p>Loading your creations...</p></div>';

  try {
    const response = await fetch("/api/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const history = await response.json();
      historyCache = history;
      displayHistory(history);
    } else {
      throw new Error("Failed to load history");
    }
  } catch (error) {
    console.error("Error loading history:", error);
    historyContainer.innerHTML =
      '<div class="history-error"><p>Failed to load history. <button onclick="loadHistoryAsync()" class="retry-btn">Retry</button></p></div>';
  }

  isHistoryLoading = false;
}

// Display history with lazy loading optimization
function displayHistory(history) {
  const historyContainer = document.getElementById("historyContainer");

  if (history.length === 0) {
    historyContainer.innerHTML =
      '<div class="history-placeholder"><p>Your image history will appear here</p></div>';
    return;
  }

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();

  history.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.onclick = () => displayImage(item.image_data, item.prompt);

    // Lazy load images after the first few
    if (index < 10) {
      historyItem.innerHTML = `
        <img src="${item.image_data}" alt="${item.prompt}" loading="lazy" />
        <div class="history-item-prompt">${item.prompt}</div>
        <div class="history-item-date">${new Date(
          item.created_at
        ).toLocaleDateString()}</div>
      `;
    } else {
      historyItem.innerHTML = `
        <div class="image-placeholder-small" data-src="${item.image_data}">
          <div class="placeholder-icon-small">🖼️</div>
        </div>
        <div class="history-item-prompt">${item.prompt}</div>
        <div class="history-item-date">${new Date(
          item.created_at
        ).toLocaleDateString()}</div>
      `;

      // Lazy load when scrolled into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const placeholder = entry.target.querySelector(
              ".image-placeholder-small"
            );
            if (placeholder) {
              const src = placeholder.dataset.src;
              placeholder.outerHTML = `<img src="${src}" alt="${item.prompt}" loading="lazy" />`;
              observer.unobserve(entry.target);
            }
          }
        });
      });
      observer.observe(historyItem);
    }

    fragment.appendChild(historyItem);
  });

  historyContainer.innerHTML = "";
  historyContainer.appendChild(fragment);
}

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", initApp);
