let fs = require('fs');
let readChunk = require('read-chunk');
let xmlConvert = require('xml-js');

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats["size"];
  return fileSizeInBytes;
}

function getChunk(filename, start, length) {
  return readChunk.sync(filename, start, length).toString();
}

function getIndex(filename) {
  let fileSize = getFilesizeInBytes(filename);
  let readLength = 1024

  let chunk = getChunk(filename, fileSize-readLength, readLength);
  let startIndex = chunk.indexOf('<indexList ');
  while(startIndex===-1) {
    readLength += 1024*1024;
    chunk = getChunk(filename, fileSize-readLength, readLength);
    startIndex = chunk.indexOf('<indexList ');
  }
  let indexStart = chunk.indexOf('<index name="spectrum">');
  let indexEnd = chunk.indexOf('</index>')+8;
  
  let index = chunk.substring(indexStart, indexEnd);
  let parsedIndex = JSON.parse(xmlConvert.xml2json(index, {compact: true, spaces: 2}));
  let indexList = parsedIndex['index']['offset'].map((entry) => {
    return {
      id: entry._attributes.idRef,
      offset: parseInt(entry._text)
    };
  });
  indexList.push({
    id: 'eof',
    offset: fileSize
  });
  
  return indexList;
}

function* spectralGenerator(filename) {
  let index = getIndex(filename);
  for(let i=0; i<index.length-1; i++) {
    let chunk = getChunk(filename, index[i].offset, index[i+1].offset-index[i].offset);
    let startIndex = chunk.indexOf('<spectrum ');
    let endIndex = chunk.indexOf('</spectrum>')+11;
    let rawSpectrum = chunk.substring(startIndex, endIndex);
    let parsedSpectrum = xmlConvert.xml2json(rawSpectrum, {compact: true, spaces: 2});

    yield { data: JSON.parse(parsedSpectrum), progress: i/(index.length-1) };
  }

  return { data: true, progress: 1 };
}

module.exports.spectralGenerator = spectralGenerator;