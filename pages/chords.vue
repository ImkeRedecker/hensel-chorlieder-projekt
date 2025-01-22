<script setup>
import { onKeyStroke } from '@vueuse/core';

const { data: chordsData } = await useAsyncData('chords', () => queryContent('/chords').findOne(), {
    deep: false,
});

const { data: pieceData } = await useAsyncData('pieces', () => queryContent('/pieces').find(), {
    deep: false,
});

const pieceOptions = pieceData.value?.map(piece => ({
    id: piece.id,
    label: piece.title,
}));

const chords = chordsData.value.chords;
const uniqueDegs = [...new Set(chords.map(chord => chord.deg))].toSorted((a, b) => {
    return a.replaceAll(/\D/g, '') < b.replaceAll(/\D/g, '') ? -1 : 1;
});
const uniqueFb = [...new Set(chords.map(chord => chord.fb))].toSorted((a, b) => {
    const aCount = a.split(' ').length;
    const bCount = b.split(' ').length;
    if (aCount === bCount) {
        return a.localeCompare(b);
    }
    return aCount - bCount;
});
const uniqueHint = [...new Set(chords.map(chord => chord.hint))].toSorted((a, b) => {
    const aCount = a.split(' ').length;
    const bCount = b.split(' ').length;
    if (aCount === bCount) {
        return a.replaceAll(/\D/g, '').localeCompare(b.replaceAll(/\D/g, ''));
    }
    return aCount - bCount;
});
const uniqueBeatWeights = [...new Set(chords.map(chord => chord.meterWeight))];

const { filters, filteredChords, resetFilters } = useChordFilter(chords);
const viewFbMode = ref('fb');

const fbGroupedChords = computed(() => {
    return Object.entries(filteredChords.value.reduce((obj, chord) => {
        const index = viewFbMode.value === 'fb' ? chord.fb : chord.hint;
        obj[index] = (obj[index] ?? 0) + 1;
        return obj;
    }, {})).sort((a, b) => b[1] - a[1]);;
});

const degGroupedChords = computed(() => {
    return Object.entries(filteredChords.value.reduce((obj, chord) => {
        const index = chord.deg;
        obj[index] = (obj[index] ?? 0) + 1;
        return obj;
    }, {})).sort((a, b) => b[1] - a[1]);;
});

const nextDegGroupedChords = computed(() => {
    return Object.entries(filteredChords.value.reduce((obj, chord) => {
        const index = chord.nextDeg;
        obj[index] = (obj[index] ?? 0) + 1;
        return obj;
    }, {})).sort((a, b) => b[1] - a[1]);;
});

const fbConfig = computed(() => ({
    type: 'bar',
    data: {
        datasets: [{
            label: viewFbMode.value === 'fb' ? 'Bezifferungen' : 'Exakte Intervalle',
            data: fbGroupedChords.value.map(i => ({ x: i[0], y: i[1] })),
        }],
    },
    options: {
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                // display: false,
                onClick: (e) => e.stopPropagation(),
            },
            tooltip: {
                yAlign: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    },
}));

const degConfig = computed(() => ({
    type: 'bar',
    data: {
        datasets: [{
            label: 'Bassstufen',
            data: degGroupedChords.value.map(i => ({ x: i[0], y: i[1] })),
        }],
    },
    options: {
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                // display: false,
                onClick: (e) => e.stopPropagation(),
            },
            tooltip: {
                yAlign: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    },
}));

const nextDegConfig = computed(() => ({
    type: 'bar',
    data: {
        datasets: [{
            label: 'Nächste Bassstufe',
            data: nextDegGroupedChords.value.map(i => ({ x: i[0], y: i[1] })),
        }],
    },
    options: {
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                // display: false,
                onClick: (e) => e.stopPropagation(),
            },
            tooltip: {
                yAlign: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    },
}));

function chartClickHandler(type, chart, event) {
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false, axis: 'x' }, true);
    if (points.length) {
        const firstPoint = points[0];
        const prop = filters[type];
        const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index].x;
        filters[type] = (prop === value || prop.includes?.(value)) ? [] : [value];
    }
}

const openModal = ref(null);
const modalScoreData = ref();
const {app: {baseURL: configAppBaseUrl}} = useRuntimeConfig();
async function loadScoreData(group) {
    modalScoreData.value = null;
    const kernFile = `${configAppBaseUrl}kern/hensel-chorlieder/${group.id}.krn`;
    const data = await $fetch(kernFile, { parseResponse: (txt) => txt });
    const lines = data.split('\n');
    const choraleIntervalLength = chordsData.value.chords.filter(i => i.id === group.id).length;
    if (group.chords.length < choraleIntervalLength) {
        group.chords.forEach((chord) => {
            for (let i = 0; i < lines.length; i++) {
                if (i === chord.lineNumber - 1) {
                    const tokens = lines[i].split('\t');
                    tokens.forEach((_, tokenIndex) => {
                        // TODO ignore resolve for weak beats
                        const resolvedLineIndex = getResolvedTokenLineIndex(i, tokenIndex, lines);
                        if (resolvedLineIndex) {
                            lines[resolvedLineIndex] = lines[resolvedLineIndex].split('\t').map((token, ti) => {
                                if (ti === tokenIndex &&/^[\[\(]?\d+/.test(token)) {
                                    return `${token}@`;
                                }
                                return token;
                            }).join('\t');
                        }
                    });
                }
            }
        });
    }
    lines.push('!!!filter: deg -k 1 --circle');
    lines.push('!!!filter: fb -cnl --above');
    lines.push('!!!filter: extract -I text');
    lines.push('!!!filter: extract -I dynam');
    lines.push('!!!filter: autobeam');
    lines.push('!!!filter: satb2gs');
    lines.push('!!!RDF**kern: @ = marked note');
    modalScoreData.value = lines.join('\n');
    openModal.value = group.id;
}

function closeModal() {
    openModal.value = null
    activeIndex = null;
    modalScoreData.value = null;
}

let activeIndex = null;
function loadIndex(index) {
    const item = chordsGroupById.value[index]; 
    if (item) {
        loadScoreData(item);
        activeIndex = index;
    }
}

const chordsGroupById = computed(() => {
    return Object.entries(filteredChords.value.reduce((accumulator, elem) => {
        accumulator[elem.id] = accumulator[elem.id] ?? [];
        accumulator[elem.id].push(elem);
        return accumulator;
    }, {})).map(([id, elements]) => ({
        id,
        chords: elements,
    })).sort((a, b) => {
        const aSplit = a.id.split('-', 2);
        const bSplit = b.id.split('-', 2);
        const aNum = parseFloat(aSplit[0]);
        const bNum = parseFloat(bSplit[0]);
        if (aNum === bNum) {
            return aSplit[1].localeCompare(bSplit[1]);
        }
        return aNum - bNum;
    });
});

function tokenIsDataRecord(line, includeNullToken = false) {
    return !line.startsWith('!') && !line.startsWith('*') && !line.startsWith('=') && !(!includeNullToken && line === '.');
}

function getResolvedTokenLineIndex(lineIndex, spineIndex, lines) {
    for (let i = lineIndex; i >= 0; i--) {
        const token = lines[i].split('\t')[spineIndex];
        if (token && tokenIsDataRecord(token)) {
            return i;
        }
    }
    return null;
}

onKeyStroke('ArrowLeft', () => {
    if (activeIndex !== null) loadIndex(activeIndex - 1);
});

onKeyStroke('ArrowRight', () => {
    if (activeIndex !== null) loadIndex(activeIndex + 1);
});

const meterWeightModalIsOpen = ref(false);
const hintInfoModalIsOpen = ref(false);
const searchInfoModalIsOpen = ref(false);
</script>

<template>
    <UContainer>
        <Heading>Akkorde</Heading>
        <div>
            <div>
                <div class="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                    <UFormGroup label="Modus">
                        <USelectMenu v-model="viewFbMode" :options="[{id: 'fb', label: 'Generalbass-Ziffern'}, {id: 'hint', label: 'Exakte Intervalle'}]" value-attribute="id" option-attribute="label" size="xs" class="w-40" />
                    </UFormGroup>
                    <UFormGroup label="Chorlieder">
                        <USelectMenu v-model="filters.piece" :options="pieceOptions" multiple searchable value-attribute="id" option-attribute="label" size="xs" class="w-40" />
                    </UFormGroup>
                    <UFormGroup label="Bassstufe">
                        <USelectMenu v-model="filters.deg" :options="uniqueDegs" multiple size="xs" class="w-32" />
                    </UFormGroup>
                    <UFormGroup label="Nächste Bassstufe">
                        <USelectMenu v-model="filters.nextDeg" :options="uniqueDegs" multiple size="xs" class="w-32" />
                    </UFormGroup>
                    <UFormGroup label="Bezifferung">
                        <USelectMenu v-model="filters.fb" :options="uniqueFb" multiple searchable size="xs" class="w-32" />
                    </UFormGroup>
                    <UFormGroup label="Intervalle">
                        <USelectMenu v-model="filters.hint" :options="uniqueHint" multiple searchable size="xs" class="w-32" />
                    </UFormGroup>
                    <UFormGroup label="Intervallsuche">
                        <UInput v-model="filters.search" size="xs" class="w-32" />
                    </UFormGroup>
                    <UFormGroup label="Orgelpunkt">
                        <USelectMenu v-model="filters.pedalPoint" :options="[{id: 'ignore', label: 'Ignorieren'}, {id: 'exclude', label: 'Ausschliessen'}, {id: 'isolate', label: 'Isolieren'}]" value-attribute="id" option-attribute="label" class="w-32" size="xs" />
                    </UFormGroup>
                    <UFormGroup label="Zählzeiten">
                        <USelectMenu v-model="filters.meterWeight" :options="uniqueBeatWeights" multiple class="w-32" size="xs" />
                    </UFormGroup>
                    <UFormGroup label="&nbsp;">
                        <UButton icon="i-heroicons-funnel" color="gray" size="xs" @click="resetFilters">
                            Zurücksetzen
                        </UButton>
                    </UFormGroup>
                </div>
            </div>

            <div class="my-4">
                {{ filteredChords.length }} / {{ chords.length }}
            </div>

            <div class="grid md:grid-cols-4 gap-4">
                <div class="col-span-2">
                    <div class="h-[300px]">
                        <Chart :config="fbConfig" @chart-click="(chart, event) => chartClickHandler(viewFbMode, chart, event)" />
                    </div>
                </div>
                <div>
                    <div class="h-[300px]">
                        <Chart :config="degConfig" @chart-click="(chart, event) => chartClickHandler('deg', chart, event)" />
                    </div>
                </div>
                <div>
                    <div class="h-[300px]">
                        <Chart :config="nextDegConfig" @chart-click="(chart, event) => chartClickHandler('nextDeg', chart, event)" />
                    </div>
                </div>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-2 mt-8">
            <UButton v-for="(group, index) in chordsGroupById" :key="group.id" @click="loadIndex(index)">
                {{ `${group.id} (${group.chords.length})` }}
                <Modal v-if="openModal === group.id" @close="closeModal" :title="group.id">
                    <MidiPlayer :url="`${configAppBaseUrl}kern/hensel-chorlieder/${group.id}.krn`" class="text-2xl" />
                    <VerovioCanvas v-if="modalScoreData"  :data="modalScoreData" :scale="35" :page-margin="50" :key="modalScoreData" />
                    <div class="flex gap-4">
                        <UButton v-if="chordsGroupById[index - 1]" @click="loadIndex(index - 1)" class="mr-auto">Vorheriges</UButton>
                        <UButton v-if="chordsGroupById[index + 1]" @click="loadIndex(index + 1)" class="ml-auto">Nächstes</UButton>
                    </div>
                </Modal>
            </UButton>
        </div>
    </UContainer>
</template>
