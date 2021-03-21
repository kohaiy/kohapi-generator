const path = require('path');
const YapiApi = require('./yapi.api');
const YapiParse = require('./yapi-parse');
const FileGenerator = require('./file-generator');

let _config = null;
function getConfig() {
    if (_config) return _config;
    const allConfig = require(path.join(path.resolve(), 'kohapi.config.js'));
    _config = allConfig.yapi;
    _config.output = allConfig.output;
    return _config;
}

async function getApiParse(api, yapiApi) {
    const info = await yapiApi.getApiDetail(api._id);
    return new YapiParse(info);
    // console.log('operationId ->', yapiParse.operationId);
    // console.log('getReqParams ->', yapiParse.getReqParams());
    // console.log('getReqQuery ->', yapiParse.getReqQuery());
    // console.log('getReqBody ->', yapiParse.getReqBody());
    // console.log('getResBody ->', yapiParse.getResBody());
}

async function generateCat(cat, yapiApi, fileGenerator) {
    const { list } = await yapiApi.getApisByCat(cat._id);
    const apiParses = await Promise.all(
        list.map(api => getApiParse(api, yapiApi)),
    );
    fileGenerator.generateCat(cat, apiParses);
}

async function generate() {
    const yapiApi = new YapiApi(getConfig());
    const cats = await yapiApi.getCatMenu();
    const fileGenerator = new FileGenerator({
        output: getConfig().output,
    });
    fileGenerator.init();
    // fileGenerator.generateCats(cats);
    cats.forEach(cat => generateCat(cat, yapiApi, fileGenerator));
    fileGenerator.copyApiClient();
    // const info = await yapiApi.getApiDetail(19);

    // console.log(info);
    // const yapiParse = new YapiParse(info);
    // console.log('operationId ->', yapiParse.operationId);
    // console.log('getReqParams ->', yapiParse.getReqParams());
    // console.log('getReqQuery ->', yapiParse.getReqQuery());
    // console.log('getReqBody ->', yapiParse.getReqBody());
    // console.log('getResBody ->', yapiParse.getResBody());
    // console.log(getConfig());
}

module.exports = generate;
