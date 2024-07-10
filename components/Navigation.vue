<script setup>
const links = [
    {
        label: 'Startseite',
        // badge: 100,
        to: '/',
    },
    {
        label: 'About',
        // icon: 'i-heroicons-home',
        to: '/about'
    },
    {
        label: 'Choräle',
        // icon: 'i-heroicons-chart-bar',
        // badge: 17,
        to: '/songs',
    },
    {
        label: 'Fanny',
        //icon: 'i-heroicons-command-line',
        to: '/fanny'
    },
];
</script>

<template>
    <nav class="border-b">
        <UHorizontalNavigation :links="links" />
    </nav>
</template>