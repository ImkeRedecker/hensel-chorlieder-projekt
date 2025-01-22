import { defineStore } from 'pinia';

export const useMidiPlayer = defineStore('midiPlayerStore', {
    state: () => ({ midiPlayer: null, stopFn: null }),
    actions: {
        update(midiPlayer, stopFn) {
            if (this.midiPlayer) {
                if (this.stopFn) {
                    this.stopFn();
                } else {
                    this.midiPlayer.stop();
                }
            }
            this.midiPlayer = midiPlayer ?? null;
            this.stopFn = stopFn ?? null;
        },
    },
});
