// TODO: Error handling

document.getElementById('togglePlayback').addEventListener('click', function() {
    fetch('/api/toggle-playback')
}); 

document.getElementById('skipPrev').addEventListener('click', function() {
    fetch('/api/skip-prev')
}); 

document.getElementById('skipNext').addEventListener('click', function() {
    fetch('/api/skip-next')
});

// Loads a list of all playlists
async function loadPlaylistList() {

    const playlistsDiv = document.getElementById('left-list');

    // Fetch playlist data from backend
    const response = await fetch('/api/get-playlists');
    const playlistsJson = await response.json();
    const playlists = playlistsJson.items;

    // Create and add list elements for each playlist
    for (const i in playlists) {
        currentItem = playlists[i];
        if (currentItem.name) {
            // Create new element
            const elem = document.createElement('li');
            elem.setAttribute('playlist_id', currentItem.id);
            const node = document.createTextNode(currentItem.name);
            elem.appendChild(node);
           
            // Attach event listener
            elem.addEventListener('click', (event) => {
                loadPlaylist(event.target.getAttribute('playlist_id'))
            })    // Need to know associated playlist on click
            
            // Add to list
            playlistsDiv.appendChild(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A playlist object without name property at index ' + i + ' was ignored.')
        }
    }
}
loadPlaylistList();

// Load playlist into view given it's Spotify ID
async function loadPlaylist(playlistId) {

    const rightDiv = document.getElementById('right-list');

    rightDiv.innerHTML = '';    // Clear list contents first

    // Fetch playlist data from backend
    const url = '/api/get-playlist?playlist_id=' + playlistId;
    const response = await fetch(url);
    const playlistJson = await response.json();
    const playlistItems = playlistJson.items // array of PlaylistTrackObject

    for (const i in playlistItems) {
        const thisItem = playlistItems[i];

        if (thisItem.track) {
            const thisTrack = thisItem.track;
            const trackName = thisTrack.name ?? 'Unknown Track';

            // Build artists string off array of ArtistObject
            let trackArtists = 'Unknown Artist';
            if (thisTrack.artists) {
                const artists = thisTrack.artists.map(artistObj => artistObj.name);
                trackArtists = artists.join(', ');
            }

            var trackStr = trackArtists + ' - ' + trackName;

            // Create new element
            const elem = document.createElement('li');
            elem.setAttribute('track_id', thisTrack.id);
            const node = document.createTextNode(trackStr);
            elem.appendChild(node);
           
            // Attach event listener
            elem.addEventListener('click', (event) => {
                loadTrack(event.target.getAttribute('track_id'))
            })    // Need to know associated playlist on click
            
            // Add to list
            rightDiv.appendChild(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A track object without name property at index ' + i + ' was ignored.')
        }
    }
}

async function loadTrack(trackId) {
    // STUB
}
