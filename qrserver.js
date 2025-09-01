const express = require('express');
const QRCode = require('qrcode');

function createQrServer() {
  const app = express();
  let currentQR = null;

  // Endpoint to render QR as HTML
  app.get('/', async (req, res) => {
    if (!currentQR) {
      return res.send('<h2>No QR code generated yet</h2>');
    }
    const qrImage = await QRCode.toDataURL(currentQR);
    res.send(`
      <html>
        <head><title>WhatsApp QR</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;">
          <img src="${qrImage}" />
        </body>
      </html>
    `);
  });

  const server = app.listen(3000, () => {
    console.log('QR server running at http://localhost:3000');
  });

  // function to update QR
  function updateQr(qr) {
    currentQR = qr;
  }

  return { updateQr, close: () => server.close() };
}

module.exports = createQrServer;
