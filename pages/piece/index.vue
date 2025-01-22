<script setup>
const { data } = await useAsyncData('pieces', () => queryContent('/pieces').find())

const pieces = data.value?.map(item => {
    return {
        id: item.id,
        op: item.op,
        nr: item.nr,
        key: item.key,
        majorMinor: item.majorMinor,
        meter: item.meter,
        opnr: item.op ? `${item.op} / ${item.nr}` : null,
        title: item.title,
        localRawFile: item.localRawFile,
    };
});

const columns = [
    { key: 'audio' },
    // { key: 'opnr', label: 'Op.', sortable: true },
    { key: 'title', label: 'Titel', sortable: true },
    { key: 'key', label: 'Tonart', sortable: true },
    { key: 'majorMinor', label: 'Tongeschlecht', sortable: true },
    { key: 'meter', label: 'Taktart', sortable: true },
    { key: 'actions' },
];

</script>

<template>
    <UContainer>
        <div class="flex flex-col gap-8">
            <Heading>Chorlieder</Heading>
            <UTable :rows="pieces" :columns="columns" class="mt-8">
                <template #audio-data="{ row }">
                    <MidiPlayer :url="row.localRawFile" class="text-2xl"/>
                </template>
                <template #title-data="{ row }">
                    <NuxtLink :to="{ name: 'piece-id', params: { id: row.id } }">
                        {{ row.title }}
                    </NuxtLink>
                </template>
                <template #actions-data="{ row }">
                    <div class="flex gap-1 justify-end">
                        <UButton size="sm" color="primary" variant="solid" label="VHV" :to="`https://verovio.humdrum.org/?file=${encodeURIComponent(`https://github.com/ImkeRedecker/hensel-chorlieder/blob/master/kern/${row.id}.krn`)}`" target="_blank" />
                        <UButton size="sm" color="primary" variant="solid" label="Anzeigen" :to="{ name: 'piece-id', params: { id: row.id } }" />
                    </div>
                </template>
            </UTable>
        </div>
    </UContainer>
</template>
