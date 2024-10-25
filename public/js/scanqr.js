const openScannerButton = document.getElementById("openScannerButton");
const closeScannerButton = document.getElementById("closeScannerButton");
const scannerModal = document.getElementById("scannerModal");
const resultDiv = document.getElementById("result");
const videoElement = document.getElementById("video");
let scanning = false;
let codeReader;

openScannerButton.addEventListener("click", openModal);
closeScannerButton.addEventListener("click", closeModal);

function openModal() {
  // Reset hasil scan setiap kali scanner dibuka
  resultDiv.textContent = "";
  scannerModal.classList.remove("hidden");

  // Mulai scanning ulang
  startScanning();
}

function closeModal() {
  scannerModal.classList.add("hidden");
  stopScanning();
}

function startScanning() {
  scanning = true;
  resultDiv.textContent = "Memulai scanner...";
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      videoElement.srcObject = stream;
      videoElement.play();

      // Jika belum ada instance codeReader, buat baru
      if (!codeReader) {
        codeReader = new ZXing.BrowserMultiFormatReader();
      }

      // Mulai membaca barcode dari video
      codeReader.decodeFromVideoDevice(
        null,
        videoElement,
        (result, err) => {
          if (result) {
            const scannedResult = result.text;
            // resultDiv.textContent = `Kode yang terdeteksi: ${scannedResult}`;

            // Jika hasilnya valid URL, buka di tab baru
            if (isValidURL(scannedResult)) {
              window.open(scannedResult, "_blank");
            } else {
              resultDiv.textContent = `Hasil tidak valid sebagai URL: ${scannedResult}`;
            }
            stopScanning(); // Hentikan scanning setelah mendapatkan hasil
          }

          if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error("Error:", err);
          }
        }
      );
    })
    .catch(function (err) {
      console.error("Error accessing the camera", err);
      resultDiv.textContent =
        "Error: Tidak dapat mengakses kamera. " + err.message;
    });
}

function stopScanning() {
  if (scanning) {
    scanning = false;

    // Hentikan semua track video
    const stream = videoElement.srcObject;
    const tracks = stream ? stream.getTracks() : [];

    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;

    // Hentikan pembacaan kode dan reset
    if (codeReader) {
      codeReader.reset();
    }
  }
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}