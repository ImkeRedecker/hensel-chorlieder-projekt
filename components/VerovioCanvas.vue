<script setup>
import 'vue-verovio-canvas/style.css';
import { VerovioCanvas, createAsyncVerovioToolkit } from 'vue-verovio-canvas';
import { VerovioToolkit } from 'verovio/esm';
import createVerovioModule from 'verovio/wasm-hum';

const toolkit = ref(null);
createVerovioModule().then(VerovioModule => {
    toolkit.value = createAsyncVerovioToolkit(new VerovioToolkit(VerovioModule));
});
</script>

<template>
    <VerovioCanvas :toolkit="toolkit" />
</template>