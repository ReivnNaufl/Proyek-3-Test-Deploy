// DOM Elements
const qrCanvas = document.getElementById("qr-code-canvas");
const copyShortUrlBtn = document.getElementById("copy-short-url-btn");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

// Fungsi kembali ke halaman sebelumnya
function goBack() {
  window.history.back();
}

// Function to get ID from URL
function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Generate QR code function
function generateQRCode(url) {
  const typeNumber = 4;
  const errorCorrectionLevel = "L";
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(url);
  qr.make();

  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  // Convert QR code to image and draw it on the canvas
  const qrImage = new Image();
  qrImage.src = qr.createDataURL();
  qrImage.onload = function () {
    ctx.drawImage(qrImage, 0, 0, qrCanvas.width, qrCanvas.height);
  };
}

// Fetch shortlink data from the backend
async function fetchShortlink() {
  const id = getIdFromUrl(); // Ambil ID dari URL (misal: ?id=1234)
  if (!id) {
    console.error("No ID found in URL");
    return;
  }

  try {
    // Fetch data shortlink dari backend
    const response = await fetch(`https://plbsh.polban.dev/shortlink/get/${id}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const shortUrl = `${window.location.origin}/${data.short_url}`; // Bentuk full short URL

    // Update UI
    document.getElementById("shortlink-title").textContent = data.shortlink_title;
    document.getElementById("shortlink-short-url").textContent = shortUrl;
    document.getElementById("shortlink-short-url").href = shortUrl; // Tambahkan link untuk short_url
    document.getElementById("shortlink-url").textContent = data.long_url;
    document.getElementById("shortlink-url").href = data.long_url; // Tambahkan link untuk long_url
    

    // Generate QR code
    generateQRCode(shortUrl);
  } catch (error) {
    console.error("Error fetching shortlink:", error);
  }
}

// Event Listeners
copyShortUrlBtn.addEventListener("click", async () => {
  const shortUrl = document.getElementById("shortlink-short-url").textContent;
  try {
    await navigator.clipboard.writeText(shortUrl);
    alert("Short URL copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
    alert("Failed to copy Short URL to clipboard.");
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    const blob = await new Promise((resolve) => qrCanvas.toBlob(resolve));
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    alert("QR Code copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
    alert("Failed to copy QR Code to clipboard.");
  }
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = qrCanvas.toDataURL("image/png");
  link.download = "qr-code.png";
  link.click();
});

// Initialize on page load
window.onload = fetchShortlink;
