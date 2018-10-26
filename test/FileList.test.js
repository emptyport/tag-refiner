import React from 'react';
import FileList from '../src/components/FileList';
import renderer from 'react-test-renderer';

test('FileList initializes correctly', () => {
  const component = renderer.create(
    <FileList files={[]} />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(tree.type).toBe('div');
  expect(tree.children.length).toBe(1);
  expect(tree.children[0].type).toBe('ul');
});

test('FileList displays files', () => {
  let mzMLFile = 'dummy/path/file.mzML';
  let fileStatus = 'Pending';
  let fileList = [
    {
      id: 0,
      progress: 0,
      file: mzMLFile,
      status: fileStatus
    }
  ];
  const component = renderer.create(
    <FileList files={fileList} />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(tree.type).toBe('div');
  expect(tree.children.length).toBe(1);
  expect(tree.children[0].type).toBe('ul');

  let child = tree.children[0];
  expect(child.children.length).toBe(1);

  let fileItem = child.children[0];
  expect(fileItem.type).toBe('li');
  expect(fileItem.children[0].type).toBe('div');
  expect(fileItem.children[1].type).toBe('svg');
  expect(fileItem.children[2].type).toBe('div');

  let filename = fileItem.children[0].children[0];
  expect(filename).toBe(mzMLFile);

  let status = fileItem.children[2].children[0];
  expect(status).toBe(fileStatus);
});