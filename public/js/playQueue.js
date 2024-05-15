class PlayQueue {
    constructor(session, tracks = []) {
        this.session = session;
        this.tracks = tracks;
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

    async clear() {
        this.tracks = [];
    }
    
}
