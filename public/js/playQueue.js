class PlayQueue {
    constructor(session, tracks = []) {
        this.session = session;
        this.tracks = tracks;
    }

    async appendTracks(trackElements) {
        for (const e of trackElements) {
            this.tracks.push(e);
        }
        console.log(this.tracks);
    }
    
}
