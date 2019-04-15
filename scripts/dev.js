const fs = require('fs');
const path = require('path');
const express = require('express');

const rootPath = path.join(__dirname, '..');
const srcPath = path.join(rootPath, 'src');
const dataPath = path.join(rootPath, 'data');
const faviconPath = path.join(rootPath, 'favicon.ico');

const styleLinks = fs.readdirSync(path.join(srcPath, 'styles'))
	.map((file) => `<link rel="stylesheet" type="text/css" href="src/styles/${file}">`)
	.join('');

const entryPointScript = '<script type="module" src="src/index.js"></script>';

const indexHTML = fs.readFileSync(path.join(rootPath, 'index.html.tpl'), 'utf-8')
	.replace('%STYLES%', styleLinks)
	.replace('%SCRIPTS%', entryPointScript);

const app = express();

app.get('/', (request, response) => response.send(indexHTML));
app.use('/src', express.static(srcPath));
app.use(`/data`, express.static(dataPath));
app.use('/favicon.ico', express.static(faviconPath));

app.listen(8080, () => {
	console.log('Run dev server at localhost:8080');
});
