// Ref https://developer.spotify.com/documentation/web-api/tutorials/code-flow

const config = require('./config.json');

const express = require('express');
const session = require('express-session');
const passport = require('passport-oauth2');
const querystring = require('querystring');
const request = require('request') // TODO: request is deprecated, use fetch instead?

const client_id = config.client_id;
const client_secret = config.client_secret;
const redirect_uri = 'http://localhost:8888/auth/callback';

const app = express();
const router = express.Router();

router.get('/status', function (req, res) {
    if (req.session.access_token) {
        res.json({ authenticated: true })
    }
    else {
        res.json({ authenticated: false })
    }
})

router.get('/login', function (req, res) {

    const scopeList = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private', 'playlist-read-collaborative']
    const scope = scopeList.join(' ');

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
        })
    );
});

// Request access token
router.get('/callback', function (req, res) {

    var code = req.query.code || null;

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, function (err, response, body) {

        
        if (err) {
            const errstr = 'Error requesting access token.'
            console.error(errstr, err);
            return res.status(500).send(errstr);
        }
        
        console.log("Request Access Token [" + response.statusCode + "] " + response.statusMessage);
        
        const access_token = response.body.access_token || null;
        const refresh_token = response.body.refresh_token || null;

        if (access_token) {
            req.session.access_token = access_token;
            if (refresh_token) {
                req.session.refresh_token = refresh_token;
            }
            else {
                console.warn("Warning: No refresh token was stored.")
            }
        }
        else {
            const errstr = 'Error storing access token.'
            console.error(errstr, err);
            return res.status(500).send(errstr);
        }

        return res.redirect('/home.html');

    });

})

module.exports = router;
