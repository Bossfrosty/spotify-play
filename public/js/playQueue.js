class PlayQueue {
    constructor(session, tracks = []) {
        this.session = session;
        this.tracks = tracks;
    }

    async setTracks(trackElements) {
        this.clear();
        this.appendTracks(trackElements);
    }

    async appendTracks(trackElements) {
        for (const e of trackElements) {
            this.tracks.push(e.cloneNode(true));
        }
        return this.tracks;
    }

    async removeTrack(t) {
        const i = this.tracks.indexOf(t);
        this.tracks.splice(i, 1);
        return this.tracks;
    }

    async getUri(t) {
        let uriStr =  'spotify:track:' + t.getAttribute('track_id');
        return uriStr;
    }

    async getUris() {
        let uris = []
        for (let t of this.tracks) {
            const thisUri = await this.getUri(t);
            uris.push(thisUri);
        }
        return uris
    }

    async clear() {
        this.tracks = [];
    }
    
}
