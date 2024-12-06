import account from '../models/accountModel.js';
import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { __dirname } from '../../path.js';
import { get } from 'https';
import { google } from 'googleapis';
import { oauth2 } from 'googleapis/build/src/apis/oauth2/index.js';

dotenv.config();

let otpStorage = {};
let verificationTokenStorage = {};
let otpstorage2 = {};

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

let transport; // Declare transport variable outside the function

async function sendMail() {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            }
        });
        return transport; // Return the transport for further use
    } catch (error) {
        console.error('Error creating transport:', error);
        throw error;
    }
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.USER,
        pass: process.env.APP_PASS
    }
});

const sendVerificationEmail = async (email, otp, verificationToken) => {
    // Ensure transport is created before sending email
    if (!transport) {
        await sendMail();
    }

    const verificationLink = `http://localhost:8000/account/vmail?token=${verificationToken}&email=${email}`;
    const mailOptions = {
        from: {
            name: "Authenticator",
            address: process.env.USER
        },
        to: email,
        subject: 'Kode OTP & Verifikasi Akun Polbaners',
        text: `Kode OTP mu adalah ${otp}, akan kadaluwarsa dalam 5 menit.\n\n
        Atau klik link ini untuk verifikasi: ${verificationLink}`
    };

    return transport.sendMail(mailOptions);
};

const sendOtpReset = async (email, otp) => {
    // Ensure transport is created before sending email
    if (!transport) {
        await sendMail();
    }

    const mailOptions = {
        from: {
            name: "Authenticator",
            address: process.env.USER
        },
        to: email,
        subject: 'Reset Password Akun Polbaners',
        text: `Kode OTP mu adalah ${otp}, akan kadaluwarsa dalam 5 menit.`
    };

    return transport.sendMail(mailOptions);
};

const lgcforgpass = async (req, res) => {
    try {
        const { email } = req.body;

        // Generate OTP
        const otp = cryptoRandomString({ length: 6, type: 'numeric' });

        // Store OTP with expiry time
        otpstorage2[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

        // Send OTP reset email
        await sendOtpReset(email, otp);

        // Set session data if needed
        req.session.email = email;

        res.status(200).json({ success: true, message: 'OTP sent to your email.' });
    } catch (error) {
        // Handle errors
        console.error('Error sending OTP:', error); // Log the error
        res.status(500).json({ success: false, message: 'Error sending OTP: ' + error.message });
    }
};


const kirim_otp = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Hash the password
      const hashedPassword = await argon2.hash(password);
      const otp = cryptoRandomString({ length: 6, type: 'numeric' });
      const verificationToken = cryptoRandomString({ length: 32, type: 'url-safe' });
  
      // Store OTP and verification token with expiry time
      otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, hashedPassword };
      verificationTokenStorage[email] = { token: verificationToken, hashedPassword, expiresAt: Date.now() + 5 * 60 * 1000 };
  
      // Send verification email
      await sendVerificationEmail(email, otp, verificationToken);
  
      // Set session data
      req.session.email = email;
  
      // Redirect to verification page after successfully sending OTP
      res.redirect('/account/verifikasi');  // <-- Redirection here
  
    } catch (error) {
      // Handle errors
      res.status(500).json({ success: false, message: 'Error sending OTP: ' + error.message });
    }
  };
  
  const verifikasi = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!otpStorage[email]) {
            return res.status(400).json({ msg: 'OTP belum dibuat untuk email ini' });
        }

        const { otp: storedOtp, expiresAt, hashedPassword } = otpStorage[email];

        if (otp.length !== storedOtp.length) {
            return res.status(400).json({ msg: 'OTP salah' });
        }

        const isOtpValid = crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(storedOtp));

        if (isOtpValid && Date.now() < expiresAt) {
            await account.insert(email, hashedPassword, "active");
            delete otpStorage[email];
            delete verificationTokenStorage[email];
            
            // Kirim success response dengan URL redirect
            return res.status(200).json({ 
                success: true, 
                redirectUrl: '/'
            });
        } else if (Date.now() >= expiresAt) {
            return res.status(400).json({ msg: 'OTP kadaluwarsa' });
        } else {
            return res.status(400).json({ msg: 'OTP salah' });
        }

    } catch (err) {
        res.status(500).json({ msg: 'Terjadi kesalahan server: ' + err.message });
    }
};

const verif_viamail = async(req,res) =>{
    const { token, email } = req.query;

    try {
        if (verificationTokenStorage[email]) {
            const { token: storedToken, expiresAt, hashedPassword } = verificationTokenStorage[email];

            if (token === storedToken && Date.now() < expiresAt) {
                await account.insert(email, hashedPassword, "inactive");
                delete otpStorage[email];
                delete verificationTokenStorage[email];
                return res.redirect('/')
            } else if (Date.now() >= expiresAt) {
                return res.status(400).send({ msg: 'Link verifikasi kadaluwarsa' });
            } else {
                return res.status(400).send({ msg: 'Token verifikasi salah' });
            }
        } else {
            return res.status(400).send({ msg: 'Token verifikasi belum dibuat untuk email ini' });
        }
    } catch (err) {
        res.status(500).send('Terjadi kesalahan server: ' + err.message);
    }
}

const login = async(req,res) =>{
    const { email, password } = req.body;

    try {
        const result = await account.emails(email);

        if (result.rows.length > 0) {
            const hashedPassword = result.rows[0].password;
            const isPasswordCorrect = await argon2.verify(hashedPassword,password);

            if (isPasswordCorrect) {
                req.session.email = email;
                res.redirect('/')
            } else {
                return res.status(401).send({ msg: 'Password salah!' });
            }
        } else {
            return res.status(404).send({ msg: 'Pengguna tidak ditemukan' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ msg: 'Terjadi kesalahan server' });
    }
}

const loginfe = async (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'aktivasi.html'));
};

const veriffe = async (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'verifikasi.html'));
};

const getEmailFromSession = (req, res) => {
    if (req.session.email) {
        return res.json({ email: req.session.email });
    } else {
        return res.status(404).json({ message: 'Email not found in session' });
    }
};

const logon = async (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'login.html'));
};

const forgpass = async (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'forgotpassword.html'));
};


const logout = async(req,res) => {
    req.session.destroy((err) => {
        if (err){
            return res.status(500).send('Gagal Logout')
        }
        res.redirect('/account/login')
    })
}

export default{
    sendVerificationEmail,
    kirim_otp,
    verifikasi,
    verif_viamail,
    login,
    loginfe,
    veriffe,
    getEmailFromSession,
    logon,
    forgpass,
    lgcforgpass,
    logout
}