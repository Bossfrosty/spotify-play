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

document.getElementById('queue-clear').addEventListener('click', function() {
    playQueue.clear()
        .then((trackList) => loadList(trackList, 'right-list', false, true));
});

document.getElementById('queue-set').addEventListener('click', function () {
    playQueue.getUris()
        .then(uriStr =>
            fetch('/api/set-queue', {
                method: 'POST',
                body: JSON.stringify({
                    track_uris: uriStr
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            ))
});

document.getElementById('create-playlist').addEventListener('click', function() {
    let playlistName = prompt('Enter playlist name: ');
    const url = '/api/create-playlist?playlist_name=' + playlistName;
    fetch(url);
})

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

async function loadList(elements, targetId, backList) {

    const targetList = document.getElementById(targetId);
    targetList.innerHTML = '';    // Clear list contents
    targetList.removeAttribute('playlist_id');

    if (!elements) {
        // Empty list, do nothing
    }
    else {
        if (targetId == 'left-list') {
            for (const e of elements) {
                if (e.hasAttribute('track_id')) {
                    setListStyle(e, 'listTrack')
                }
                else if (e.hasAttribute('playlist_id')) {
                    setListStyle(e, 'playlist');
                }
            }
        }
        else if (targetId == 'right-list') {
            for (const e of elements) {
                setListStyle(e, 'queueTrack');
            }
        }
        else {
            console.warn('Attempted to set options for an element based on context, but its location was unexpected.');
        }

        for (const e of elements) {
            targetList.append(e);
        }
    }

    if (backList) {
        // Back anchor for returning to playlist list
        const backElem = document.createElement('a');
        let playlistElems = await getPlaylistElements();
        backElem.addEventListener('click', () => { loadList(playlistElems, 'left-list') });
        backElem.innerText = '< Back';
        backElem.classList.add('nav-item');
        targetList.prepend(backElem);
    }

    return targetList;
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

async function createPlaylistElement(id, titleStr) {

    // Create base list element
    const elem = document.createElement('li');
    elem.classList.add('cols', 'flex-container');
    elem.setAttribute('playlist_id', id);

    // Create and append title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('elem-title');
    titleDiv.textContent = titleStr;
    elem.appendChild(titleDiv);

    // Create and append button div
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('elem-options');
    elem.appendChild(buttonDiv);

    titleDiv.addEventListener('click', async (event) => {
        let playlistId = event.target.closest('li').getAttribute('playlist_id');
        let playlistTracks = await getPlaylistTrackElements(playlistId);
        loadList(playlistTracks, 'left-list', true)
            .then((loadedList) => {
                loadedList.setAttribute('playlist_id', playlistId);
            });
    });

    setListStyle(elem, 'playlist');

    return elem

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
    titleDiv.classList.add('elem-title');
    titleDiv.textContent = trackStr;
    elem.appendChild(titleDiv);

    // Create and append button div
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('elem-options');
    elem.appendChild(buttonDiv);

    // Draggable
    setDragAndDropLi(elem);

    setListStyle(elem, 'playlist');

    return elem

}

// Valid styles: playlist, listTrack, queueTrack
async function setListStyle(element, style) {

    let optionsElement = element.getElementsByClassName('elem-options')[0];
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
        });
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
                    .then((trackList) => loadList(trackList, 'right-list', false));
            }
            else {
                playQueue.appendTracks(Array(event.target.closest('li')))
                    .then((trackList) => loadList(trackList, 'right-list', false));
            }
            
        });
        optionsElement.appendChild(addElem);
    }

    // Button 'Remove'
    if (style == 'queueTrack') {
        const removeElem = document.createElement('button');
        removeElem.textContent = 'Remove';
        removeElem.addEventListener('click', (event) => {
            const parentLi = event.target.closest('li');    // Has attributes for track
            playQueue.removeTrack(parentLi)
                .then((trackList) => loadList(trackList, 'right-list', false));
        });
        optionsElement.appendChild(removeElem);
    }

    // Drag & Drop
    if (style == 'queueTrack') {
        setDragAndDropLi(element);
    }
}

// DRAG AND DROP //

async function setDragAndDropLi(e) {
    e.setAttribute('draggable', 'true');

    e.addEventListener('dragstart', (event) => {
        if (!event.target.id) {
            // Assign a temp id to the element to recieve on drop
            const tempId = 'temp-' + Math.random().toString(36).substring(2, 10);
            e.id = tempId;
            event.dataTransfer.setData('text/plain', tempId);
        }
        else {
            event.dataTransfer.setData('text/plain', event.target.id);
        }
    });

    e.addEventListener('dragend', (event) => {
        // Nothing... for now
    });

    e.addEventListener('drop', (event) => {
        event.preventDefault();

        // Get dropping element
        const droppedId = event.dataTransfer.getData('text/plain');
        const dropped = document.getElementById(droppedId);
        if (droppedId.substring(0, 5) == 'temp-') {
            // Unassign temp id
            dropped.removeAttribute('id');
        }

        // Get parent list
        const parentList = event.target.closest('ul');

        // Then find element we're hovering over
        const dropTarget = event.target.closest('li');

        // Then append to parent list after element we're hovering over
        parentList.insertBefore(dropped, dropTarget);

    });

    e.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow a drop
    });
}

async function drag() {

}

async function init() {
    let playlistElems = await getPlaylistElements();
    loadList(playlistElems, 'left-list', false);

    // Set up observers
    const queueList = document.getElementById('right-list');
    const listObserver = new MutationObserver((mutationRecord, observer) => {
        for (let mutation of mutationRecord) {
            if (mutation.type === 'childList') {
                // Refresh queue. This isn't very efficient and will likely be removed.
                let queueTracks = queueList.getElementsByTagName('li');
                playQueue.setTracks(queueTracks);
            }
        }
    });

    // Assuming only adding/removing elements need to be observed
    const config = {
        childList: true,    
        attribures: false,
        subtree: false
    };

    listObserver.observe(queueList, config);
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
                init();
            }
        });
};
forceAuth();
