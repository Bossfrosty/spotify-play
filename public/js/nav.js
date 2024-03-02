// TODO: Error handling

// Redirect to authentication if user is not logged in
fetch('/auth/status')
    .then(response => response.json())
    .then(data => {
        if (!data.authenticated) {
            window.location.href = '/auth/login';
        }
    });

document.getElementById('togglePlayback').addEventListener('click', function() {
    fetch('/api/toggle-playback')
}); 

document.getElementById('skipPrev').addEventListener('click', function() {
    fetch('/api/skip-prev')
}); 

document.getElementById('skipNext').addEventListener('click', function() {
    fetch('/api/skip-next')
}); 
