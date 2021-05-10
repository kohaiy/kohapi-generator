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

function transJoiType(type, field) {
    let required = '';
    if (field) {
        if (field.required) {
            required = '.required()';
        } else {
            required = '.allow(null)';
            if (type === 'string') {
                required += '.allow(\'\')';
            }
        }
    }
    if (['string', 'number', 'boolean', 'date', 'Date'].includes(type)) {
        return `Joi.${type.toLowerCase()}()${required}`;
    }
    if (/\[]$/.test(type)) {
        const subtype = type.replace('[]', '');
        return `Joi.array().items(${transJoiType(subtype)})`;
    }
    return `${type}Vo`;
}

function transJoi(raw) {
    if (raw.type === 'object') {

    }
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
        const modulePath = sysPath.join(this.apisPath, moduleName, 'apis');
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
            console.log(`[*] ${info.method} \t${info.path}  \t${info.title}`);
            const hasAuthorization = apiParse.hasAuthorization();
            const reqParams = apiParse.getReqParams();
            const reqQuery = apiParse.getReqQuery();
            const reqBody = apiParse.getReqBody();
            const resBody = apiParse.getResBody();
            let interfaces = '';
            if (reqParams && reqParams.interfaces.length) {
                interfaces += '\n' + reqParams.interfaces.join('\n');
            }
            if (reqQuery && reqQuery.interfaces.length) {
                interfaces += '\n' + reqQuery.interfaces.join('\n');
            }
            if (reqBody && reqBody.interfaces.length) {
                interfaces += '\n' + reqBody.interfaces.join('\n');
            }
            if (resBody && resBody.interfaces.length) {
                interfaces += '\n' + resBody.interfaces.join('\n');
            }
            let vos = '';
            const paramsTpl = [];
            if (reqParams && !reqParams.isEmpty) {
                paramsTpl.push(`
            params: Joi.object({${reqParams.raw.map(it => `
                ${it.name}: ${transJoiType(it.type, it)}`).join(',')}
            })`);
            }
            if (reqQuery && !reqQuery.isEmpty) {
                paramsTpl.push(`query: Joi.object({${reqQuery.raw.map(it => `
                ${it.name}: ${transJoiType(it.type, it)}`).join(',')}
            })`);
            }
            if (reqBody && !reqBody.isEmpty) {
                if (reqBody.interfaces.length) {
                    paramsTpl.push(`
            payload: ${transJoiType(reqBody.type)}`);
                    reqBody.interfaces.forEach(it => {
                        vos += `
const ${it.name}Vo = Joi.object({${it.fields.map(f => `
    ${f.name}: ${transJoiType(f.type, f)}`).join(',')}
});`;
                    })
                } else {
                    paramsTpl.push(`
            payload: ${transJoiType(reqBody.type)}`);
                }

            }
            if (resBody && resBody.interfaces.length) {
                resBody.interfaces.forEach(it => {
                    vos += `
const ${it.name}Vo = Joi.object({${it.fields.map(f => `
    ${f.name}: ${transJoiType(f.type, f)}`).join(',')}
});`;
                })
            }
            const apiContent = `/**
 * title     : ${info.title}
 * path      : ${info.path}
 * created at: ${new Date(info.add_time * 1000).toLocaleString()}
 * updated at: ${new Date(info.up_time * 1000).toLocaleString()}
 */
import * as Joi from 'joi';
import { defineRoute } from '@/helpers/route';
import optional from './optional';
// interfaces${interfaces}
// Joi Vos${vos}
export default defineRoute({
    method: '${info.method}',
    path: '${info.path}',
    options: {${hasAuthorization ? '' : `
        auth: false,`}
        tags: ['api', '${moduleName}'],
        validate: {${paramsTpl.join(`,`)}
        },
        response: {
            status: {
                200: ${transJoiType(resBody.type)},
            }
        }
    },
    ...optional,
});
`;

            const optionalContent = `/**
 * title     : ${info.title}
 * path      : ${info.path}
 * created at: ${new Date(info.add_time * 1000).toLocaleString()}
 * updated at: ${new Date(info.up_time * 1000).toLocaleString()}
 */
import { defineOptionalRoute } from '@/helpers/route';

export default defineOptionalRoute({
    handler: (req) => {
        // TODO Enter your code here ...
    },
});
`;
            mkDir(sysPath.join(modulePath, filename));
            fs.writeFileSync(sysPath.join(modulePath, `${filename}/default.ts`), apiContent, { encoding: 'utf-8' });

            const optionalFilePath = sysPath.join(modulePath, `${filename}/optional.ts`);

            const generateOptionalFile = () => {
                if (fs.existsSync(optionalFilePath)) {
                    const { mtimeMs, birthtimeMs } = fs.statSync(optionalFilePath);
                    if (Math.round((mtimeMs - birthtimeMs) / 1000) > 0) {
                        console.warn('    -- optional.ts 已编辑，不更新');
                        return;
                    }
                    fs.unlinkSync(optionalFilePath);
                }
                fs.writeFileSync(optionalFilePath, optionalContent, { encoding: 'utf-8' });
            };
            generateOptionalFile();

        });
        //         const moduleContent = `/**
        //  * module name: ${cat.name}
        //  * description: ${cat.desc}
        //  */${operations.map(({ filename, operationId }) => `
        // export { default as ${operationId} } from './${filename}';`).join('')}
        // `;
        //         fs.writeFileSync(sysPath.join(modulePath, 'index.ts'), moduleContent, { encoding: 'utf-8' });
    }
}

module.exports = FileGenerator;
