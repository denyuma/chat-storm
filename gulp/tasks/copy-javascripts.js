const gulp = require('gulp');
const del = require('del');
const config = require('../config');

gulp.task('copy-javascripts.clean', () => {
  return del('./javascripts/**/*', { cwd: config.path.output });
});

gulp.task('copy-javascripts', ['copy-javascripts.clean'], () => {
  gulp.src('./javascripts/**/*', { cwd: config.path.input })
    .pipe(gulp.dest('./javascripts', { cwd: config.path.output }));
});