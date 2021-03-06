var path = require('path');

var ret = {
    'suites': ['test'],
    'webserver': {
        'pathMappings': []
    },
    plugins: {
        sauce: {
            browsers: [
                'Windows 10/microsoftedge@13',
                'Windows 10/chrome@54',
                'Windows 10/firefox@50',
                'OS X 10.11/safari@9.0',
                'OS X 10.11/firefox@50',
                'OS X 10.11/chrome@54',
                'OS X 10.11/iphone@9.2',
                'OS X 10.11/ipad@9.2',
                'Linux/android@5.1'
            ]
        }
    }
};

var mapping = {};
var rootPath = (__dirname).split(path.sep).slice(-1)[0];

mapping['bower_components'] = 'bower_components';

ret.webserver.pathMappings.push(mapping);

module.exports = ret;