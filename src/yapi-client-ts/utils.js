// 转成 大驼峰
module.exports.toCamelCase = function toCamelCase(name) {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[^a-z0-9]+/ig, '-')
        .toLowerCase()
        .split('-')
        .map(i => i ? i[0].toUpperCase() + i.substr(1) : '')
        .join('');
};

// 转成 中划线 -
module.exports.toSnakeCase = function toSnakeCase(name) {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[^a-z0-9]+/ig, '-')
        .toLowerCase()
        .split(/-+/)
        .join('-');
};
