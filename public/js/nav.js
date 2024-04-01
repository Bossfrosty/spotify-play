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
    rightDiv.setAttribute('playlist_id', playlistId);
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
            const title = thisTrack.name ?? 'Unknown Track';
            let artists = thisTrack.artists ?? 'Unknown Artist';

            // Create & add element
            const elem = await createPlaylistTrackElement(thisTrack.id, title, artists)
            rightDiv.appendChild(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A track object without name property at index ' + i + ' was ignored.')
        }
    }
}

async function playTrack(contextType, contextId, trackId) {
    let baseUrl = '/api/start-playback'
    const params = new URLSearchParams();

    // Note context and offest requirments - https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
    if (contextType && contextId) {
        params.append(contextType + '_id', contextId);  // e.g. playlist_id=37i9dQZF1DX8gDIpdqp1XJ
    }
    if (trackId) {
        params.append('track_id', trackId)
    }

    fullUrl = baseUrl + '?' + params.toString();
    fetch(fullUrl);
}

async function createPlaylistTrackElement(id, titleStr, artists) {

    // Build artists string off array of ArtistObject
    let ArtistsStr = 'Unknown Artist';
    if (artists) {
        const artistsArr = artists.map(artistObj => artistObj.name);
        ArtistsStr = artistsArr.join(', ');
    }

    var trackStr = ArtistsStr + ' - ' + titleStr;

    // Create base list element
    const elem = document.createElement('li');
    elem.classList.add('cols', 'flex-container');
    elem.setAttribute('track_id', id);

    // Create and append title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = trackStr;
    elem.appendChild(titleDiv);

    // Create and append button
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('list-options')
    const buttonElem = document.createElement('button');
    buttonElem.textContent = 'Play'
    buttonDiv.appendChild(buttonElem);
    elem.appendChild(buttonDiv);


    // Attach event listener
    buttonElem.addEventListener('click', (event) => {
        const parentLi = event.target.closest('li');    // Has attributes for track
        const trackId = parentLi.getAttribute('track_id');

        const parentUl = parentLi.closest('ul');
        const playlistId = parentUl.getAttribute('playlist_id') // Has attributes for playlist
        playTrack('playlist', playlistId, trackId);
    })    // Need to know associated playlist on click

    return elem

}