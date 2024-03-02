const express = require('express');
const session = require('express-session');
const request = require('request');

const app = express();
const router = express.Router();

router.get('/toggle-playback', async (req, res) => {

    getPlaybackInfo(req, async (err, playbackInfo) => {
        
        if (err) {
            return res.status(500).send();
        }

        // Spotify is not playing when playing when player is not active (204 -> no playbackInfo)
        // otherwise, playback status = is_playing 
        var isPlaying = playbackInfo?.is_playing ?? false;
        isPlaying ? pausePlayback(req) : startPlayback(req);

    });

    return res.status(200);
})

router.get('/skip-prev', async (req, res) => {
    skipPrev(req);
    return res.status(200);
})

router.get('/skip-next', async (req, res) => {
    skipNext(req);
    return res.status(200);
})

async function getPlaybackInfo(req, callback) {

    const url = "https://api.spotify.com/v1/me/player";
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + token
        }
    }

    request.get(url, options, function (err, response, body) {

        console.log("Request Playback Info [" + response.statusCode + "] " + response.statusMessage);

        if (err) {
            const errstr = 'Error getting playback info.'
            console.error(errstr, err);
            return callback(err);
        }

        if (response.statusCode == 204) {
            // No body = playback not available or active
            const errstr = 'Playback not available or active.'
            console.error(errstr);
            return callback(null, null);
        }

        if (response.statusCode == 200) {
            // Just passing Spotify's response here
            const playbackInfo = JSON.parse(body);
            return callback(null, playbackInfo);
        }

        // TODO: Specific handling for other response codes
        const errstr = 'Error getting playback info.'
        console.error(errstr, err);
        return callback(new Error('Unknown error occurred getting playback info.'));
    });
}

async function startPlayback(req) {
    
    const url = 'https://api.spotify.com/v1/me/player/play';
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.put(url, options, function (err, response, body) {

        console.log("Start Playback [" + response.statusCode + "] " + response.statusMessage);

        if (err) {
            const errstr = 'Could not start playback.'
            console.error(errstr, err);
        }
        else if (response.statusCode == 404) {
            // TODO: Get default device ID at start of every session
            console.log('Got 404 trying to start playback. This may occur if you do not have an active device.')
        }
        else {
            console.log("Playback started");
        }
    });
}

async function pausePlayback(req) {

    const url = 'https://api.spotify.com/v1/me/player/pause';
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.put(url, options, function (err, response, body) {

        console.log("Pause Playback [" + response.statusCode + "] " + response.statusMessage);

        if (err) {
            const errstr = 'Could not pause playback.'
            console.error(errstr, err);
        }
        else {
            console.log("Playback paused");
        }
    });
}

async function skipPrev(req) {

    const url = 'https://api.spotify.com/v1/me/player/previous';
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.post(url, options, function (err, response, body) {

        console.log("Skip to prev [" + response.statusCode + "] " + response.statusMessage);

        if (err) {
            const errstr = 'Could not skip to previous.'
            console.error(errstr, err);
        }
        else {
            console.log('Skipped to previous');
        }
    });
}

async function skipNext(req) {

    const url = 'https://api.spotify.com/v1/me/player/next';
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.post(url, options, function (err, response, body) {

        console.log("Skip to next [" + response.statusCode + "] " + response.statusMessage);

        if (err) {
            const errstr = 'Could not skip to next.'
            console.error(errstr, err);
        }
        else {
            console.log('Skipped to Next');
        }
    });  
}

module.exports = router;
