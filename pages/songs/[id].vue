<script setup>
const route = useRoute();
const id = route.params.id;
const config = useRuntimeConfig();
const kernFile = `${config.app.baseURL}kern/hensel-chorlieder/${id}.krn`;
</script>

<template>
{{ id }}

<VerovioCanvas :url="kernFile"></VerovioCanvas>
</template>
