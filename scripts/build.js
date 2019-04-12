const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const ClosureCompiler = require('google-closure-compiler').compiler;

const rootPath = path.join(__dirname, '..');
const srcPath = path.join(rootPath, 'src');
const distPath = path.join(rootPath, 'dist');

const closureCompiler = new ClosureCompiler({
	js: path.join(srcPath, '**.js'),
	js_output_file: path.join(distPath, 'app.js'),
	entry_point: path.join(srcPath, 'index.js'),
	language_in: 'ECMASCRIPT_2018',
	language_out: 'ECMASCRIPT_2015',
	warning_level: 'VERBOSE',
	module_resolution: 'BROWSER',
	compilation_level: 'ADVANCED',
	use_types_for_optimization: true
});

closureCompiler.run((exitCode, stdOut, stdError) => {
	if (stdError) {
		console.log(stdError);
	}

	if (exitCode) {
		console.log('Compilation failed!');
	} else {
		console.log('Compilation done!');
	}
});

const postcssProcessor = postcss([autoprefixer, cssnano({preset: 'default'})]);

const styles = fs.readdirSync(path.join(srcPath, 'styles'))
	.map((file) => fs.readFileSync(path.join(srcPath, 'styles', file), 'utf-8'));

Promise.all(styles.map((style) => postcssProcessor.process(style, {from: undefined})))
	.then((results) => {
		const bundledStyles = results.map((result) => result.css).join('');

		fs.writeFileSync(path.join(distPath, 'styles.css'), bundledStyles, 'utf-8');

		console.log('Styles processing done!');
	})
	.catch(() => {
		console.log('Styles processing failed!');
	});

const indexHTML = fs.readFileSync(path.join(rootPath, 'index.html.tpl'), 'utf-8')
	.replace('%STYLES%', '<link rel="stylesheet" type="text/css" href="styles.css">')
	.replace('%SCRIPTS%', '<script src="app.js"></script>')
	.replace(/\n\s*/g, '');

fs.writeFileSync(path.join(distPath, 'index.html'), indexHTML, 'utf-8');
fsExtra.copySync(path.join(rootPath, 'data'), path.join(distPath, 'data'));
