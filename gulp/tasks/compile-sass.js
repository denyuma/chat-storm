const gulp = require('gulp');
const del = require('del');
const sass = require('gulp-sass');
const config = require('../config');

gulp.task('compile-sass.clean', () => {
  return del('./stylesheets/**/*', { cwd: config.path.output });
});

gulp.task('compile-sass', ['compile-sass.clean'], () => {
  return gulp.src('./stylesheets/**/*.scss', { cwd: config.path.input })
    .pipe(sass(config.sass))
    .pipe(gulp.dest('./stylesheets', { cwd: config.path.output }));
});