const express = require('express');
const session = require('express-session');
const request = require('request');

const app = express();
const router = express.Router();

// ROUTES

router.get('/get-profile', async (req, res) => {
    getProfile(req, async (err, profileInfo) => {
        return res.json(profileInfo);
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
        isPlaying ? pausePlayback(req) : startPlayback(req);

    });

    return res.status(200);
})

router.get('/start-playback', async (req, res) => {
    startPlayback(req);
    return res.status(200);

})

router.get('/skip-prev', async (req, res) => {
    skipPrev(req);
    return res.status(200);
    // TODO: Error handling
})

router.get('/skip-next', async (req, res) => {
    skipNext(req);
    return res.status(200);
})

router.get('/get-playlists', async (req, res) => {
    getPlaylists(req, async (err, playlistsData) => {
        return res.json(playlistsData);
    })
})

router.get('/get-playlist', async (req, res) => {
    getPlaylistTracks(req, async (err, playlistData) => {
        return res.json(playlistData);
    })
})

// FUNCTIONS

// Returns error and/or profile info as a JSON object in callback.
async function getProfile(req, callback) {

    const url = 'https://api.spotify.com/v1/me';
    const token = req.session.access_token;

    const options = {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }

    request.get(url, options, function (err, response, body) {
        
        if (err) {
            const errstr = 'Error getting profile info.'
            console.error(errstr, err);
            return callback(err);
        }

        console.log("Request User's Profile [" + response.statusCode + "] " + response.statusMessage);

        if (response.statusCode == 200) {
            const profileInfo = JSON.parse(body);
            return callback(null, profileInfo);
        }

        const errstr = 'Unknown error getting profile info.'
        console.error(errstr, err);
        return callback(new Error('Unknown error occurred getting profile info.'));

    })

}

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
        
        if (err) {
            const errstr = 'Error getting playback info.'
            console.error(errstr, err);
            return callback(err);
        }

        console.log("Request Playback Info [" + response.statusCode + "] " + response.statusMessage);

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
        const errstr = 'Unknown getting playback info.'
        console.error(errstr, err);
        return callback(new Error('Unknown error occurred getting playback info.'));
    });
}

async function startPlayback(req) {
    
    const url = 'https://api.spotify.com/v1/me/player/play';
    const token = req.session.access_token;
    let contextUri = ''
    let offsetUri = ''

    // Will pick from the first possible ID to use as context
    if (req.query.album_id) {
        contextUri = 'spotify:album:' + req.query.album_id;
    }
    else if (req.query.artist_id) {
        contextUri = 'spotify:artist:' + req.query.artist_id;
    }
    else if (req.query.playlist_id) {
        contextUri = 'spotify:playlist:' + req.query.playlist_id;
    }

    if (req.query.track_id) {
        const trackId = req.query.track_id;
        console.log('TRACK ID: ' + trackId);
        offsetUri = 'spotify:track:' + trackId;
    }

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            'context_uri': contextUri,
            'offset': {'uri': offsetUri}
        })
    }

    request.put(url, options, function (err, response, body) {

        console.log(options);

        if (err || !response) {
            const errstr = 'Could not start playback.'
            console.error(errstr, err);
        }
        else {
            if (response.statusCode == 404) {
                // TODO: Get default device ID at start of every session
                console.log('Got 404 trying to start playback. This may occur if you do not have an active device.')
            }
            else {
                console.log("Playback started");
            }
            console.log("Start Playback [" + response.statusCode + "] " + response.statusMessage);
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

        if (err) {
            const errstr = 'Could not pause playback.'
            console.error(errstr, err);
        }
        else {
            console.log("Playback paused");
        }

        console.log("Pause Playback [" + response.statusCode + "] " + response.statusMessage);
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

        if (err) {
            const errstr = 'Could not skip to previous.'
            console.error(errstr, err);
        }
        else {
            console.log('Skipped to previous');
        }

        console.log("Skip to prev [" + response.statusCode + "] " + response.statusMessage);
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
        
        if (err) {
            const errstr = 'Could not skip to next.'
            console.error(errstr, err);
        }
        else {
            console.log('Skipped to Next');
        }
    });  

    console.log("Skip to next [" + response.statusCode + "] " + response.statusMessage);
}

async function getPlaylists(req, callback) {

    // Everything is in getProfile callback function's body to deal with asynchronicity.
    // Promises may have been better here, but I find this method much more readable.
    getProfile(req, async (err, profileInfo) => {

        req.session.user_id = profileInfo.id;

        const userId = req.session.user_id;
        const url = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
        const token = req.session.access_token;
    
        const options = {
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }
    
        request.get(url, options, function (err, response, body) {
    
            console.log("Request User's Playlists [" + response.statusCode + "] " + response.statusMessage);
            return callback(null, JSON.parse(body));
    
        })
    
    })

}

async function getPlaylistTracks(req, callback) {

    const playlistId = req.query.playlist_id;
    const url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
    const token = req.session.access_token;

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.get(url, options, function (err, response, body) {

        console.log("Request Playlist Tracks [" + response.statusCode + "] " + response.statusMessage);
        return callback(null, JSON.parse(body));

    })

}

module.exports = router;
