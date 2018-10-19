import React, { Component } from 'react';
import { Line } from 'rc-progress';

class FileList extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      messageTrace: '',
      processingList: []
    };

    

  }

  render() {
    
    let fileList = this.props.files.map(function(entry) {
      return (
        <li className="file-entry" key={entry.id}>
          <div className="file-name">
            {entry.file}
          </div>
          <Line className="file-progress" percent={entry.progress} />
          <div className="file-status">
            {entry.status}
          </div>
        </li>
      );
    });

    return (
      <div>
        <ul>
          {fileList}
        </ul>
      </div>
    );
  }
}

export default FileList;
