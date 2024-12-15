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
import landingPageRouter from "./src/routes/landingpage.js";
import cors from 'cors';
import connectPgSimple from "connect-pg-simple";
import pool from "./config/config.js";

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

app.use('/linktree', (req, res, next) => {
    console.log(req.baseUrl + req.path);
    //match for /linktree/get/{id}
    const pathMatch = /^\/linktree\/get\/[^/]+$/.test(req.baseUrl + req.path);
    if (req.session.email || req.path === '/room' || pathMatch) {
        return next();
    } else {
        return res.redirect('/account/login');
    }
}, routerLinktree);

app.use('/tes',cors(),routerext);

app.use('/landingpage', landingPageRouter)

app.listen(process.env.PORT, () => {
    console.log(`Server utama running at port ${process.env.PORT}`);
});

app.get('/', (req, res) => {
    if (req.session.email) {
        res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
    } else {
        res.redirect('/landingpage');
    }
})

app.get('/:id', shortlinkController.firstRedirect);

app.get('/sl/:id', shortlinkController.secondRedirect);

