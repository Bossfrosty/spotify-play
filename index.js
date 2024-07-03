const express = require('express');
const session = require('express-session');
const passport = require('passport-oauth2');

const config = require('./config.json');
const authRouter = require('./auth');   // Authentication route handler
const apiRouter = require('./apiController')     // Route handler for authorized API requests

const app = express();
const router = express.Router();
const port = config.port ?? 8888;

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))
app.use(express.static('public'));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api', apiRouter);

// Set route for root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Spotify Play listening on port ${port}.`);
});
