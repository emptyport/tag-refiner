import '../assets/css/App.css';
import React, { Component } from 'react';
const {dialog} = require('electron').remote;
import FileList from './FileList';

let presets = require('../assets/presets.json');
console.log("Loaded presets");
console.log(presets);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fileList: [],
      reporters: [],
      controls: [],
      msLevel: 3,
      tolerance: 0.002,
      foldChange: 2,
      outputPath: ''
    };

    this.selectFiles = this.selectFiles.bind(this);
    this.selectOutputFolder = this.selectOutputFolder.bind(this);
    this.selectPreset = this.selectPreset.bind(this);
  }

  selectPreset(event) {
    let key = event.target.value;
    console.log(`Preset key selected: ${key}`);
    this.setState(function() {
      let reporters, controls;
      if(key==='none') {
        reporters = '';
        controls = '';
      }
      else {
        reporters = presets[key].reporters.join('\n');
        controls = presets[key].reporters[0];
      }

      return {
        reporters: reporters,
        controls: controls
      };
    });
  }

  selectOutputFolder() {
    dialog.showOpenDialog({
      properties: [
        'openDirectory'
      ]
    },
    function(folder) {
      console.log(`Output path set to ${folder}`);
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
      console.log("Selected files:");
      console.log(filenames);
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

        <div id="param-selection">

          <div id="preset-div">
            Select a preset:
            <select id="presets" onChange={this.selectPreset}>
              {presetList}
            </select>
          </div>

          <div id="reporter-div">
            <div>Reporter ions:</div>
            <textarea rows="15" cols="15" defaultValue={this.state.reporters}></textarea>
          </div>

          <div id="control-div">
            <div>Control channels:</div>
            <textarea rows="5" cols="15" defaultValue={this.state.controls}></textarea>
          </div>

          <div id="simple-params-div">
            <div className="param-item">
              <div>Tolerance (Da):</div>
              <input id="tolerance" type="text" />
            </div>

            <div className="param-item">
              <div>MS Level with reporters</div>
              <input id="msLevel" type="number" min="2" max="3"/>
            </div>

            <div className="param-item">
              <div>Fold change:</div>
              <input id="foldChange" type="text" />
            </div>

            <div className="param-item">
              <div>Output folder:</div>
              <div>{this.state.outputPath}</div>
              <button onClick={this.selectOutputFolder}>Output path</button>
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export default App;
