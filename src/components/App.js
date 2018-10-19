import '../assets/css/App.css';
import React, { Component } from 'react';
const {dialog} = require('electron').remote;

let presets = require('../assets/presets.json');

console.log(presets);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.selectFiles = this.selectFiles.bind(this);
  }

  selectFiles() {
    console.log("Selecting files");
    dialog.showOpenDialog({ 
      properties: [ 
        'openFile',
        'multiSelections' 
      ],
      filters: [
        { name: 'mzML', extensions: ['mzML'] }
      ]
    }, function(filenames) {
      console.log(filenames);
    });
  }

  render() {
    return (
      <div>
        <textarea rows="15" cols="15"></textarea>
        <textarea rows="5" cols="15"></textarea>
        <input type="text" />
        <input type="text" />
        <button onClick={this.selectFiles}>Submit</button>
      </div>
    );
  }
}

export default App;
