const gulp = require('gulp');
const del = require('del');
const uglify = require('gulp-uglify');
const config = require('../config');

gulp.task('minify-javascripts.clean', () => {
  return del('./javascripts/**/*', { cwd: config.path.output });
});

gulp.task('minify-javascripts', ['minify-javascripts.clean'], () => {
  return gulp.src('./javascripts/**/*.js', { cwd: config.path.input })
    .pipe(uglify(config.uglify))
    .pipe(gulp.dest('./javascripts', { cwd: config.path.output }));
});