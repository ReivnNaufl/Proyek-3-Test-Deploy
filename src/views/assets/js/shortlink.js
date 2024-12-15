// Sidebar toggle functionality
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.querySelector(".sidebar");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");

  // Change icon direction on toggle
  if (sidebar.classList.contains("expanded")) {
    sidebarToggle.innerHTML = '<i data-feather="chevron-left"></i>';
  } else {
    sidebarToggle.innerHTML = '<i data-feather="chevron-right"></i>';
  }

  // Refresh feather icons to update the icon after toggle
  feather.replace();
});

// Dropdown functionality for user profile
const userIcon = document.getElementById("user-icon");
const dropdown = document.getElementById("dropdown");

userIcon.addEventListener("click", () => {
  dropdown.classList.toggle("active");
});

// Refresh feather icons to update chevron down
feather.replace();

function openTab(evt, tabName) {
  let i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Set default tab to open
document.getElementById("defaultOpen").click();

// Function to generate a short link (for demonstration)
function generateShortlink() {
  let url = document.getElementById("urlInput").value;
  alert("Shortlink generated for: " + url);
}

// // Toggle sidebar
// document.getElementById("toggle-btn").addEventListener("click", function () {
//   const sidebar = document.getElementById("sidebar");
//   sidebar.classList.toggle("expanded");
// });

function truncateString(str, maxLength) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  }
  return str;
}

// Handle form submission
document
  .getElementById("short-url-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission
    generateQRCode();
  });

  function generateQRCode() {
    const urlInputElement = document.getElementById("short-url-input");
    const titleInputElement = document.getElementById("title-input");
    const downloadButton = document.getElementById("download-btn");
    const copyButton = document.getElementById("copy-btn");
  
    const urlValue = urlInputElement.value;
    const titleValue = titleInputElement.value;
  
    if (urlValue && titleValue) {
      // Save URL and Title
      const qrData = urlValue; // URL for QR code
  
      // Replace input fields with spans
      const titleSpan = document.createElement("span");
      titleSpan.textContent = titleValue;
      titleInputElement.parentNode.replaceChild(titleSpan, titleInputElement);
  
      const urlSpan = document.createElement("span");
      urlSpan.textContent = urlValue;
      urlInputElement.parentNode.replaceChild(urlSpan, urlInputElement);
  
      // Hide the generate button and show the preview section
      document.getElementById("generate-btn").style.display = "none";
      document.getElementById("qr-preview").style.display = "block";
  
      // Generate short URL
      const shortUrl = generateShortUrl(urlValue);
  
      // Generate QR Code and display it on canvas
      const qrCanvas = document.getElementById("qr-canvas");
      const ctx = qrCanvas.getContext("2d");
      const img = new Image();
  
      // URL for QR code from API
      const qrCodeDataUrl = generateQRCodeFromUrl(qrData);
      console.log("Generated QR Code URL: ", qrCodeDataUrl); // Debug URL
  
      img.onload = function () {
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        ctx.drawImage(img, 0, 0, qrCanvas.width, qrCanvas.height);
  
        // Show download and copy buttons
        downloadButton.style.display = "block";
        copyButton.style.display = "block";
  
        // Function to download the QR Code
        downloadButton.onclick = function () {
          const link = document.createElement("a");
          link.href = qrCodeDataUrl;
          link.download = "qrcode.png";
          link.click();
        };
  
        // Function to copy QR Code to clipboard
        copyButton.onclick = function () {
          copyImageToClipboard(qrCodeDataUrl); // Implement this function if not done
        };
  
        // Display the short URL with the prefix "plb.sh/"
        const cartList = document.getElementById("cart-list");
        const cartItem = document.createElement("li");
        cartItem.classList.add("cart-item");
  
        // Truncate long URL for display
        const shortLongUrl = truncateString(urlValue, 50);
  
        cartItem.innerHTML = `
          <div>
            <p><strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a></p>
            <p><strong>Destination URL:</strong> <a href="${urlValue}" target="_blank">${shortLongUrl}</a></p>
            <p><strong>Custom URL:</strong> <a href="${urlValue}" target="_blank">${urlValue}</a></p>
          </div>  
        `;
  
        cartList.appendChild(cartItem);
      };
  
      img.onerror = function () {
        console.error("Failed to load image.");
        alert("Failed to load QR code. Please try again.");
      };
  
      img.src = qrCodeDataUrl;
    } else {
      alert("Please enter both a valid Title and URL");
    }
  }

function generateShortUrl(userUrl) {
  // Ensure the generated short URL has the prefix 'https://plbsh.polban.dev/' and includes the user-provided URL
  return "https://plbsh.polban.dev/" + encodeURIComponent(userUrl);
}

function generateQRCodeFromUrl(url) {
  // Generate the QR code URL using the provided URL
  return (
    "https://api.qrserver.com/v1/create-qr-code/?data=" +
    encodeURIComponent(url) +
    "&size=300x300"
  );
}

let currentShortlink = "";

// Fungsi untuk render data shortlink history ke HTML
async function renderShortlinkHistory() {
  try {
    const response = await fetch("/shortlink/history");
    const data = await response.json();

    if (!data.success) {
      console.error(data.error);
      return;
    }

    const historyContainer = document.getElementById("History");
    historyContainer.innerHTML = "";

    data.rows.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      const baseURL = window.location.origin;
      const fullURL = `${baseURL}/${item.short_url}`;
      const shortLongUrl = truncateString(item.long_url || "No url available", 50);

      historyItem.dataset.id = item.id;
      historyItem.innerHTML = `
        <i data-feather="link-2"></i>
        <div class="link-details">
          <p class="linkTitle">${item.shortlink_title || "No Title"}</p>
          <p class="shortUrl">${fullURL || "No shorts available"}</p>
          <p class="longUrl">${shortLongUrl}</p>
          <p><i data-feather="calendar"></i> ${item.time_shortlink_created}</p>
        </div>
        <div class="actions">
          <button onclick="copyShortlink('${item.short_url}')"><i data-feather="copy"></i> Copy</button>
          <button onclick="shareShortlink('${item.short_url}')"><i data-feather="share-2"></i> Share</button>
          <button onclick="openEditModal(this)"><i data-feather="edit"></i> Edit</button>
          <button onclick="deleteShortlink('${item.short_url}')"><i data-feather="trash-2"></i> Delete</button>
        </div>
      `;

      historyContainer.appendChild(historyItem);
      feather.replace(); // Untuk memperbarui ikon Feather
    });
  } catch (error) {
    console.error("Error fetching shortlink history:", error);
    document.getElementById("History").innerHTML = `
      <p class="empty-history">Tidak ada riwayat shortlink.</p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", renderShortlinkHistory());

// Fungsi untuk menyalin shortlink
function copyShortlink(shortlink) {
  const baseURL = window.location.origin;
  const fullURL = `${baseURL}/${shortlink}`;

  navigator.clipboard.writeText(fullURL)
    .then(() => alert("Shortlink copied to clipboard!"))
    .catch(() => alert("Failed to copy shortlink"));
}

// Fungsi untuk membagikan shortlink
function shareShortlink(shortlink) {
  if (navigator.share) {
    navigator.share({
      title: "Check out this link!",
      text: "Here's a shortlink you might find interesting:",
      url: shortlink,
    })
      .then(() => console.log("Shortlink shared successfully"))
      .catch((error) => console.error("Failed to share shortlink:", error));
  } else {
    alert("Web Share API not supported. Try copying the link instead.");
  }
}

// Fungsi untuk menetapkan shortlink yang baru dihasilkan
function setShortlink(shortlink) {
  currentShortlink = shortlink; // Set currentShortlink saat shortlink baru dibuat
}

async function deleteShortlink(shortUrl) {
  // Tampilkan dialog konfirmasi kepada pengguna
  const confirmation = window.confirm(
    "Are you sure you want to delete this shortlink? This action cannot be undone."
  );

  // Jika pengguna menekan "Cancel", hentikan proses
  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch("/shortlink/config", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ short_url: shortUrl }),
    });

    if (response.ok) {
      alert("Shortlink deleted successfully!");
      await renderShortlinkHistory(); // Perbarui daftar
    } else {
      const errorMessage = await response.text();
      alert(`Error deleting shortlink: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error deleting shortlink:", error);
    alert("An error occurred while deleting the shortlink.");
  }
}




// Get modal elements
const modal = document.getElementById("editModal");
const closeBtn = document.querySelector(".close");
const saveBtn = document.getElementById("saveEdit");
const cancelBtn = document.getElementById("cancelEdit");
let currentEditingItem = null;

// Function to open modal
function openEditModal(element) {
  const historyItem = element.closest(".history-item");
  const currentUrl = historyItem.querySelector(".shortUrl").textContent;
  const currentTitle = historyItem.querySelector(".linkTitle").textContent;

  // Store reference to currently editing item
  currentEditingItem = historyItem;

  // Set current URL in form
  document.getElementById("title").value = currentTitle;
  document.getElementById("oldUrl").value = currentUrl;
  document.getElementById("newUrl").value = currentUrl.replace(`${window.location.origin}/`, "");

  // Show modal
  modal.style.display = "block";
}

// Function to close modal
function closeModal() {
  modal.style.display = "none";
  // Clear form
  document.getElementById("editForm").reset();
  currentEditingItem = null;
}

// Function to save changes
async function saveChanges() {
  const title = document.getElementById("title").value;
  let oldUrl = document.getElementById("oldUrl").value; // Ambil nilai oldUrl
  oldUrl = oldUrl.replace(`${window.location.origin}/`, "");
  const newUrl = document.getElementById("newUrl").value;

  if (title.trim() === "" || newUrl.trim() === "") {
    alert("Please enter a new title or a new URL");
    return;
  }
    // Send PATCH request to backend
    const response = await fetch("/shortlink/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldUrl, title, custom: newUrl }),
    });

    const result = await response.json();

    if (response.ok) {
      // Update URL and title in history item
      if (currentEditingItem) {
        const linkElement = currentEditingItem.querySelector(".shortUrl");
        linkElement.textContent = title;
        linkElement.textContent = `${window.location.origin}/${newUrl}`;
        linkElement.href = `${window.location.origin}/${newUrl}`;
      }

      alert(result.msg);
      closeModal(); // Close modal on success
      renderShortlinkHistory();
    } else {
      // Show error message from server
      alert(result.msg || "Failed to update shortlink");
    }
}

// Event listeners
closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
saveBtn.onclick = saveChanges;

// Close modal if clicked outside
window.onclick = function (event) {
  if (event.target === modal) {
    closeModal();
  }
}

// Modify existing edit button click handler
document.querySelectorAll("#edit-shortlink-btn").forEach((btn) => {
  btn.onclick = function () {
    openEditModal(this);
  };
});
