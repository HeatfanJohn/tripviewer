const gulp = require('gulp');

const plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});

gulp.task('develop', () => {
  plugins.nodemon({ script: 'bin/www', ext: 'pug js', ignore: ['public/javascripts/**'] })
    .on('restart', () => {
      console.log('restarted!');
    })
    .on('crash', () => {
      console.log('Applicaiton has crashed! Will restart in 10 seconds\n');
      stream.emit('restart',10); // Restart the server in 10 seconds
    });
});
