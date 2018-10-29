import React from 'react';
import App from '../src/components/App';
import renderer from 'react-test-renderer';
import { remote } from 'electron';

test('App initializes correctly', () => {
  const component = renderer.create(
    <App />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(tree.type).toBe('div');
  expect(tree.children.length).toBe(3);
  
  // Checking the fileList div
  let firstChild = tree.children[0];
  expect(firstChild.type).toBe('div');
  expect(firstChild.children.length).toBe(2);
  expect(firstChild.children[0].type).toBe('div');
  expect(firstChild.children[1].type).toBe('button');

  let secondChild = tree.children[1];
  expect(secondChild.type).toBe('div');
  expect(secondChild.children.length).toBe(2);
  expect(secondChild.children[0].type).toBe('div');
  expect(secondChild.children[1].type).toBe('div');

  let thirdChild = tree.children[2];
  expect(thirdChild.type).toBe('button');
  expect(thirdChild.children[0]).toBe('Start');

});

test('App functions', () => {
  const component = renderer.create(
    <App />
  );
  const instance = component.getInstance();
  
  // formatListForTextarea
  let list = ['a', 'b', 'c'];
  let joinedList = list.join('\n');
  let testList = instance.formatListForTextarea(list);
  expect(joinedList).toBe(testList);

  let event;

  // changeTolerance
  event = { target: { value: 0.1 } };
  instance.changeTolerance(event);
  expect(instance.state.tolerance).toBe(0.1);

  // changeMsLevel
  event = { target: { value: 2 } };
  instance.changeMsLevel(event);
  expect(instance.state.msLevel).toBe(2);

  // changeFoldChange
  event = { target: { value: 5 } };
  instance.changeFoldChange(event);
  expect(instance.state.foldChange).toBe(5);

  instance.selectOutputFolder();
  expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
  expect(doSomethingWithPath).toHaveBeenCalledWith('/some/output/path');
});