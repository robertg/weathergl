// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

function bar(x): number {
  return x.length;
}
console.log(bar('Hello, world!'));

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
