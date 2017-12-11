import 'mocha';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'chai';
import { Component2 } from '../component2'

describe('A basic test', function () {
  let node: HTMLDivElement;

  before('setup', function () {
    node = document.createElement('div');
    document.body.appendChild(node);
    ReactDOM.render(<Component2 />, node)
  })

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
  })

  it('works', function () {
    const intro = document.getElementById('hiworld');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  })
})
