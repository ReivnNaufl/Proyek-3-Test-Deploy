import express from "express";
import shortlinkController from './src/controllers/shortlinkController.js';
import routerShortlink from './src/routes/shortlink.js';
const PORT = 8080;
const app = express();

app.use(express.json());

app.use('/sl', routerShortlink);

// app.listen(PORT, () => {
//     console.log(`Server polban running at port ${PORT}`);
// });

app.get('/sl/:id', shortlinkController.secondRedirect);