const gulp = require('gulp');
const del = require('del');
const config = require('../config');

gulp.task('clean-log', () => {
  return del('./**/*', {cwd: config.path.log});
});