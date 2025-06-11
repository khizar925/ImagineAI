let currentImageData = null;
let currentImageId = null;
let historyCache = [];
let isHistoryLoading = false;
let currentPage = 0;
const ITEMS_PER_PAGE = 12;
let hasMoreItems = true;

// Image cache for faster loading
const imageCache = new Map();

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
  document
    .getElementById("loadMoreBtn")
    .addEventListener("click", loadMoreHistory);

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
        created_at: new Date().toISOString(),
      };
      historyCache.unshift(newHistoryItem);

      // Cache the new image
      imageCache.set(data.imageId, data.imageData);

      // Refresh history display
      displayHistory(historyCache.slice(0, (currentPage + 1) * ITEMS_PER_PAGE));

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

// Load history metadata only (fast)
async function loadHistoryAsync() {
  if (isHistoryLoading) return;

  isHistoryLoading = true;
  const token = checkAuth();

  // Show loading indicator in history
  const historyContainer = document.getElementById("historyContainer");
  historyContainer.innerHTML =
    '<div class="history-loading"><div class="mini-spinner"></div><p>Loading your creations...</p></div>';

  try {
    const response = await fetch(
      `/api/history-metadata?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (currentPage === 0) {
        historyCache = data.items;
      } else {
        historyCache = [...historyCache, ...data.items];
      }

      hasMoreItems = data.hasMore;
      displayHistory(historyCache);

      // Show/hide load more button
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      loadMoreBtn.style.display = hasMoreItems ? "block" : "none";
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

// Load more history items
async function loadMoreHistory() {
  currentPage++;
  await loadHistoryAsync();
}

// Load individual image when needed
async function loadImage(imageId) {
  // Check cache first
  if (imageCache.has(imageId)) {
    return imageCache.get(imageId);
  }

  const token = checkAuth();

  try {
    const response = await fetch(`/api/image/${imageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Cache the image
      imageCache.set(imageId, data.imageData);
      return data.imageData;
    }
  } catch (error) {
    console.error("Error loading image:", error);
  }

  return null;
}

// Display history with optimized lazy loading
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

    // Create placeholder initially
    historyItem.innerHTML = `
      <div class="image-placeholder-small" data-image-id="${item.id}">
        <div class="placeholder-icon-small">🖼️</div>
        <div class="loading-spinner-small" style="display: none;"></div>
      </div>
      <div class="history-item-prompt">${item.prompt}</div>
      <div class="history-item-date">${new Date(
        item.created_at
      ).toLocaleDateString()}</div>
    `;

    // Add click handler
    historyItem.onclick = async () => {
      const imageData = await loadImage(item.id);
      if (imageData) {
        displayImage(imageData, item.prompt);
      }
    };

    fragment.appendChild(historyItem);
  });

  historyContainer.innerHTML = "";
  historyContainer.appendChild(fragment);

  // Set up intersection observer for lazy loading
  setupLazyLoading();
}

// Setup intersection observer for lazy loading images
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const placeholder = entry.target;
          const imageId = placeholder.dataset.imageId;

          if (imageId && !placeholder.classList.contains("loaded")) {
            // Show loading spinner
            const spinner = placeholder.querySelector(".loading-spinner-small");
            const icon = placeholder.querySelector(".placeholder-icon-small");

            spinner.style.display = "block";
            icon.style.display = "none";

            // Load the image
            const imageData = await loadImage(imageId);

            if (imageData) {
              // Replace placeholder with actual image
              placeholder.outerHTML = `<img src="${imageData}" alt="Generated image" loading="lazy" />`;
            } else {
              // Show error state
              spinner.style.display = "none";
              icon.style.display = "block";
              icon.textContent = "❌";
            }

            placeholder.classList.add("loaded");
            imageObserver.unobserve(entry.target);
          }
        }
      }
    },
    {
      rootMargin: "50px", // Start loading 50px before the image comes into view
    }
  );

  // Observe all image placeholders
  document
    .querySelectorAll(".image-placeholder-small")
    .forEach((placeholder) => {
      imageObserver.observe(placeholder);
    });
}

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", initApp);
