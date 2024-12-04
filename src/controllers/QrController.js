import qr from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import { __dirname } from '../../path.js';
import Qr from '../models/qrModel.js';
import cryptoRandomString from 'crypto-random-string';
import fs from 'fs/promises';
import { shorten } from './shortlinkController.js';
import { URL } from '../../path.js';

const generateQRCode = async (req, res) => {
  try {
    const { url, title, color } = req.body;
    const logo = req.file;
    if (!url || !title) {
      return res.status(400).json({ error: 'Please provide both URL and title' });
    }
    
    // Generate QR code
    const qrCodeBuffer = await qr.toBuffer(url, {
      errorCorrectionLevel: 'H',
      color: {
        dark: color || '#000000',
        light: '#ffffff'
      },
      width: 300,  // Set specific width
      margin: 0,
    });

    let finalImage = sharp(qrCodeBuffer).resize(300, 300);

    let logoDataURI = null;

    // If logo is provided, overlay it on the QR code
    if (logo) {
      const logoBuffer = await sharp(logo.buffer)
        .resize(50, 50)
        .toBuffer();
      
      finalImage = finalImage.composite([
        { input: logoBuffer, gravity: 'center' }
      ]);

      // Convert logoBuffer to Base64 Data URI
      const base64Logo = logoBuffer.toString('base64');
      logoDataURI = `data:image/png;base64,${base64Logo}`; // Create Data URI for logo
    }

    const outputBuffer = await finalImage.png().toBuffer();

    // Convert buffer to base64
    const base64Image = outputBuffer.toString('base64');
    const dataURI = `data:image/png;base64,${base64Image}`;

    res.json({
      success: true,
      imageData: dataURI,
      title: title,
      url: url,
      logo: logoDataURI // Include logo Data URI in the response
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

const qrmain = async(req,res) =>{
    res.sendFile(path.join(__dirname, 'src', 'views', 'qrcode.html'));
}

const saveQR = async (req, res) => {
  try {
    const id_qr = await uniqueRandomIDqr(); 
    const email = req.session.email; 
    const { body } = req;
    const {url,title,date} = req.body;
    const custom = null;
    const id_sl = await shorten(url,email,custom,'qr')

    // Save binary imageBuffer
    await Qr.insert(id_qr, date, email, body,url,title,id_sl);
    res.status(200).json({ message: 'QR code saved successfully' });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Failed to save QR code' });
  }
};


const pickQR = async (req, res) => {
  try {
    const email = req.session.email;
    const idsResult = await Qr.getid(email);

    if (idsResult.rows.length === 0) {
      console.log('No QR codes found for this email');
      return res.status(404).json({ 
        success: false, 
        error: 'No QR codes found for this email' 
      });
    }

    const qrData = [];
    for (const row of idsResult.rows) {
      const id = row.id_qr;
      const styleResult = await Qr.show(id);

      if (styleResult.rows.length > 0) {
        qrData.push({ 
          id: id, 
          style: styleResult.rows[0].style 
        });
      }
    }

    if (qrData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No styles found for the provided QR codes'
      });
    }

    res.status(200).json({
      success: true,
      qrData: qrData
    });

  } catch (error) {
    console.error('Error retrieving QR codes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve QR codes' 
    });
  }
};





async function uniqueRandomIDqr() {
  let id;
  while (true) {
    id = cryptoRandomString({ length: 4, type: "alphanumeric" });
    if (await isIDuniqueqr(id)) {
      break;
    }
  }
  return id;
}

async function isIDuniqueqr(id) {
  const result = await Qr.exists("id_qr", id);
  // const result = await pool.query(`SELECT EXISTS(SELECT 1 FROM shortlinks WHERE id_shortlink = $1)`, [id]);
  return !result.rows[0]["exists"];
}

const deleteQR = async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.session.email; // Retrieve email from session

    // Check if id and email exist
    if (!id) {
      console.log('ID parameter is missing');
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required',
      });
    }

    if (!email) {
      console.log('User is not authenticated');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify ownership of the QR code
    const ownershipCheck = await Qr.checkOwner(id, email);
    if (!ownershipCheck.rows[0]?.exists) {
      console.log('Unauthorized attempt to delete QR code:', { id, email });
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this QR code',
      });
    }

    // Delete QR code
    const result = await Qr.delete(id);

    if (result.rowCount === 0) {
      console.log('QR code not found during deletion:', id);
      return res.status(404).json({
        success: false,
        error: 'QR code not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'QR code deleted successfully',
    });
  } catch (error) {
    console.error('Detailed error deleting QR code:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete QR code',
      details: error.message,
    });
  }
};


const generateQRext = async (req, res) => {
  try {
    const  {url}  = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({ error: 'Please provide a URL' });
    }

    const namafile = url.replace(/[^a-zA-Z0-9]/g, '');

    // Generate QR code buffer
    const qrCodeBuffer = await qr.toBuffer(url, {
      errorCorrectionLevel: 'H',
      color: {
        dark: '#00008B',
        light: '#ffffff',
      },
      width: 300,  // Set specific width
      margin: 0,
    });

    // Process QR code image with sharp
    let finalImage = sharp(qrCodeBuffer);

    // Load and resize logo images
    const logoBuffer = await sharp(path.join(__dirname, 'blank.jpg'))
      .resize(60, 60)
      .toBuffer();

    const polbanBuffer = await sharp(path.join(__dirname, 'polban.png'))
      .resize(50, 50)
      .toBuffer();
    
    const logoBuffer1 = await sharp(path.join(__dirname, 'jtk.png'))
      .resize(50,50)
      .toBuffer();

    const bglogo1 = await sharp(path.join(__dirname, 'blank.jpg'))
    .resize(60,60)
    .toBuffer();

    // Composite both images onto the QR code in the center
    finalImage = finalImage.composite([
      { input: logoBuffer, gravity: 'center' },
      { input: polbanBuffer, gravity: 'center' },
      { input: bglogo1, gravity: 'southeast' },
      { input: logoBuffer1, gravity: 'southeast' },
        ]);

    // Output as PNG buffer
    const outputBuffer = await finalImage.png().toBuffer();

    // Define the save directory and save the file
    const tesDir = path.join(__dirname, 'src', 'img');
    const filePath = path.join(tesDir, `${namafile}.png`);
    await fs.mkdir(tesDir, { recursive: true });
    await fs.writeFile(filePath, outputBuffer);

    // Send response with the QR code as a data URI
    const base64Image = outputBuffer.toString('base64');
    const mimeType = 'image/png';
    res.json({ message: 'QR code generated successfully', url: `${URL}/tes/${namafile}.png` });

    console.log(`QR code saved to ${filePath}`);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

const getqrext = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Basic security: prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'src', 'img', sanitizedFilename);

    // Check if file exists
    await fs.access(filePath, fs.constants.F_OK);

    // Optional: Check if it's an image
    const mimeType = path.extname(filePath).toLowerCase();
    const allowedTypes = ['.jpg', '.jpeg', '.png'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).send('Invalid file type');
    }

    res.sendFile(filePath);

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).send('Image not found');
    }
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
};


export default{
    generateQRCode,
    qrmain,
    saveQR,
    pickQR,
    deleteQR,
    generateQRext,
    getqrext
};
