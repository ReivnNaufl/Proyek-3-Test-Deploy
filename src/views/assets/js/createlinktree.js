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

// Function to open a tab
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  const tablinks = document.getElementsByClassName("tablinks");

  // Hide all tab content and remove active class
  for (const content of tabcontent) {
    content.style.display = "none";
  }
  for (const link of tablinks) {
    link.classList.remove("active");
  }

  // Show selected tab and add active class
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

// Set default tab to open on load
document.getElementById("defaultOpen").click();

// Function to generate a shortlink (stub for now)
function generateShortlink() {
  const url = document.getElementById("urlInput").value;
  alert("Shortlink generated for: " + url);
}

// Event listener for the short URL form submission
document
  .getElementById("short-url-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    generateQRCode();
  });

// Function to generate QR code
function generateQRCode() {
  const urlInputElement = document.getElementById("url-input");
  const titleInputElement = document.getElementById("title-input");
  const downloadButton = document.getElementById("download-btn");
  const copyButton = document.getElementById("copy-btn");

  const urlValue = urlInputElement.value;
  const titleValue = titleInputElement.value;

  if (urlValue && titleValue) {
    // Create QR code and update display
    const qrData = urlValue;
    updateDisplayFields(
      titleInputElement,
      titleValue,
      urlInputElement,
      urlValue
    );

    // Hide generate button and show QR preview
    document.getElementById("generate-btn").style.display = "none";
    document.getElementById("qr-preview").style.display = "block";

    const shortUrl = generateShortUrl(urlValue);
    const qrCodeDataUrl = generateQRCodeFromUrl(qrData);

    // Display QR code and setup buttons
    displayQRCode(
      qrCodeDataUrl,
      downloadButton,
      copyButton,
      shortUrl,
      urlValue
    );
  } else {
    alert("Please enter both a valid Title and URL");
  }
}

// Function to update display fields
function updateDisplayFields(
  titleInputElement,
  titleValue,
  urlInputElement,
  urlValue
) {
  titleInputElement.replaceWith(createDisplaySpan(titleValue));
  urlInputElement.replaceWith(createDisplaySpan(urlValue));
}

// Function to create a span for displaying input content
function createDisplaySpan(content) {
  const span = document.createElement("span");
  span.textContent = content;
  return span;
}

// Function to generate a short URL
function generateShortUrl(userUrl) {
  return "https://plbsh.polban.dev/" + encodeURIComponent(userUrl);
}

// Function to generate QR code data URL
function generateQRCodeFromUrl(url) {
  return (
    "https://api.qrserver.com/v1/create-qr-code/?data=" +
    encodeURIComponent(url) +
    "&size=300x300"
  );
}

// Function to display the QR code on the canvas
function displayQRCode(
  qrCodeDataUrl,
  downloadButton,
  copyButton,
  shortUrl,
  urlValue
) {
  const qrCanvas = document.getElementById("qr-canvas");
  const ctx = qrCanvas.getContext("2d");
  const img = new Image();
  img.onload = function () {
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.drawImage(img, 0, 0, qrCanvas.width, qrCanvas.height);

    // Show download and copy buttons with handlers
    downloadButton.style.display = "block";
    downloadButton.onclick = () => downloadQRCode(qrCodeDataUrl);
    copyButton.style.display = "block";
    copyButton.onclick = () => copyImageToClipboard(qrCodeDataUrl);

    displayShortUrl(shortUrl, urlValue);
  };
  img.src = qrCodeDataUrl;
}

// Function to download the QR code
function downloadQRCode(qrCodeDataUrl) {
  const link = document.createElement("a");
  link.href = qrCodeDataUrl;
  link.download = "qrcode.png";
  link.click();
}

// Function to display the short URL and destination URL
function displayShortUrl(shortUrl, urlValue) {
  const cartList = document.getElementById("cart-list");
  const cartItem = document.createElement("li");
  cartItem.classList.add("cart-item");

  cartItem.innerHTML = `
    <div>
      <p><strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a></p>
      <p><strong>Destination URL:</strong> <a href="${urlValue}" target="_blank">${urlValue}</a></p>
    </div>
  `;

  cartList.appendChild(cartItem);
}
