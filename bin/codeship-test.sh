#!/bin/bash

echo "Testing branch: ${CI_BRANCH}"

if [ ${PIPE_NUM} == "1" ]; then
    # Run local tests
    #npm install bower web-component-tester -g
    echo "Starting local WCT tests - just a fake for now"
    #bower install
    #wct
fi