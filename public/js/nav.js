// TODO: Error handling

let playQueue = new PlayQueue();

document.getElementById('togglePlayback').addEventListener('click', function() {
    fetch('/api/toggle-playback')
}); 

document.getElementById('skipPrev').addEventListener('click', function() {
    fetch('/api/skip-prev')
}); 

document.getElementById('skipNext').addEventListener('click', function() {
    fetch('/api/skip-next')
});

async function getPlaylistElements() {

    let elems = [];

    // Fetch playlist data from backend
    const response = await fetch('/api/get-playlists');
    const playlistsJson = await response.json();
    const playlists = playlistsJson.items;

    // Create and add list elements for each playlist
    for (const i in playlists) {
        currentItem = playlists[i];
        if (currentItem.name) {

            // Create base list element
            const elem = document.createElement('li');
            elem.classList.add('cols', 'flex-container');
            elem.setAttribute('playlist_id', currentItem.id);

            // Create and append title
            const titleDiv = document.createElement('div');
            titleDiv.textContent = currentItem.name;
            elem.appendChild(titleDiv);

            // Create and append button
            const buttonDiv = document.createElement('div');
            buttonDiv.classList.add('list-options')
            const addElem = document.createElement('button');
            addElem.textContent = 'Add'
            buttonDiv.appendChild(addElem);
            elem.appendChild(buttonDiv);

            // Attach event listener
            elem.addEventListener('click', async (event) => {
                let playlistId = event.target.closest('li').getAttribute('playlist_id');
                let playlistTracks = await getPlaylistTrackElements(playlistId);
                loadList(playlistTracks, true);
            })    // Need to know associated playlist on click

            // Add to list
            elems.push(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A playlist object without name property at index ' + i + ' was ignored.')
        }
    }

    return elems;
}

async function getPlaylistTrackElements(playlistId) {

    let elems = [];

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
            elems.push(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A track object without name property at index ' + i + ' was ignored.')
        }
    }

    return elems;
}

async function loadList(elementList, backList) {

    const leftList = document.getElementById('left-list');
    leftList.innerHTML = '';    // Clear list contents
    leftList.removeAttribute('playlist_id');

    if (backList) {
        // Back anchor for returning to playlist list
        const backElem = document.createElement('a');
        let playlistElems = await getPlaylistElements();
        backElem.addEventListener('click', () => {loadList(playlistElems, false)});
        backElem.innerText = '< Back';
        backElem.classList.add('nav-item');
        leftList.append(backElem);
    }

    for (const e of elementList) {
        leftList.append(e);
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

    // Create and append buttons
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('list-options');

    const addElem = document.createElement('button');
    const playElem = document.createElement('button');

    addElem.textContent = 'Add'
    playElem.textContent = 'Play'

    buttonDiv.appendChild(addElem);
    buttonDiv.appendChild(playElem);
    elem.appendChild(buttonDiv);


    // Attach event listeners
    addElem.addEventListener('click', (event) => {
        playQueue.appendTracks([event.target.closest('li')]);
    });

    playElem.addEventListener('click', (event) => {
        const parentLi = event.target.closest('li');    // Has attributes for track
        const trackId = parentLi.getAttribute('track_id');

        const parentUl = parentLi.closest('ul');
        const playlistId = parentUl.getAttribute('playlist_id') // Has attributes for playlist
        playTrack('playlist', playlistId, trackId);
    });     // Need to know associated playlist on click

    return elem

}

// Redirects user if they are not yet authenticated
async function forceAuth() {
    fetch('/auth/status')
        .then(response => response.json())
        .then(async data => {
            if (!data.authenticated) {
                window.location.href = '/';
            }
            else {
                let playlistElems = await getPlaylistElements();
                loadList(playlistElems);
            }
        });
};
forceAuth();
