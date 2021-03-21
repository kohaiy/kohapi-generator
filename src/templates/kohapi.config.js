const path = require('path');

module.exports = {
    type: 'yapi',
    yapi: {
        baseUrl: '<Your Yapi Base URL>',
        token: '<Your Yapi Token>',
    },
    output: path.join(__dirname, 'dist'),
};
