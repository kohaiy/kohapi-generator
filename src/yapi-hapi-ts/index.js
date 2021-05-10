const path = require('path');
const YapiApi = require('../common/yapi.api');
const YapiParse = require('../common/yapi-parse');
const FileGenerator = require('./file-generator');

let _config = null;
function getConfig(configPath) {
    if (_config) return _config;
    const allConfig = require(path.join(path.resolve(), configPath || 'kohapi.config.js'));
    _config = allConfig.yapi;
    _config.filter = _config.filter || (() => true);
    _config.output = allConfig.output;
    return _config;
}


async function getApiParse(api, yapiApi) {
    const info = await yapiApi.getApiDetail(api._id);
    return new YapiParse(info);
}

async function generateCat(cat, yapiApi, fileGenerator) {
    const filter = getConfig().filter;
    let { list } = await yapiApi.getApisByCat(cat._id);
    list = list.filter((api) => filter({ name: cat.name, _id: cat._id }, api));
    const apiParses = await Promise.all(
        list.map(api => getApiParse(api, yapiApi)),
    );
    if (list.length) {
        fileGenerator.generateCat(cat, apiParses);
    }
}

async function generate({ configPath } = {}) {
    const yapiApi = new YapiApi(getConfig(configPath));
    const cats = await yapiApi.getCatMenu();
    const fileGenerator = new FileGenerator({
        output: getConfig().output,
    });
    fileGenerator.init();
    // fileGenerator.generateCats(cats);
    cats.forEach(cat => generateCat(cat, yapiApi, fileGenerator));
    // fileGenerator.copyApiClient();
}

module.exports = generate;