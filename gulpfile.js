const gulp = require('gulp');
const load = require('require-dir');
const config = require('./gulp/config');
var development, production;

load('./gulp/tasks', { recurse: true });

development = [
  'copy-third_party',
  'copy-images',
  'copy-javascripts',
  'compile-sass'
];

production = [
  'copy-third_party',
  'copy-images',
  'minify-javascripts',
  'compile-sass'
];

gulp.task('default', config.env.IS_DEVELOPMENT ? development : production , () => {

});