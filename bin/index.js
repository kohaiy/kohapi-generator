#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { yapiClientTsGenerate, yapiHapiGenerate } = require('../index');

const cmd = process.argv[2];

const log = (info) => {
    console.log('[kohapi-generator]', info);
}

if (!cmd) {
    log(`How to use the kohapi generator:
- [init]            generate the config file.
- [yapi-client-ts]  generate the client typescript files based on the yapi.
- [yapi-hapi-ts]    generate the hapi typescript files based on the yapi.`);
} else if (cmd === 'init') {
    const configPath = path.join(path.resolve(), 'kohapi.config.js');
    if (fs.existsSync(configPath)) {
        log(`File \`${configPath}\` already exists, please remove it and try again.`);
        return;
    }
    fs.copyFileSync(
        path.join(__dirname, '../src/templates/kohapi.config.js'),
        configPath,
    );
    log(`File \`${configPath}\` generated. Please update your config before use it.`);
} else if (cmd === 'yapi-client-ts') {
    yapiClientTsGenerate();
} else if (cmd === 'yapi-hapi-ts') {
    yapiHapiGenerate();
} else {
    log(`Command \`${cmd}\` not exists.`);
}