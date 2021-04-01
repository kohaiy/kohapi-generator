const pluralize = require('pluralize');
const { toCamelCase } = require('./utils');

function getOperationId(method, path) {
    const pathParams = path.match(/\{\w+\}/g);
    path = path.replace(/\{\w+\}/g, '');
    if (pathParams && pathParams.length) {
        path += '-by-' + pathParams.join('-and-')
    }
    return method.toLowerCase() + toCamelCase(path);
}

function transType(field) {
    let originType = field.type;
    if (originType === 'string' && field.mock) {
        if (field.mock.mock === '@datetime') {
            originType = 'date';
        }
    }
    const mapper = {
        integer: 'number',
        date: 'Date',
        file: 'File',
    };
    return mapper[originType] || originType;
}

class Interface {
    constructor(name, fields, desc = '') {
        this.name = name;
        this.fields = fields;
        this.desc = desc;
    }
    toString() {
        const fieldsText = this.fields.map(({ name, type, required, desc }) => {
            return `
    ${name}${required ? '' : '?'}: ${type};${desc ? `  // ${desc}` : ''}`;
        }).join('');
        return `${this.desc ? `// ${this.desc}
` : ''}export interface ${this.name} {${fieldsText ? `${fieldsText}\n` : ''}}`
    }
}

function transForm(form, name = '') {
    const data = {
        type: name,
        raw: form,
        interfaces: [],
    };
    // TODO
    if (form.length > 1) {
        // 创建 interface
        const interface = new Interface(
            name,
            form.map((field) => ({
                name: field.name,
                type: transType(field),
                required: field.required,
            })),
        );
        data.interfaces.push(interface);
    } else if (form.length) {
        // TODO 基本类型
        const [field] = form;
        data.name = field.name;
        data.type = transType(field);
        data.required = field.required;
    } else {
        data.isEmpty = true;
    }
    return data;
}

function formatForm(form) {
    const matchExample = (example) => (/^@\w/.test(example) ? example.match(/^@(\w+)/)[1] : 'string')
    return form.map(({ name, type, example, required, desc }) => ({
        name,
        type: (type && type !== 'text') ? type : matchExample(example),
        required: required ? Boolean(Number(required)) : false,
        desc,
    }));
}

function formatJson(json, name, interfaces) {
    if (json.type === 'object') {
        const fields = [];
        const { properties = {}, required = [] } = json;
        Object.keys(properties).forEach((fieldName) => {
            const orginField = properties[fieldName];
            const field = {
                name: fieldName,
                // TODO
                type: formatJson(orginField, `${name}${toCamelCase(fieldName)}`, interfaces),
                required: required.includes(fieldName),
                desc: orginField.desc || orginField.description,
            };
            fields.push(field);
        });
        const interface = new Interface(name, fields, json.desc || json.description);
        interfaces.push(interface);
        return name;
    } else if (json.type === 'array') {
        const itemType = formatJson(json.items, pluralize.singular(name), interfaces);
        return `${itemType}[]`;
    } else {
        return transType(json);
    }
}

function transJson(json, name = '') {
    const data = {
        type: name,
        raw: json,
        interfaces: [],
    };
    data.type = formatJson(json, name, data.interfaces);
    return data;
}

class YapiParse {
    constructor(info) {
        this.info = info;
        this.operationId = getOperationId(info.method, info.path);
        this.name = this.operationId[0].toUpperCase() + this.operationId.substr(1);
    }

    getInfo() {
        return this.info;
    }

    hasAuthorization() {
        if (this.info.req_headers &&
            this.info.req_headers.find(({ name, value }) => name === 'Authorization' && value === 'none')) {
            return false;
        }
        return true;
    }

    getReqParams() {
        const { req_params } = this.info;
        if (req_params && req_params.length) {
            return transForm(formatForm(req_params), this.name + 'Params');
        }
        return null;
    }

    getReqQuery() {
        const { req_query } = this.info;
        if (req_query && req_query.length) {
            return transForm(formatForm(req_query), this.name + 'Query');
        }
        return null;
    }

    getReqBody() {
        const { method, req_body_type, req_body_form, req_body_other } = this.info;
        if (req_body_type === 'form' || ['GET', 'DELETE'].includes(method)) {
            return transForm(formatForm(req_body_form), this.name + 'Body');
        }
        try {
            const json = JSON.parse(req_body_other);
            return transJson(json, this.name + 'Body');
        } catch (e) {
            console.log(e);
            console.log(this.info);
            return null;
        }
    }

    getResBody() {
        const { res_body_type, res_body } = this.info;
        if (res_body_type === 'json') {
            const json = JSON.parse(res_body);
            return transJson(json, this.name + 'Resp');
        }
    }
}

module.exports = YapiParse;
