const config = require('./config.json');

const express = require("express");
const app = express();
const port = 8888;

async function getPlaybackState(token) {

    const url = "https://api.spotify.com/v1/me/player";

    const playbackState = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    return playbackState.json();
};

async function togglePlayback(token) {

    const isPlaying = await getPlaybackState(token).is_playing;

    if (isPlaying) {
        startPlayback(token);
    }
    else {
        pausePlayback(token)
    }

}

async function startPlayback(token) {
    // TODO
}

async function pausePlayback(token) {
    // TODO
}
