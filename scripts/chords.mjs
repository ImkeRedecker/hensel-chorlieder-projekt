import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pathToKernScores = `${__dirname}/../hensel-chorlieder/kern/`;
const dataFile = `${__dirname}/../content/chords.yaml`;
const pedalPointData = `${__dirname}/../content/orgelpunkte.yaml`;

function getIdFromFilename(path) {
    return path.split(/[\\\/]/).pop().replace(/\..+$/, '');
}

function getFiles(directory, fileList) {
    fileList = fileList || [];
    let files = fs.readdirSync(directory);
    files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
    for (let i in files) {
        const name = `${directory}/${files[i]}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, fileList);
        } else {
            fileList.push(name);
        }
    }
    return fileList;
}

const result = [];


function getBeatWeight(tsig, beat, ) {
    if (!tsig) return 'error';
    if (beat === '.') return '.'
    if (tsig === '2/4') {
        switch (beat) {
            case '1': return 'strong';
            case '1+1/2': return 'weak';
            case '2': return 'half-strong';
            case '2+1/2': return 'weak';
        }
    } else if (tsig === '3/4') {
        switch (beat) {
            case '1': return 'strong';
            case '2': return 'weak';
            case '3': return 'weak';
        }
    } else if (tsig === '4/4') {
        switch (beat) {
            case '1': return 'strong';
            case '2': return 'weak';
            case '3': return 'half-strong';
            case '4': return 'weak';
        }
    } else if (tsig === '2/2') {
        switch (beat) {
            case '1': return 'strong';
            case '1+1/2': return 'weak';
            case '2': return 'half-strong';
            case '2+1/2': return 'weak';
        }
    } else if (tsig === '3/8') {
        switch (beat) {
            case '1': return 'strong';
            case '2': return 'weak';
            case '3': return 'weak';
        }
    } else if (tsig === '6/8') {
        switch (beat) {
            case '1': return 'strong';
            case '1+1/3': return 'weak';
            case '1+2/3': return 'weak';
            case '2': return 'half-strong';
            case '2+1/3': return 'weak';
            case '2+2/3': return 'weak';
        }
    } else if (tsig === '9/8') {
        switch (beat) {
            case '1': return 'strong';
            case '1+1/3': return 'weak';
            case '1+2/3': return 'weak';
            case '2': return 'half-strong';
            case '2+1/3': return 'weak';
            case '2+2/3': return 'weak';
            case '3': return 'half-strong';
            case '3+1/3': return 'weak';
            case '3+2/3': return 'weak';
        }
    }
    return 'none';
}

getFiles(pathToKernScores).forEach(file => {

    const id = getIdFromFilename(file);
    console.log(id);
    const stdout = execSync(`cat ${file} | lnnr -p | beat -cp | fb -cnl | fb -cnlr | fb -cnl --hint | degx --resolve-null -t | composite | meter -tLr | shed -s 2 -e "s/beat/beat-composite/X" | shed -s 3 -e "s/tsig/tsig-composite/X" | extractxx -I '**kern' | extractxx -I '**text' | extractxx -I '**dynam' | extractxx -I '**kern-comp' | extractxx -I '**cdata-beat' | extractxx -I '**cdata-tsig' | ridx -LGTMId`).toString().trim();

    const voiceExchangeDeg = {};
    const fbstdout = execSync(`cat ${file} | lnnr -p | fb -mic | extractxx -I '**kern' | extractxx -I '**text' | extractxx -I '**dynam' | ridx -LGTMId | sed '/~/!d'`).toString().trim();
    if (fbstdout.includes('~')) {
        fbstdout.split('\n').forEach(line => {
            const tokens = line.split('\t');
            voiceExchangeDeg[tokens[0]] = tokens.findIndex(part => part.startsWith('~'));
        });
    }
    const lines = stdout.trim().split('\n');

    const indexMap = {
        meterBeat: 0,
        meterTsig: 1,
        beat: 2,
        lineNumber: 3,
        fb: 4,
        fbReduced: 5,
        hint: 6,
        degBass: 7,
        // degTenor: 8,
        // degAlto: 9,
        // degSoprano: 10,
    };

    let {[id]: pedalPoints } = yaml.load(fs.readFileSync(pedalPointData, 'utf8'));

    lines.forEach(line => {
        const tokens = line.split('\t');
        let beat = tokens[indexMap.beat];
        const fb = tokens[indexMap.fb];
        const fbReduced = tokens[indexMap.fbReduced];
        const hint = tokens[indexMap.hint];
        const meterBeat = tokens[indexMap.meterBeat].replace('r', '');
        const meterTsig = tokens[indexMap.meterTsig];
        let deg = null;
        let lineNumber = tokens[indexMap.lineNumber];
        
        beat = parseFloat(beat);
        lineNumber = parseInt(lineNumber, 10);

        let degSpineIndex = 0;
        const degTokenList = [
            tokens[indexMap.degBass],
            // tokens[indexMap.degTenor],
            // tokens[indexMap.degAlto],
            // tokens[indexMap.degSoprano],
        ];
        while ((deg === 'r' ||  deg === null) && degSpineIndex < degTokenList.length) {
            deg = degTokenList[degSpineIndex].split(' ')[0].replace('_', '');
            degSpineIndex++;
        }

        const isPartOfPedal = !!pedalPoints?.filter((startBeat, endBeat) => beat >= startBeat && beat <= endBeat).length;
        const meterWeight = getBeatWeight(meterTsig, meterBeat);

        if (fb === '.'/*|| meterBeat === '.'*/) {
            return;
        }

        // let voiceExchange = false;
        // if (voiceExchangeDeg[lineNumber]) {
        //     deg = degTokenList[voiceExchangeDeg[lineNumber] - 1].split(' ')[0].replace('_', '');
        //     voiceExchange = true;
        // }

        result.push({
            beat,
            fb,
            hint,
            deg,
            lineNumber,
            id,
            isPartOfPedal,
            meterWeight,
            nextDeg: null,
            fbReduced,
            // voiceExchange,
        });
    });
 
});

for (let i = 0; i < result.length; i++) {
    const item = result[i];
    let ni = i + 1;
    while (result[ni] && result[ni].id === item.id && result[ni] && result[ni].fbReduced === item.fbReduced && result[ni].deg === item.deg) {
        ni++;
    }
    if (result[ni] && result[ni]?.id === item.id) {
        item.nextDeg = result[ni].deg ?? null;
    }
}

result.forEach(elem => delete elem.fbReduced);

fs.writeFileSync(dataFile, yaml.dump({chords: result}, {
    indent: 4,
    lineWidth: -1,
    sortKeys: true,
    flowLevel: 2,
}));
