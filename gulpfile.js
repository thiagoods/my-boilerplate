/*Required Packages*/
var gulp = require('gulp'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	csslint = require('gulp-csslint'),
	cssnano = require('gulp-cssnano'),
	del = require('del'),
	frontMatter = require('front-matter'),
	fs = require('fs'),
	gJade = require('gulp-jade'),
	imagemin = require('gulp-imagemin'),
	jade = require('jade'),
	jshint = require('gulp-jshint'),
	jsreporter = require('jshint-stylish'),
	map = require('vinyl-map'),
	marked = require('marked'),
	pngquant = require('imagemin-pngquant'),
	rename = require('gulp-rename'),
	replace = require('gulp-replace'),
	sass = require('gulp-sass'),
	uglify = require('gulp-uglify');

/*Configuration Files*/
var csslintConfig = require('./.csslintrc.json'),
	cssNanoConfig = {autoprefixer: {browsers: ['last 2 version', 'ie 10', 'ios 7', 'android 4']}, discardUnused: false, minifyFontValues: false}
	jshintConfig = require('./.jshintrc.json'),
	stylestatsConfig = require('./.stylestats.json'),
	version = Date.now();

/*Tasks*/
	gulp.task('clean', function(cb) {
		return del('dist', cb);
	});

	gulp.task('posts', function() {
		var postTemplate = fs.readFileSync('src/templates/post.jade');
		var jadeTemplate = jade.compile(postTemplate, { basedir: 'src', pretty: true });
		var renderPost = map(function(code, filename) {
			var parsed = frontMatter(String(code));
			var data = parsed.attributes;
			var body = parsed.body;
			body = marked.parse(body);
			data.content = body;
			data.filename = filename;
			return jadeTemplate(data);
		});

		return gulp.src('src/pages/blog/*.md')
			.pipe(renderPost)
			.pipe(rename({extname: '.html'}))
			.pipe(gulp.dest('dist/blog'))
			.pipe(browserSync.stream());
	});

	gulp.task('html', function(){
		return gulp.src(['src/pages/**/index.jade', 'src/pages/404.jade'])
			.pipe(gJade({ basedir: 'src', pretty: true }))
			.pipe(replace('{{version}}', version))
			.pipe(gulp.dest('dist'))
			.pipe(browserSync.stream());
	});

	gulp.task('css', function(){
		return gulp.src('src/css/site.scss')
			.pipe(sass())
			.pipe(replace('{{version}}', version))
			.pipe(gulp.dest('dist/css'))
			.pipe(cssnano(cssNanoConfig))
			.pipe(rename({ suffix: '.min' }))
			.pipe(csslint(csslintConfig))
			.pipe(csslint.reporter())
			.pipe(gulp.dest('dist/css'))
			.pipe(browserSync.stream());
	});

	gulp.task('js', function(){
		return gulp.src(require('./src/js/modules.js'))
			.pipe(jshint(jshintConfig))
			.pipe(jshint.reporter(jsreporter))
			.pipe(concat('site.js'))
			.pipe(gulp.dest('dist/js'))
			.pipe(uglify())
			.pipe(rename({ suffix: '.min' }))
			.pipe(gulp.dest('dist/js'))
			.pipe(browserSync.stream());
	});

	gulp.task('static', function() {
		return gulp.src(['src/static/**/*', '!src/static/assets/imgmin/'])
			.pipe(gulp.dest('dist'))
			.pipe(browserSync.stream());
	});

	gulp.task('imagemin', function() {
		return gulp.src('src/static/assets/imgmin/**/*.+(gif|jpg|png)')
			.pipe(imagemin({ optimizationLevel: 7, progressive: true, use: [pngquant()] }))
			.pipe(gulp.dest('src/static/assets/img'))
	});

	gulp.task('browsersync', function() {
		browserSync({
			ghostMode: {
				clicks: true,
				forms: true,
				location: true,
				scroll: true
			},
			server: {
				baseDir: 'dist'
			},
			watchTask: true
		});
	});

	gulp.task('default', ['clean'], function() {
		gulp.start('html', 'posts', 'css', 'js', 'static');
	});

	gulp.task('dev', ['html', 'css', 'js', 'static'], function(){
		gulp.start('browsersync');
		gulp.watch('src/+(data|includes|mixins|pages|templates)/**/*.jade', ['html', browserSync.reload])
		gulp.watch('src/pages/blog/*.md', ['posts'])
		gulp.watch('src/css/*.scss', ['css'])
		gulp.watch('src/js/*.js', ['js'])
		gulp.watch('src/static/**/*', ['static'])
	});
