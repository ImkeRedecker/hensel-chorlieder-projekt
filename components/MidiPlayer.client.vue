<script setup>
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';
import { createWorkerVerovioToolkit } from 'vue-verovio-canvas';

const midiPlayerStore = useMidiPlayer();

const props = defineProps({
    url: String,
});

const { verovioWorker } = useVerovioWorker();

const midiPlayerIsReady = new Deferred();
const soundFrontIsReady = new Deferred();
const isReady = new Deferred();
let ac = null;
const instrument = ref(null);
const midiPlayer = new MidiPlayer.Player();
const isPlaying = ref(false);
const instrumentName = ref('marimba');
const seek = ref(0);
const duration = ref(0);
const state = ref(null);

Promise.all([midiPlayerIsReady.promise, soundFrontIsReady.promise]).then(() => {
    isReady.resolve();
    isLoading.value = false;
});

const activeKeys = {};

midiPlayer.on('midiEvent', ({ name, velocity, noteNumber }) => {
    if (name === 'Note on') {
        if (velocity === 0) {
            instrument.value.stop(ac.currentTime, [activeKeys[noteNumber]]);
        } else {
            activeKeys[noteNumber] = instrument.value.play(noteNumber).id;
        }
    }
});

midiPlayer.on('endOfFile', () => {
    stop();
});

midiPlayer.on('fileLoaded', () => {
    midiPlayerIsReady.resolve();
});

midiPlayer.on('playing', () => {
    requestAnimationFrame(updateLoop);
});


midiPlayer.on('midiEvent', () => {
    requestAnimationFrame(updateLoop);
});

async function play() {
    await isReady.promise;
    midiPlayer.play();
    isPlaying.value = true;
}

async function stop() {
    await isReady.promise;
    midiPlayer.stop();
    isPlaying.value = false;
}

async function pause() {
    await isReady.promise;
    midiPlayer.pause();
    isPlaying.value = false;
}

async function toggle() {
    if (isPlaying.value) {
        pause();
    } else {
        play();
    }
}

function loadInstrument(name) {
    // marimba acoustic_grand_piano trumpet voice_oohs
    Soundfont.instrument(ac, name).then(value => {
        instrument.value = value;
        soundFrontIsReady.resolve();
    });
}

onUnmounted(async () => {
    await stop();
});

async function onClick() {
    if (isPlaying.value) {
        stop();
        return;
    }
    if (state.value !== 'loaded') {
        state.value = 'loading';
        try {
            ac ??= new AudioContext();
            loadInstrument(instrumentName.value);
            const toolkit = createWorkerVerovioToolkit(verovioWorker);
            const kern = await $fetch(props.url, { parseResponse: (txt) => txt});
            toolkit.loadData(kern);
            const midiBase64 = await toolkit.renderToMIDI();
            if (midiBase64) {
                midiPlayer.loadDataUri(`data:audio/midi;base64,${midiBase64}`);
                duration.value = midiPlayer.getSongTime();
                midiPlayerStore.update(midiPlayer, stop);
                state.value = 'loaded';
                play();
            }
        } catch {
            state.value = 'loaderror';
        }
    }

    play();
}

function updateLoop(s) {
    seek.value = (midiPlayer.getSongTime() - midiPlayer.getSongTimeRemaining()) || 0;
}

const radius = 50;
const strokeWidth = 12;

function getCoords(radius, angle) {
    return {
        x: radius * Math.sin(Math.PI * 2 * angle / 360),
        y: radius * Math.cos(Math.PI * 2 * angle / 360),
    };
}

const audioSeekAngle = computed(() => {
    const s = parseFloat(seek.value ?? 0);
    const d = parseFloat(duration.value ?? 0);
    return d !== 0 ? s / d * 360 : 0;
});

const circlePath = computed(() => {
    const { x, y }  = getCoords(radius - strokeWidth / 2, audioSeekAngle.value ?? 0);
    return `M ${radius} ${strokeWidth / 2} A ${radius - strokeWidth / 2} ${radius - strokeWidth / 2} 0 ${audioSeekAngle.value > 180 ? 1 : 0} ${audioSeekAngle.value > 0 ? 1 : 0} ${radius + x} ${radius - y}`;
});

</script>

<template>
    <div class="w-[1em] flex justify-center">
        <div class="text-primary-500 flex items-center">
            <div v-if="state === 'loaderror'" class="text-red-500 flex items-center">
                <UIcon name="heroicons:exclamation-triangle-solid" />
            </div>
            <div v-else-if="isPlaying" class="relative cursor-pointer flex items-center" @click="onClick">
                <UIcon name="heroicons:pause-circle-solid" />
                <div class="absolute z-1 pointer-events-none w-[1.2em] h-[1.2em] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <svg :viewBox="`0 0 ${radius * 2} ${radius * 2}`" class="w-full h-full">
                        <g stroke="currentColor" fill="none" :stroke-width="strokeWidth">
                            <path :d="circlePath" />
                        </g>
                    </svg>
                </div>
            </div>
            <div v-else-if="state === 'loading'" class="flex items-center">
                <UIcon name="heroicons:arrow-path" class="inline-block spin" />
            </div>
            <div v-else class="cursor-pointer flex items-center" @click="onClick">
                <UIcon name="heroicons:play-circle-solid" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.spin {
    animation-name: spin;
    animation-duration: 2000ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
}
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
