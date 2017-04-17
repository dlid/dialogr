var gulp = require('gulp'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify'),
  jshint = require('gulp-jshint'),
  replace = require('gulp-replace')
  inject = require('gulp-inject-string'),
  indent = require("gulp-indent"),
  fs = require('fs'),
  package = JSON.parse(fs.readFileSync('./package.json')),
  webPage = package.homepage ? package.homepage : "";


 var to_inject = function()
    {
    	var headerComment = "/*! " + package.name 
      + " v" + package.version + " © 2017 " + package.author 
      + ". " + webPage
   		+ " License: "+package.license 
  		+ " */\n";
      return [headerComment + '(function(win) {\n', "win.dialogr = Dialogr();\n}(window));\n"];
    }

// JSHint for separate files
gulp.task('hint', function() {
	 return gulp.src([
          'source/variables',
          'build/_deferred_temp.js',
      		'source/utilityFunctions.js',
      		'source/EventingManager.js',
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
	 .pipe(replace(/\(window\);/, '(self);'))
	 //.pipe(replace(/obj == null/g, 'obj === null'))
 
	 .pipe(gulp.dest('build'))
});

function rip(r) {

}


// Concatenate JS Files
gulp.task('scripts', function() {
    return gulp.src([
          'source/Variables.js', 
          'build/_deferred_temp.js',
          'source/UtilityFunctions.js',
          'source/DOMFunctions.js',
          //d'source/Draggable.js',
          'source/EventingManager.js',
          'source/DialogSizeFunctions.js',
          'source/DialogrDialog.js',
          'source/DialogContext.js',
          'source/Dialogr.js'
      		])
      .pipe(concat('dialogr.js'))
    	.pipe(inject.wrap(to_inject()[0], to_inject()[1]))

    	.pipe(jshint())
    	.pipe(jshint.reporter('default'))
      .pipe(indent({
          tabs:false,
          amount:2
      }))
      .pipe(gulp.dest('build'))

      
      // Shorten some strings for a smaller minified file
      // Replace some long internal messages to something shorter
      .pipe(replace("'dialogr.set-text'", "'$a'"))
      .pipe(replace("'dialogr.block'", "'$b'"))
      .pipe(replace("'dialogr.close'", "'$c'"))
      .pipe(replace("'dialogr.reject'", "'$e'"))
      .pipe(replace("'dialogr.find-father'", "'$f'"))
      .pipe(replace("'dialogr.set-html'", "'$g'"))
      .pipe(replace("'dialogr.disable-button'", "'$h'"))
      .pipe(replace("'dialogr.enable-button'", "'$i'"))
      .pipe(replace("'dialogr.resolve'", "'$j'"))
      .pipe(replace("'dialogr.i-am-your-father'", "'$k'"))
      .pipe(replace("'dialogr.buttons'", "'$l'"))
      .pipe(replace("'dialogr.unblock'", "'$m'"))
      .pipe(replace("'dialogr.open'", "'$n'"))
      .pipe(replace("'dialogr.find-opener'", "'$o'"))

      // Replace some long variable names with shorter values
      .pipe(replace("dialogElementOverlay_r", 'o'))
      .pipe(replace("dialogElementLoaderOverlay_r", 'p'))


      .pipe(rename({suffix: '.min'}))
      .pipe(uglify({
        preserveComments : 'license',
				  beautify: true,
				  comments: true,
				  sourceMap: false,
				  mangle: true
				}))
      //.pipe(inject.wrap(to_inject_min()[0], to_inject()[1]))
      .pipe(gulp.dest('build'));
});

 // Default Task
gulp.task('default', ['hint','update-deferred-js','scripts']);