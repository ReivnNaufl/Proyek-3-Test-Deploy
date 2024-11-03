let currentQRCode = {
  data: null,
  style: {
    color: "#000000",
    logo: null,
  }
};

// Function to switch between tabs
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
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

// Handle form submission
document
  .getElementById("qrForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    try {
      const response = await fetch("/qr/generateQR", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        currentQRCode.data = data;
        displayQRResult(data);
        document.getElementById("inputSection").style.display = "none";
        document.getElementById("resultSection").style.display = "block";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });

  function displayQRResult(data) {
    document.getElementById("qrTitle").textContent = "Title: " + data.title;
    document.getElementById("qrUrl").textContent = "URL: " + data.url;
  
    const img = document.createElement("img");
    img.src = data.imageData; // Set QR code image source
    img.alt = data.title;
  
    const container = document.getElementById("qrCodeContainer");
    container.innerHTML = ""; // Clear previous content
    container.appendChild(img);
  
    // Set logo in currentQRCode.style.logo
    if (data.logo) {
      currentQRCode.style.logo = data.logo; // Set the logo Data URI
    }
  }
  

async function updateQRStyle(color = null, element = null, logoInput = null) {
  const formData = new FormData();
  formData.append("url", currentQRCode.data.url);
  formData.append("title", currentQRCode.data.title);

  if (color) {
    currentQRCode.style.color = color;
    document
      .querySelectorAll(".color-option")
      .forEach((opt) => opt.classList.remove("selected"));
    if (element) element.classList.add("selected");
  }
  formData.append("color", currentQRCode.style.color);

  if (logoInput && logoInput.files[0]) {
    currentQRCode.style.logo = logoInput.files[0];
  }
  if (currentQRCode.style.logo) {
    formData.append("logo", currentQRCode.style.logo);
  }

  try {
    const response = await fetch("/qr/generateQR", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      currentQRCode.data = data;
      displayQRResult(data);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to update QR code style.");
  }
}

function copyQRCode() {
  if (currentQRCode.data) {
    fetch(currentQRCode.data.imageData)
      .then((res) => res.blob())
      .then((blob) => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard
          .write([item])
          .then(() => alert("QR Code copied to clipboard!"))
          .catch(() => alert("Failed to copy QR Code"));
      });
  }
}

function downloadQRCode() {
  if (currentQRCode.data) {
    const a = document.createElement("a");
    a.href = currentQRCode.data.imageData;
    a.download = `qr-code-${currentQRCode.data.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

async function saveQRCode() {
  if (currentQRCode.data) {
    
    const payload = {
      imageData: currentQRCode.style.logo,
      date: new Date().toISOString(),
      color: currentQRCode.style.color,
      url: currentQRCode.data.url,
      title: currentQRCode.data.title
    };
    
    try {
      const response = await fetch('/qr/saveqr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("QR berhasil disimpan ke database");
        document.getElementById("qrForm").reset();
        document.getElementById("inputSection").style.display = "block";
        document.getElementById("resultSection").style.display = "none";
      } else {
        alert("Gagal menyimpan QR code");
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert("Terjadi kesalahan saat menyimpan QR code");
    }
  }
}

// History Functions
function editHistoryQR(button) {
  const historyItem = button.closest(".history-item");
  const title = historyItem.querySelector(".title").textContent;
  const url = historyItem.querySelector(".url").textContent;

  document.getElementById("defaultOpen").click();

  document.getElementById("url").value = url;
  document.getElementById("title").value = title;

  document.getElementById("qrForm").dispatchEvent(new Event("submit"));
}

function copyHistoryQR(button) {
  const historyItem = button.closest(".history-item");
  alert("QR Code copied to clipboard!");
}

function deleteHistoryQR(button) {
  const historyItem = button.closest(".history-item");
  if (confirm("Are you sure you want to delete this QR code?")) {
    historyItem.remove();
  }
}

async function displayQRCode1() {
  try {
    const response = await fetch('/qr/pick', {
      method: 'GET'
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('QR code retrieved successfully');
      
      const qrImage = document.createElement('img');
      qrImage.src = data.imageData;
      
      const container = document.getElementById('qrDisplayContainer');
      container.innerHTML = '';
      container.appendChild(qrImage);
    } else {
      console.error('Failed to retrieve QR code:', data.error);
    }
  } catch (error) {
    console.error('Error fetching QR code:', error);
  }
}

document.getElementById("defaultOpen").click();

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
