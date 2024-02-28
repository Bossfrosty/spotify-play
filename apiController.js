const express = require('express');
const session = require('express-session');
const request = require('request');

const app = express();
const router = express.Router();


router.get('/playback', async (req, res) => {

    const url = "https://api.spotify.com/v1/me/player";
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + token
        }
    }

    request.get(url, options, function (err, response, body) {

        console.log(statusStr(response.statusCode, response. statusMessage))

        function statusStr(status, message) {
            return "Request Playback Info [" + status + "] " + message;
        }

        if (err) {
            const errstr = 'Error getting playback info.'
            console.error(errstr, err);
            return callback(err);
        }

        if (response.statusCode == 204) {
            // Playback not available or active
            // TODO
        }

        if (response.statusCode == 200) {
            // Just passing Spotify's response here
            const playbackInfo = JSON.parse(body);
            return callback(null, playbackInfo);
        }

        // TODO: Specific handling for other response codes
        return res.status(response.statusCode).send('Unhandled response code: ' + response.statusCode);

    })

})

router.get('/toggle-playback', async (req, res) => {

    getPlaybackInfo(req, async (err, playbackInfo) => {
        
        if (err) {
            return res.status(500).send();
        }

        // Spotify is not playing when playing when player is not active (204 -> no playbackInfo)
        // otherwise, playback status = is_playing 
        var isPlaying = playbackInfo?.is_playing ?? false;

        console.log('Playback status: ' + isPlaying);

        isPlaying ? pausePlayback() : startPlayback();

    });

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
            // Playback not available or active
            const errstr = 'Playback not available or active.'
            console.error(errstr, err);
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

    })

}

async function startPlayback(token) {
    console.log("Playback started")
    // TODO
}

async function pausePlayback(token) {
    console.log("Playback stopped")
    // TODO
}

module.exports = router;
