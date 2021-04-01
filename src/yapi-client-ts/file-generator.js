const fs = require('fs');
const sysPath = require('path');
const {
    toSnakeCase,
    toCamelCase
} = require('../common/utils');

function mkDir(path) {
    if (fs.existsSync(path)) {
        return;
    }
    const { dir } = sysPath.parse(path);
    mkDir(dir);
    fs.mkdirSync(path);
}

class FileGenerator {
    constructor({ output }) {
        this.outputPath = output;
        this.apisPath = sysPath.join(output, 'modules');
    }

    init() {
        mkDir(this.outputPath);
        mkDir(this.apisPath);
    }

    // 生成 分类
    generateCats(cats = []) {
        cats.forEach(({ name, desc }) => {
            name = toSnakeCase(name);
            const modulePath = sysPath.join(this.apisPath, name);
            mkDir(modulePath);
        });
    }

    generateCat(cat, apiParses) {
        const moduleName = toSnakeCase(cat.name);
        const modulePath = sysPath.join(this.apisPath, moduleName);
        mkDir(modulePath);
        const operations = [];
        apiParses.forEach((apiParse) => {
            const operationId = apiParse.operationId;
            const filename = toSnakeCase(operationId)
            operations.push({
                filename,
                operationId,
            });
            const info = apiParse.getInfo();
            console.log(`[*] ${info.method} ${info.path}  \t${info.title}`);
            const reqParams = apiParse.getReqParams();
            const reqQuery = apiParse.getReqQuery();
            const reqBody = apiParse.getReqBody();
            const resBody = apiParse.getResBody();
            let interfaces = '';
            if (reqParams && reqParams.interfaces.length) {
                interfaces += reqParams.interfaces.join('\n') + '\n';
            }
            if (reqQuery && reqQuery.interfaces.length) {
                interfaces += reqQuery.interfaces.join('\n') + '\n';
            }
            if (reqBody && reqBody.interfaces.length) {
                interfaces += reqBody.interfaces.join('\n') + '\n';
            }
            if (resBody && resBody.interfaces.length) {
                interfaces += resBody.interfaces.join('\n') + '\n';
            }
            const paramsTpl = [];
            const reqBodyTpl = [];
            if (reqParams && !reqParams.isEmpty) {
                const paramsName = reqParams.name || 'params';
                paramsTpl.push(`${paramsName}${reqParams.required ? '' : '?'}: ${reqParams.type}`);
                reqBodyTpl.push(reqParams.name ? `params: { ${paramsName} }` : 'params');
            }
            if (reqQuery && !reqQuery.isEmpty) {
                const paramsName = reqQuery.name || 'query';
                paramsTpl.push(`${paramsName}${reqQuery.required ? '' : '?'}: ${reqQuery.type}`);
                reqBodyTpl.push(reqQuery.name ? `query: { ${paramsName} }` : 'query');
            }
            if (reqBody && !reqBody.isEmpty) {
                paramsTpl.push(`body: ${reqBody.type}`);
                reqBodyTpl.push('body');
            }
            const apiContent = `/**
 * title     : ${info.title}
 * path      : ${info.path}
 * created at: ${new Date(info.add_time * 1000).toLocaleString()}
 * updated at: ${new Date(info.up_time * 1000).toLocaleString()}
 */
import ApiClient from '../../api-client';
${interfaces}
export default function (${paramsTpl.join(', ')}) {
    return ApiClient.http${toCamelCase(info.method)}<${resBody.type}>('${info.path}', { ${reqBodyTpl.join(', ')} });
};`;
            fs.writeFileSync(sysPath.join(modulePath, `${filename}.ts`), apiContent, { encoding: 'utf-8' });
        });
        const moduleContent = `/**
 * module name: ${cat.name}
 * description: ${cat.desc}
 */${operations.map(({ filename, operationId }) => `
export { default as ${operationId} } from './${filename}';`).join('')}
`;
        fs.writeFileSync(sysPath.join(modulePath, 'index.ts'), moduleContent, { encoding: 'utf-8' });
    }

    copyApiClient() {
        fs.copyFileSync(
            sysPath.join(__dirname, '../templates/api-client.ts'),
            sysPath.join(this.outputPath, 'api-client.ts'),
        );
    }
}

module.exports = FileGenerator;
