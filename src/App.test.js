import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Uses https://facebook.github.io/jest/
// - flowtype disabled.

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});
