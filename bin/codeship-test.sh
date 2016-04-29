#!/bin/bash

echo "Testing branch: ${CI_BRANCH}"

if [ ${PIPE_NUM} == "1" ]; then
    # Run local tests
    npm install -g npm@latest
    npm install bower web-component-tester -g
    echo "Bower Install"
    bower install

    echo "Starting local WCT tests"
    wct
fi