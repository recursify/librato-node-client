var gulp = require('gulp')
var ts = require('gulp-typescript')

gulp.task('default', ['typescript'])

gulp.task('typescript', function() {
  var tsProject = ts.createProject("./src/tsconfig.json")
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('./dist'))
})
