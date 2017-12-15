import 'mocha';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'chai';
import { Greeting } from '../greeting'

describe('A basic test', function () {
  let node: HTMLDivElement;

  before('setup', function () {
    node = document.createElement('div');
    document.body.appendChild(node);
  })

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
  })

  it('renders', function () {
    ReactDOM.render(<Greeting name="world" />, node)
    const intro = document.querySelector('.Greeting');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  })
})
