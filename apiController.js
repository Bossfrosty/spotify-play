const express = require('express');
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

    await getPlaybackInfo(req, async (err, playbackInfo) => {
        
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

router.get('/create-playlist', async (req, res) => {
    createPlaylist(req, async (err, body) => {
        return res.json(body);
    });
})

router.post('/set-queue', async (req, res) => {
    setQueue(req, async (err, body) => {
        return res.json(body);
    });
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
    // TODO: This could be its own function
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

        if (err || !response) {
            const errstr = 'Could not start playback.'
            console.error(errstr, err);
        }
        else {
            console.log("Start Playback [" + response.statusCode + "] " + response.statusMessage);
            if (response.statusCode == 404) {
                // TODO: Get default device ID at start of every session
                console.log('Got 404 trying to start playback. This may occur if you do not have an active device.')
            }
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

        try {
            console.log("Skip to prev [" + response.statusCode + "] " + response.statusMessage);
        }
        catch (err) {
            console.error('Error in skipPrev response', err);
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
        
        if (err) {
            const errstr = 'Could not skip to next.'
            console.error(errstr, err);
        }

        try {
            console.log("Skip to next [" + response.statusCode + "] " + response.statusMessage);
        }
        catch (err) {
            console.error('Error in skipNext response', err);
        }
    });  
}

async function getPlaylists(req, callback) {

    // Everything is in getProfile callback function's body to deal with asynchronicity.
    // Promises may have been better here, but I find this method much more readable.
    getProfile(req, async (err, profileInfo) => {

        if (err) {
            const errstr = 'Could not get playlists.'
            console.error(errstr, err);
            return callback(err);
        }

        if (!profileInfo || !profileInfo.id) {
            const err = new Error('profileInfo property missing or incomplete');
            console.error(err);
            return callback(err);
        }

        let token = '';
        let userId = '';

        try {
            validateToken(req);
            req.session.user_id = profileInfo.id;
            const userId = req.session.user_id;
            token = req.session.access_token;
        }
        catch (err) {
            console.error('Could not getPlaylists', err);
            return callback(err);
        }

        const url = 'https://api.spotify.com/v1/users/' + userId + '/playlists';

        const options = {
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }
    
        request.get(url, options, function (err, response, body) {
    
            try {
                console.log("Request User's Playlists [" + response.statusCode + "] " + response.statusMessage);
                return callback(null, JSON.parse(body));
            }
            catch (err) {
                console.error('Error in getPlaylists response', err)
                return callback(err);
            }
        })
    })
}

async function getPlaylistTracks(req, callback) {

    let playlistId = ''
    let token = ''

    try {
        validateQuery(req, 'playlist_id')
        playlistId = req.query.playlist_id;
        token = req.session.access_token;
    }
    catch (err) {
        console.error('Could not get playlist tracks ', err)
        return callback(err);
    }

    const url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    request.get(url, options, function (err, response, body) {

        try {
            console.log("Request Playlist Tracks [" + response.statusCode + "] " + response.statusMessage);
            return callback(null, JSON.parse(body));    
        }
        catch (err) {
            console.error('Error in getPlaylistTracks response', err);
            return callback(err);
        }
    })
}

async function setQueue(req, callback) {
    // Modifying Spotify's playback queue is limited, so instead a "Queue" playlist
    // is created to simulate the application's queue. As a result, the queue will be visible as
    // a playlist on the user's Spotify account.

    req.query.playlist_name = 'queue';
    req.query.playlist_public = 'false';

    try {
        await createPlaylist(req, async (err, res) => {

            if (!res.id) {
                throw new Error('Queue ID missing');
            }
            const queueId = res.id;
            req.query.playlist_id = queueId;

            addToPlaylist(req, (err) => {
                return callback(err);
            })

            return callback(null);
        });
    }
    catch (err) {
        console.error('Error setting queue', err);
        return callback(err);
    }
}

async function createPlaylist(req, callback) {

    let userId = '';
    let token = '';
    let name = '';
    let public = '';

    try {
        if (!req.session.user_id) {
            throw new Error('Missing user ID in createPlaylist');
        }
        userId = req.session.user_id;

        validateToken(req);
        token = req.session.access_token;

        validateQuery(req, 'playlist_name', 'playlist_public');
        name = req.query.playlist_name;
        public = req.query.playlist_public;
    }
    catch (err) {
        console.error('Could not create playlist ', err)
        return callback(err);
    }

    const url = 'https://api.spotify.com/v1/users/' + userId + '/playlists'

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            'name': name,
            'public': public
        })
    };

    request.post(url, options, function (err, response, body) {

        if (err) {
            const errstr = 'Could not create playlist '
            console.error(errstr, err);
            return callback(err);
        }

        try {
            console.log("Create New Playlist [" + response.statusCode + "] " + response.statusMessage);
            return callback(null, JSON.parse(body));
        }
        catch (err) {
            console.error('Error in createPlaylist response', err);
        }
    });

}

async function addToPlaylist(req, callback) {

    let token = '';
    let playlistId = '';
    let uris = '';

    try {
        validateToken(req);
        token = req.session.access_token;

        validateQuery(req, 'playlist_id');
        playlistId = req.query.playlist_id;   // Target playlist

        if (!req.body || !req.body.track_uris) {
            throw new Error('Missing or incomplete request body')
        }
        uris = req.body.track_uris;           // JSON Array of track URIs to add
    }
    catch (err) {
        console.error('Could not add to playlist', err);
        return callback(err);
    }

    const url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks'

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            'uris': uris
        })
    };

    request.post(url, options, function (err, response, body) {

        if (err) {
            const errstr = 'Could not add to playlist.'
            console.error(errstr, err);
            return callback(err);
        }

        try {
            console.log("Add To Playlist [" + response.statusCode + "] " + response.statusMessage);
            return callback(null, JSON.parse(body));
        }
        catch (err) {
            console.error('Error in addToPlaylist response ', err);
        }
    });
}

// ERROR HANDLING

function validateToken(req) {
    if (!req.session || !req.session.access_token) {
        throw new Error('Access token is missing');
    }
}

function validateQuery(req, ...queries) {
    if (!req.query) {
        throw new Error ('Missing query');
    }
    for (const q of queries) {
        if (!req.query[q]) {
            throw new Error ('Missing query parameter ' + q);
        }
    }
}

module.exports = router;
