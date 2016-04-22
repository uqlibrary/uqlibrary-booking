/*
 Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

"use strict";

// Include Gulp & tools we"ll use
var gulp = require("gulp");
var browsersync = require("browser-sync");

// Watch files for changes & reload
gulp.task("serve", [], function() {
  console.log("serving...");
  browsersync({
    open: "external",
    startPath: "/uqlibrary-booking/demo/index-live.html",
    host: "dev-app.library.uq.edu.au",
    port: 5000,
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    server: {
      baseDir: ["../"]
    },
    files: [
      "elements/*.html",
      "elements/*.js"
    ]
  });
});

// Build production files, the default task
gulp.task("default", ["serve"], function(cb) {
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require("web-component-tester").gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try {
  require("require-dir")("tasks");
} catch (err) {
  // Do nothing
}