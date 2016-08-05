var gulp = require('gulp'),
		concat = require('gulp-concat'),
		rename = require('gulp-rename'),
		uglify = require('gulp-uglify'),
		include_file = require('gulp-include'),
		jshint = require('gulp-jshint'),
		replace = require('gulp-replace')
    	inject = require('gulp-inject-string'),
    	fs = require('fs'),
    	package = JSON.parse(fs.readFileSync('./package.json')),
    	webPage = package.homepage ? package.homepage : "";


 var to_inject = function()
    {
    	var headerComment = "/*global window, document */\n" +
		"/**\n" +
		" * " + package.name + " v" + package.version + "\n"+
		" * © 2016 " + package.author + ". " + webPage +"\n" +
 		"* License: "+package.license+"\n" +
		" */\n\n";

        return [headerComment + '(function(win) {\n', "win.dialogr = Dialogr(); }(window));\n"];
    },
    to_inject_min = function()
    {
    	var headerComment = "/*! " + package.name + " v" + package.version + " © 2016 " + package.author + " ("+package.license+" license, "+webPage+")*/\n";

        return [headerComment, ""];
    }

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
    	.pipe(inject.wrap(to_inject()[0], to_inject()[1]))
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
      .pipe(inject.wrap(to_inject_min()[0], to_inject()[1]))
      .pipe(gulp.dest('build'));
});

 // Default Task
gulp.task('default', ['hint','update-deferred-js','scripts']);