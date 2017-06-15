var gulp = require('gulp')
var ts = require('gulp-typescript')
var jasmine = require('gulp-jasmine')
var SpecReporter  = require('jasmine-spec-reporter')

gulp.task('default', ['typescript', 'copy-types'])

gulp.task('copy-types', function () {
  gulp.src('./src/types.d.ts')
    .pipe(gulp.dest('./dist'));
});


gulp.task('typescript', function() {
  var tsProject = ts.createProject("./src/tsconfig.json")
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('./dist'))
})

gulp.task('test', ['typescript'], function() {
  var tsProject = ts.createProject("./spec/tsconfig.json")
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('./compiledTests'))
    .pipe(jasmine({
      reporter: new SpecReporter({
          displayStacktrace: 'all',
          verbose: true,
          displaySpecDuration: true
        }),
      verbose: true
    }))
})
