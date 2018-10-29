import '../assets/css/App.css';
import React, { Component } from 'react';
const {dialog} = require('electron').remote;
import FileList from './FileList';
let { spectralProcessor } = require('../utils/spectralProcessor');
const WebSocket = require('ws');
const {spawn} = require('child_process');

let presets = require('../assets/presets.json');
//console.log("Loaded presets");
//console.log(presets);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileList: [],
      msLevel: 3,
      tolerance: 0.002,
      foldChange: 2,
      outputPath: ''
    };

    this.processFiles = this.processFiles.bind(this);
    this.selectFiles = this.selectFiles.bind(this);
    this.selectOutputFolder = this.selectOutputFolder.bind(this);
    this.selectPreset = this.selectPreset.bind(this);
    this.formatListForTextarea = this.formatListForTextarea.bind(this);
    this.changeTolerance = this.changeTolerance.bind(this);
    this.changeMsLevel = this.changeMsLevel.bind(this);
    this.changeFoldChange = this.changeFoldChange.bind(this);
    this.handleMissingParameter = this.handleMissingParameter.bind(this);
  }

  formatListForTextarea(list) {
    return list.join('\n');
  }

  changeTolerance(event) {
    let tolerance = parseFloat(event.target.value);
    this.setState(function() {
      return {
        tolerance: tolerance
      };
    });
  }

  changeMsLevel(event) {
    let msLevel = parseInt(event.target.value);
    this.setState(function() {
      return {
        msLevel: msLevel
      };
    });
  }

  changeFoldChange(event) {
    let foldChange = parseFloat(event.target.value);
    this.setState(function() {
      return {
        foldChange: foldChange
      };
    });
  }

  handleMissingParameter(message) {
    dialog.showErrorBox("Missing parameter", message);
  }


  processFiles() {
    let rawReporters = document.getElementById("reporter-textarea").value.split("\n");
    let reporters = rawReporters.map(item => parseFloat(item));
    let rawControls = document.getElementById("control-textarea").value.split("\n");
    let controls = rawControls.map(item => parseFloat(item));

    let options = {
      reporters: reporters,
      controls: controls,
      tolerance: this.state.tolerance,
      msLevel: this.state.msLevel,
      foldChange: this.state.foldChange,
      outputPath: this.state.outputPath
    };

    if(rawReporters[0] === "") {
      this.handleMissingParameter("Please input reporter ions");
      return;
    }

    if(rawControls[0] === "") {
      this.handleMissingParameter("Please input at least one control ion");
      return;
    }

    if(isNaN(options.tolerance)) {
      this.handleMissingParameter("Please input a tolerance");
      return;
    }

    if(isNaN(options.msLevel)) {
      this.handleMissingParameter("Please input an MS level");
      return;
    }

    if(isNaN(options.foldChange)) {
      this.handleMissingParameter("Please input a fold change");
      return;
    }

    if(options.outputPath === "") {
      this.handleMissingParameter("Please select an output path");
      return;
    }

    if(this.state.fileList.length === 0) {
      this.handleMissingParameter("Please select at least one input file");
      return;
    }

    let args = {
      options: options,
      fileList: this.state.fileList
    }

    let stringArgs = JSON.stringify(args);

    //console.log(stringArgs);

    const socket = new WebSocket("ws://localhost:3000");
    let fileList = this.state.fileList;
    let that = this;

    socket.onopen = function() {
      socket.send(stringArgs);
    }

    socket.onmessage = function(event) {
      let data = JSON.parse(event.data);
      fileList[data.index].progress = data.progress;
      fileList[data.index].status = data.status;
      that.setState({
        fileList: fileList
      });
    }

    

  }

  selectPreset(event) {
    let key = event.target.value;
    //console.log(`Preset key selected: ${key}`);

    let reporters, controls;
    if(key==='none') {
      reporters = [];
      controls = [];
    }
    else {
      reporters = presets[key].reporters;
      controls = [presets[key].reporters[0]];
    }

    document.getElementById("reporter-textarea").value = this.formatListForTextarea(reporters);
    document.getElementById("control-textarea").value = this.formatListForTextarea(controls);

  }

  selectOutputFolder() {
    dialog.showOpenDialog({
      properties: [
        'openDirectory'
      ]
    },
    function(folder) {
      //console.log(`Output path set to ${folder}`);
      this.setState(function() {
        return {
          outputPath: folder
        };
      });
    }.bind(this));
  }

  selectFiles() {
    dialog.showOpenDialog({ 
      properties: [ 
        'openFile',
        'multiSelections' 
      ],
      filters: [
        { name: 'mzML', extensions: ['mzML'] }
      ]
    }, 
    function(filenames) {
      //console.log("Selected files:");
      //console.log(filenames);
      let fileList = filenames.map((file, index) => {
        return {
          id: index,
          file: file,
          progress: 0,
          status: "Pending"
        }
      });
      this.setState(function() {
        return{
          fileList: fileList
        }
      });
    }.bind(this));
  }

  render() {
    let presetSelect = [
      {
        name: '---',
        id: 'none'
      }
    ];
    for(let preset in presets) {
      if(presets.hasOwnProperty(preset)) {
        presetSelect.push({
          name: presets[preset].name,
          id: preset
        });
      }
    }

    let presetList = presetSelect.map((preset, index) => {
      return (
        <option key={index} value={preset.id}>{preset.name}</option>
      );
    });


    return (
      <div>

        <div id="file-selection">

          <div className="container">
            <FileList files={this.state.fileList} />
          </div>
          <button onClick={this.selectFiles}>Select files</button>

        </div>

        <div id="param-selection" className="">
          <div id="mass-params-div">
            <div id="preset-div">
              Select a preset: <br />
              <select id="presets" onChange={this.selectPreset}>
                {presetList}
              </select>
            </div>

            <div id="reporter-div">
              <div>Reporter ions:</div>
              <textarea id="reporter-textarea" rows="15" cols="15" defaultValue=''></textarea>
            </div>

            <div id="control-div">
              <div>Control channels:</div>
              <textarea id="control-textarea" rows="5" cols="15" defaultValue=''></textarea>
            </div>
          </div>

          <div id="simple-params-div">
            <div className="param-item">
              <div>Tolerance (Da):</div>
              <input id="tolerance" type="text" value={this.state.tolerance} onChange={this.changeTolerance}/>
            </div>

            <div className="param-item">
              <div>MS Level with reporters</div>
              <input id="msLevel" type="number" min="2" max="3" value={this.state.msLevel} onChange={this.changeMsLevel}/>
            </div>

            <div className="param-item">
              <div>Fold change:</div>
              <input id="foldChange" type="text" value={this.state.foldChange} onChange={this.changeFoldChange}/>
            </div>

            <div className="param-item">
              <div>Output folder:</div>
              <div>{this.state.outputPath}</div>
              <button onClick={this.selectOutputFolder}>Output path</button>
            </div>
          </div>

        </div>

        <button id="start-button" onClick={this.processFiles}>Start</button>
      </div>
    );
  }
}

export default App;
