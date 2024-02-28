// TODO: Error handling

fetch('/auth/status')
    .then(response => response.json())
    .then(data => {
        if (data.authenticated) {
            document.getElementById('login').style.display = 'none';
        }
        else {
            document.getElementById('login').style.display = 'block';
        }
    });

document.getElementById('togglePlayback').addEventListener('click', function() {
    fetch('/api/toggle-playback')
}); 