'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    browserify = require('browserify'),
    vinyl = require('vinyl-source-stream'),
    streamify = require('gulp-streamify');

var buildWithDependencies = function() {
        var bundle = browserify('./src/ActionDispatcher.js', {
            standalone: 'ActionDispatcher',
            insertGlobals: false,
            detectGlobals: false
        });

        bundle.bundle()
            .pipe(vinyl('action-dispatcher.js'))
            .pipe(gulp.dest('build'))
            .pipe(streamify(uglify()))
            .pipe(rename('action-dispatcher.min.js'))
            .pipe(gulp.dest('build'));
    },
    buildWithoutDependencies = function() {
        var bundle = browserify('./src/ActionDispatcher.js', {
            transform: ["browserify-shim"],
            standalone: 'ActionDispatcher',
            insertGlobals: false,
            detectGlobals: false
        });

        bundle.bundle()
            .pipe(vinyl('action-dispatcher-no-deps.js'))
            .pipe(gulp.dest('build'))
            .pipe(streamify(uglify()))
            .pipe(rename('action-dispatcher-no-deps.min.js'))
            .pipe(gulp.dest('build'));
    };

gulp.task('build', function() {
    buildWithDependencies();
    buildWithoutDependencies();
});
