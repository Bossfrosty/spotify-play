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
            let playlistElement = await createPlaylistElement(currentItem.id, currentItem.name);
            elems.push(playlistElement);
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

    // Create & add element
    for (const i in playlistItems) {
        const thisItem = playlistItems[i];
        if (thisItem.track) {
            const thisTrack = thisItem.track;
            const elem = await createTrackElement(thisTrack.id, thisTrack.name, thisTrack.artists);
            elems.push(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A track object without name property at index ' + i + ' was ignored.')
        }
    }

    return elems;
}

async function loadList(elementList, targetId, backList, copy) {

    const targetList = document.getElementById(targetId);
    targetList.innerHTML = '';    // Clear list contents
    targetList.removeAttribute('playlist_id');

    if (targetId == 'left-list') {
        for (e of elementList) {
            if (e.hasAttribute('track_id')) {
                setListOptions(e, 'listTrack')
            }
            else if (e.hasAttribute('playlist_id') ) {
                setListOptions(e, 'playlist');
            }
        }
    }
    else if (targetId == 'right-list') {
        for (e of elementList) {
            setListOptions(e, 'queueTrack');
        }
    }
    else {
        console.warn('Attempted to set options for an element based on context, but its location was unexpected.');
    }

    if (backList) {
        // Back anchor for returning to playlist list
        const backElem = document.createElement('a');
        let playlistElems = await getPlaylistElements();
        backElem.addEventListener('click', () => {loadList(playlistElems, 'left-list')});
        backElem.innerText = '< Back';
        backElem.classList.add('nav-item');
        targetList.append(backElem);
    }

    for (const e of elementList) {
        if (copy) {
            // Creats deep copy of element, keeping attributes and data, but not necessarily interactions
            targetList.append(e.cloneNode(true));
        }
        else {
            // Move the element by reference
            targetList.append(e);
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

async function createTrackElement(id, titleStr = 'No Title', artists) {

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
    titleDiv.classList.add('list-title');
    titleDiv.textContent = trackStr;
    elem.appendChild(titleDiv);

    // Create and append button div
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('list-options');
    elem.appendChild(buttonDiv);

    setListOptions(elem, 'playlist');

    return elem

}

// Valid styles: playlist, listTrack, queueTrack
async function setListOptions(element, style) {

    let optionsElement = element.getElementsByClassName('list-options')[0];
    optionsElement.innerHTML = '';

    // Button 'Play'
    if (style == 'listTrack' || style == 'queueTrack') {
        const playElem = document.createElement('button');
        playElem.textContent = 'Play';
        playElem.addEventListener('click', (event) => {
            const parentLi = event.target.closest('li');    // Has attributes for track
            const trackId = parentLi.getAttribute('track_id');
    
            const parentUl = parentLi.closest('ul');
            const playlistId = parentUl.getAttribute('playlist_id') // Has attributes for playlist
            playTrack('playlist', playlistId, trackId);
        });     // Need to know associated playlist on click
        optionsElement.appendChild(playElem);
    }

    // Button 'Add'
    if (style == 'playlist' || style == 'listTrack') {
        const addElem = document.createElement('button');
        addElem.textContent = 'Add';
        addElem.addEventListener('click', async (event) => {
            if (style == 'playlist') {
                let playlistId = event.target.closest('li').getAttribute('playlist_id');
                getPlaylistTrackElements(playlistId)
                    .then((playlistTracks) => playQueue.appendTracks(playlistTracks))
                    .then((trackList) => loadList(trackList, 'right-list', false, true));
            }
            else {
                playQueue.appendTracks(Array(event.target.closest('li')))
                    .then((trackList) => loadList(trackList, 'right-list', false, true));
            }
            
        });
        optionsElement.appendChild(addElem);
    }

    // Button 'Remove'
    if (style == 'queueTrack') {
        const removeElem = document.createElement('button');
        removeElem.textContent = 'Remove';
        removeElem.addEventListener('click', (event) => {
            // TODO
        });
        optionsElement.appendChild(removeElem);
    }
}

async function createPlaylistElement(id, titleStr) {

    // Create base list element
    const elem = document.createElement('li');
    elem.classList.add('cols', 'flex-container');
    elem.setAttribute('playlist_id', id);

    // Create and append title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('list-title');
    titleDiv.textContent = titleStr;
    elem.appendChild(titleDiv);

    // Create and append button div
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('list-options');
    elem.appendChild(buttonDiv);

    setListOptions(elem, 'playlist');

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
                loadList(playlistElems, 'left-list', false);
            }
        });
};
forceAuth();
