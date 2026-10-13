const gulp = require('gulp')
const gulpCleanCss = require('gulp-clean-css')
const gulpSass = require('gulp-sass')(require('sass'))
const gulpSourcemaps = require('gulp-sourcemaps')
const gulpZip = require('gulp-zip')
const { version } = require('./manifest.json')

gulp.task('sassCompilation', () => {
    return gulp
        .src('./src/styles/main.scss')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass())
        .pipe(gulpCleanCss())
        .pipe(gulpSourcemaps.write('.'))
        .pipe(gulp.dest('./src/styles/'))
})

gulp.task('sassCompilationWatch', () => {
    gulp.watch('./src/styles/**/*.scss', gulp.parallel('sassCompilation'))
})

gulp.task('zip', () => {
    return gulp
        .src(
            [
                './popup.html',
                './manifest.json',

                './src/fonts/**/*',
                './src/images/**/*',
                './src/scripts/*.js',
                './src/styles/main.css',
            ],
            { base: '.', encoding: false }
        )
        .pipe(gulpZip(`autoplay-block-extension-v${version}.zip`))
        .pipe(gulp.dest('./releases/'))
})

gulp.task('release', gulp.series('sassCompilation', 'zip'))