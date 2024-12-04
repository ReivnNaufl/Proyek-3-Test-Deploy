import express from "express";
import session from "express-session";
import shortlinkController from "./src/controllers/shortlinkController.js";
import routerShortlink from './src/routes/shortlink.js';
import routerAccount from "./src/routes/account.js";
import routerQr from "./src/routes/qrRoutes.js";
import path from 'path';
import { __dirname } from "./path.js";
import { checkAuth } from "./src/middleware/checkAuth.js";
import routerLinktree from "./src/routes/linktree.js";
import { loginSession } from "./src/middleware/loginSessionMid.js";
import { log } from "console";
import routerext from "./src/routes/external.js";
import pool from "./config/config.js";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";

dotenv.config();

const PORT = 80;

const app = express();

const pgSession = connectPgSimple(session);

app.use(session({
    store: new pgSession({
        pool : pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
    secret: process.env.FOO_COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));



app.use(express.json());

app.use('/shortlink',loginSession, routerShortlink);

app.use('/assets', express.static(path.join(__dirname, 'src', 'views', 'assets')));

app.use('/account', routerAccount);

app.use('/qr',loginSession, routerQr);

app.use('/linktree',  routerLinktree);

app.use('/tes',routerext);


app.listen(PORT, () => {;
    console.log(`Server utama running at port ${PORT}`);
});

app.get('/',checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
})

app.get('/:id', shortlinkController.firstRedirect);