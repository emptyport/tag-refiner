import React from 'react';
import App from '../src/components/App';
import renderer from 'react-test-renderer';

test('App initializes correctly', () => {
  const component = renderer.create(
    <App />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(tree.type).toBe('div');
  console.log(tree);
});