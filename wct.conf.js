var path = require('path');

var ret = {
    'suites': ['test'],
    'webserver': {
        'pathMappings': []
    },
    plugins: {
        local: {
            browsers: [
                'firefox',
                'chrome',
                'safari'
            ]
        },
        sauce: {
            browsers: [
                'safari',
                'firefox',
                'chrome'
            ]
        }
    }
};

var mapping = {};
var rootPath = (__dirname).split(path.sep).slice(-1)[0];

mapping['bower_components'] = 'bower_components';

ret.webserver.pathMappings.push(mapping);

module.exports = ret;