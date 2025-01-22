import { defineStore } from 'pinia';

const defaultFilter = {
    hideLyrics: false,
    hideDynamics: false,
    pianoReduction: false,
    autobeam: false,
    bassstufen: false,
    fb: false,
    outerVoices: false,
};

export const usePieceFilterStore = defineStore('piece_filter', {
    state: () => ({...defaultFilter}),
    actions: {
        reset() {
            this.$patch({...defaultFilter});
        },
    },
});
