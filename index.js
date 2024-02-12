const express = require('express');
const session = require('express-session');
const passport = require('passport-oauth2');

const authRouter = require('./auth');   // Authentication route handler

const app = express();
const router = express.Router();
const port = 8888;

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))
app.use(express.static('public'));
app.use('/', authRouter);


// Set route for root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
