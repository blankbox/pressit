var gulp = require('gulp');
var watch = require('gulp-watch');
var sass = require('gulp-sass');

gulp.task('sass', function () {
    // Endless stream mode
    return watch('dev/scss/**/*.scss', { ignoreInitial: false })
        .pipe(gulp.dest('build'))
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: ['node_modules/susy/sass']
        }).on('error', sass.logError))
        .pipe(gulp.dest('dist/css'));
});


var watchSass = watch('dev/scss/**/*.scss', { ignoreInitial: false })
    .pipe(gulp.dest('build'))
    .pipe(sass({
        outputStyle: 'expanded',
        includePaths: ['node_modules/susy/sass']
    }).on('error', sass.logError))
    .pipe(gulp.dest('dist/css'));


gulp.task('default', ['sass'], function() {

  console.log('default is running');

});

//gulp.run(['default']);
