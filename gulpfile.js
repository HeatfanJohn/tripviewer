const gulp = require('gulp');

const plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});

gulp.task('develop', () => {
  plugins.nodemon({ script: 'bin/www', ext: 'pug js', ignore: ['public/javascripts/**'] })
    .on('restart', () => {
      console.log('restarted!');
    });
});
