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
            const elem = document.createElement('li');
            const node = document.createTextNode(currentItem.name);
            elem.addEventListener('click', (event) => {
                loadPlaylist(event.target.textContent)})    // Need to know associated playlist on click
            elem.appendChild(node);
            playlistsDiv.appendChild(elem);
        }
        else {
            // This could occur if there are playlists without names or objects that aren't playlists
            console.warn('A playlist object without name property at index ' + i + ' was ignored.')
        }
    }

}
loadPlaylistList();

// Stub
async function loadPlaylist(listName) {
    console.log(listName);
}
