import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFiles } from './utils.mjs'; 

const __dirname = dirname(fileURLToPath(import.meta.url));

function getIdFromFilePath(path) {
    return path.split(/[\\\/]/).pop().split('.')[0];
}

const filesPath = `${__dirname}/../hensel-chorlieder/kern`;

const files = getFiles(filesPath);

files.forEach(file => {
    const id = getIdFromFilePath(file);
    console.log(id);

    const output = execSync(`cat ${file} | extractxx -i **kern | beat -ca | degx --force-key C# | extractxx -i **deg`).toString().trim();
    console.log(output);
});
