'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    browserify = require('browserify'),
    vinyl = require('vinyl-source-stream'),
    streamify = require('gulp-streamify');

gulp.task('build', function() {
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
});
