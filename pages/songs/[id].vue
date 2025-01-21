<script setup>
const route = useRoute();
const id = route.params.id;
const kernFile = `/kern/hensel-chorlieder/${id}.krn`;
</script>

<template>
{{ id }}

<VerovioCanvas :url="kernFile"></VerovioCanvas>
</template>
