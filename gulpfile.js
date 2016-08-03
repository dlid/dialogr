var gulp = require('gulp'),
		concat = require('gulp-concat'),
		rename = require('gulp-rename'),
		uglify = require('gulp-uglify'),
		include_file = require('gulp-include'),
		jshint = require('gulp-jshint'),
		replace = require('gulp-replace');

// JSHint for separate files
gulp.task('hint', function() {
	 return gulp.src([
      		'source/_utilityFunctions.js',
      		'source/_eventingManager.js',
      		'source/main.js',
		])
	 .pipe(jshint())
	 .pipe(jshint.reporter('default'))
});

// Copy deferred.js and replace the (global) with (this),
// so we can use it internally in the dialog
gulp.task('update-deferred-js', function() {
	 return gulp.src([
      		'node_modules/deferred-js/js/deferred.js',
		])
	 .pipe(concat('_deferred_temp.js'))
	 .pipe(replace(/\(window\);/, '(this);'))
	 //.pipe(replace(/obj == null/g, 'obj === null'))
 
	 .pipe(gulp.dest('build'))
});



// Concatenate JS Files
gulp.task('scripts', function() {
    return gulp.src([
      		'source/main.js'
      		])
    	.pipe(include_file())
    	.pipe(jshint())
    	.pipe(jshint.reporter('default'))
      .pipe(concat('dialogr.js'))
      .pipe(gulp.dest('build'))

      .pipe(rename({suffix: '.min'}))
      .pipe(uglify({
				  beautify: true,
				  comments: true,
				  sourceMap: false,
				  mangle: true
				}))
      .pipe(gulp.dest('build'));
});

 // Default Task
gulp.task('default', ['hint','update-deferred-js','scripts']);