export function useChordFilter(chords, defaults) {

    const defaultFilters = Object.assign({
        deg: [],
        nextDeg: [],
        hint: [],
        fb: [],
        search: null,
        pedalPoint: 'ignore',
        meterWeight: [],
        piece: [],
    }, defaults);
    
    const filters = reactive({
        ...defaultFilters,
    });

    const filteredChords = computed(() => {
        return chords.filter(chord => {
            return filterDeg(chord, filters.deg)
                && filterFb(chord, filters.fb)
                && filterHint(chord, filters.hint)
                && filterSearch(chord, filters.search)
                && filterIgnorePedalPoints(chord, filters.pedalPoint)
                && filterBeatWeight(chord, filters.meterWeight)
                && filterPiece(chord, filters.piece)
                && filterNextDeg(chord, filters.nextDeg)
            ;
        });
    });

    function resetFilters() {
        Object.assign(filters, defaultFilters);
    }

    return {
        filteredChords,
        filters,
        resetFilters,
    };

}

function filterDeg(chord, deg) {
    if (deg === null || !deg.length) return true;
    return deg.includes(chord.deg);
}

function filterFb(chord, fb) {
    if (fb === null || !fb.length) return true;
    return fb.includes(chord.fb);
}

function filterHint(chord, hint) {
    if (hint === null || !hint.length) return true;
    return hint.includes(chord.hint);
}

function filterSearch(chord, str) {
    if (str === null || !str.length) return true;
    const searchStrings = str.split(',').map(s => s.trim());
    return searchStrings.some(searchStr => {
        const strParts = searchStr.split(' ').map(s => s.trim()).filter(s => s);
        const searchArr2 = strParts.map(part => part.replace('9', '2'));
        const searchArr9 = strParts.map(part => part.replace('2', '9'));
        return searchArr2.every(fb => chord.hint.split(' ').some((hintPart) => hintPart.includes(fb)))
            || searchArr9.every(fb => chord.hint.split(' ').some((hintPart) => hintPart.includes(fb)));
    });
}

function filterIgnorePedalPoints(chord, pedalPoint) {
    if (pedalPoint === null || pedalPoint === 'ignore') return true;
    return (pedalPoint === 'isolate' && chord.isPartOfPedal) || (pedalPoint === 'exclude' && !chord.isPartOfPedal);
}

function filterBeatWeight(chord, meterWeight) {
    if (meterWeight === null || !meterWeight.length) return true;
    return meterWeight.includes(chord.meterWeight);
}

function filterPiece(chord, piece) {
    if (piece === null || !piece.length) return true;
    return piece.includes(chord.id);
}

function filterNextDeg(chord, nextDeg) {
    if (nextDeg === null || !nextDeg.length) return true;
    return nextDeg.includes(chord.nextDeg);
};
