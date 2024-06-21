<template>
    <UContainer>
        <nav>
            <nuxtLink to="/">Startseite</nuxtLink>
            <nuxtLink to="/about">About</nuxtLink>
            <nuxtLink to="/songs">Choräle</nuxtLink>
        </nav>
        <main>
            <slot></slot>
        </main>
    </UContainer>
</template>