#!/usr/bin / env node

var fs = require("fs");
var convert = require("./convert");
var help = fs.readFileSync('./readme.md', 'utf8');

if (process.argv.indexOf('--help') > -1 || process.argv.length < 3) {
    console.log(help);
    process.exit();
}

var inputFileName = process.argv[2];
var outputFileName = getUserNameFromRawFileName(inputFileName) + 'stat.json';
var outputMetaFileName = getUserNameFromRawFileName(inputFileName) + 'meta.json';
var jsonRaw = JSON.parse(fs.readFileSync(inputFileName, 'utf8'));

var stats = convert.convert(jsonRaw);

fs.writeFileSync(outputFileName, JSON.stringify(stats));
fs.writeFileSync(outputMetaFileName, JSON.stringify(jsonRaw.parsingMetaData));


function getUserNameFromRawFileName(fileName) {
    return fileName.substr(0, fileName.length - 10 - 3);
}