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
                'OSX 10.11/safari@9.0',
                'Windows 10/microsoftedge@13',
                'Windows 10/chrome@54',
                'Windows 10/firefox@50'
            ]
        }
    }
};

var mapping = {};
var rootPath = (__dirname).split(path.sep).slice(-1)[0];

mapping['bower_components'] = 'bower_components';

ret.webserver.pathMappings.push(mapping);

module.exports = ret;