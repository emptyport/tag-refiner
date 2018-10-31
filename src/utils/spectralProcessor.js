let { spectralGenerator } = require('./mzmlGenerator.js');
var base64 = require('base64-js');
var pako = require('pako');
let fs = require('fs');

function  decodeData(raw, bitType, isCompressed) {
  let buffer = base64.toByteArray(raw);
  if (isCompressed) {
    buffer = pako.inflate(buffer);
  }

  if (bitType === '32') {
    return new Float32Array(buffer.buffer);
  }
  else if (bitType === '64') {
    return new Float64Array(buffer.buffer);
  }
  else {
    return [];
  }
}

function getMSLevel(cvParam) {
  for(let i=0; i<cvParam.length; i++) {
    let item = cvParam[i];
    if(item._attributes.name === 'ms level') {
      let msLevel = parseInt(item._attributes.value);
      return msLevel;
    }
  }
  return -1;
}

// https://stackoverflow.com/questions/8584902/get-closest-number-out-of-array
function closestIdx(num, arr) {
  var mid;
  var lo = 0;
  var hi = arr.length - 1;
  while (hi - lo > 1) {
      mid = Math.floor ((lo + hi) / 2);
      if (arr[mid] < num) {
          lo = mid;
      } else {
          hi = mid;
      }
  }
  if (num - arr[lo] <= arr[hi] - num) {
      return lo;
  }
  return hi;
}

function extractSpectrum(spectrum) {
  let intensities, mz;
  let binaryDataArray = spectrum.binaryDataArrayList.binaryDataArray;
  for(let i=0; i<binaryDataArray.length; i++) {
    let rawData = binaryDataArray[i].binary._text;
    let cvParam = binaryDataArray[i].cvParam;
    let bitType = '';
    let isCompressed = false;
    let type = '';
    for(let j=0; j<cvParam.length; j++) {
      let name = cvParam[j]._attributes.name;
      switch(name) {
        case '64-bit float':
          bitType = '64';
          break;
        case '32-bit float':
          bitType = '32';
          break;
        case 'zlib compression':
          isCompressed = true;
          break;
        case 'm/z array':
          type = 'mz';
          break;
        case 'intensity array':
          type = 'intensity'
          break;
        default:
          break;
      }

      if(type==='intensity') {
        intensities = decodeData(rawData, bitType, isCompressed);
      }
      if(type==='mz') {
        mz = decodeData(rawData, bitType, isCompressed);
      }
    }
  }

  return { intensities, mz };
}

function getSignificantSpectra(msTwo, msThree, options) {
  let significantSpectra = [];

  let spectraWithReporters;
  switch(options.msLevel) {
    case 2:
      spectraWithReporters = msTwo;
      break;
    case 3:
      spectraWithReporters = msThree;
      break;
    default:
      return significantSpectra;
  }

  for (let key in spectraWithReporters) {
    if (spectraWithReporters.hasOwnProperty(key)) {
      let currentSpectrum = spectraWithReporters[key];
      let reporterIntensities = {};
      for(let i=0; i<options.reporters.length; i++) {
        let reporter = options.reporters[i];
        let reporterIndex = -1;
        let { intensities, mz } = extractSpectrum(currentSpectrum);
        reporterIndex = closestIdx(reporter, mz);
        let repMz = mz[reporterIndex];
        let repInt = intensities[reporterIndex];
        if(Math.abs(repMz - reporter) < options.tolerance) {
          reporterIntensities[reporter] = repInt;
        }
        else {
          reporterIntensities[reporter] = 0;
        }
      }
      
      let controlIntensity = 0;

      let missingControl = false;

      for(let i=0; i<options.controls.length; i++) {
        if(reporterIntensities[options.controls[i]] === 0) { missingControl = true; }
        controlIntensity += reporterIntensities[options.controls[i]];
      }

      if(missingControl) { continue; }

      controlIntensity /= options.controls.length;
      let isSignificant = false;

      for (let reporterKey in reporterIntensities) {
        if(reporterIntensities.hasOwnProperty(reporterKey)) {
          if(options.controls.includes(reporterKey)) { continue; }
          else {
            let treatIntensity = reporterIntensities[reporterKey];
            if(treatIntensity>controlIntensity*options.foldChange || treatIntensity<controlIntensity/options.foldChange) {
              isSignificant = true;
            }
          }
        }
      }

      if(isSignificant) {
        if(options.msLevel===2) {
          significantSpectra.push(currentSpectrum);
        }
        if(options.msLevel===3) {
          let precursorID = currentSpectrum.precursorList.precursor._attributes.spectrumRef;
          if(msTwo.hasOwnProperty(precursorID)) {
            significantSpectra.push(msTwo[precursorID]);
          }
        }
      }
    }
  }

  return significantSpectra;
}

function writeSignificantSpectra(wstream, significantSpectra, options) {
  let writtenIDs = [];

  for(let i=0; i<significantSpectra.length; i++) {
    let currentSpectrum = significantSpectra[i];

    let retentionTime = 0;
    for(let j=0; j<currentSpectrum.scanList.scan.cvParam.length; j++) {
      if(currentSpectrum.scanList.scan.cvParam[j]._attributes.name === 'scan start time') {
        retentionTime = currentSpectrum.scanList.scan.cvParam[j]._attributes.value;
        if(currentSpectrum.scanList.scan.cvParam[j]._attributes.unitName === 'minute') {
          retentionTime *= 60;
        }
      }
    }

    let charge = 0;
    let precursorMass = 0;
    let precursorIntensity = 0;
    let params = currentSpectrum.precursorList.precursor.selectedIonList.selectedIon.cvParam;
    for(let j=0; j<params.length; j++) {
      if(params[j]._attributes.name === 'charge state') {
        charge = params[j]._attributes.value;
      }
      if(params[j]._attributes.name === 'selected ion m/z') {
        precursorMass = params[j]._attributes.value;
      }
      if(params[j]._attributes.name === 'peak intensity') {
        precursorIntensity = parseFloat(params[j]._attributes.value);
      }
    }
    
    let spectrumID = currentSpectrum._attributes.id;

    if(!writtenIDs.includes(spectrumID)) {
      wstream.write('BEGIN IONS\n');
      wstream.write('TITLE=');
      wstream.write(spectrumID+'\n');
      wstream.write('RTINSECONDS=');
      wstream.write(retentionTime+'\n');
      wstream.write('PEPMASS=');
      wstream.write(precursorMass+' '+precursorIntensity+'\n');
      wstream.write('CHARGE=');
      wstream.write(charge+'+\n');
  
      let { intensities, mz } = extractSpectrum(currentSpectrum);
      for(let j=0; j<mz.length; j++) {
        wstream.write(mz[j] + '\t' + intensities[j] + '\n');
      }
  
      wstream.write('END IONS\n\n');
      let canContinue = wstream.write('');
      console.log(canContinue);
      /*while(!canContinue) {
        console.log(canContinue);
        sleep(100);
        canContinue = wstream.write('');
      }*/
      console.log("caught up");
      writtenIDs.push(spectrumID);
    }
  }
  return true;
}

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}

function* spectralProcessor(filename, options, fileIndex) {

  let specGen = spectralGenerator(filename);

  let plainFilename = filename.replace(/^.*[\\\/]/, '');
  let basename = plainFilename.substr(0, plainFilename.lastIndexOf('.'));
  let newFilename = options.outputPath + '/' + basename + '_'+options.foldChange + 'foldChange.mgf';
  console.log(`Output file: ${newFilename}`);
  let wstream = fs.createWriteStream(newFilename);

  let msTwo = {};
  let msThree = {};

  let oldProgress = 0;
  let result = specGen.next();
  while(!result.done) {
    
    let progress = Math.floor(100*result.value.progress);
    if(progress - oldProgress > 0) {
      yield({index: fileIndex, progress: progress, message: 'Processing'});
      oldProgress = progress;
    }
    let spectrum = result.value.data.spectrum;
    let msLevel = getMSLevel(spectrum.cvParam);
    switch(msLevel) {
      case 1:
        let significantSpectra = getSignificantSpectra(msTwo, msThree, options);
        let wroteSpectra = writeSignificantSpectra(wstream, significantSpectra, options);
        msTwo = {};
        msThree = {};
        break;
      case 2:
        msTwo[spectrum._attributes.id] = spectrum;
        break;
      case 3:
        msThree[spectrum._attributes.id] = spectrum;
        break;
      default:
        break;
    }
    result = specGen.next();
  }

  wstream.end();
  return({index: fileIndex, progress: 100, message: 'Done!'});
}

module.exports.spectralProcessor = spectralProcessor;