const fs = require('fs');
const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/LumiPayRegistry.sol/LumiPayRegistry.json', 'utf8'));
let content = fs.readFileSync('./src/lib/constants.ts', 'utf8');
const start = content.indexOf('export const REGISTRY_ABI = [');
const end = content.indexOf('] as const;', start) + 11;
const newAbiStr = `export const REGISTRY_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;`;
content = content.substring(0, start) + newAbiStr + content.substring(end);
fs.writeFileSync('./src/lib/constants.ts', content, 'utf8');
console.log('ABI updated!');
