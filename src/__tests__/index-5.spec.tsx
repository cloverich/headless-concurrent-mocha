import 'mocha';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'chai';
import { App } from '../index'

describe('Index suite 5', function () {
  let node: HTMLDivElement;

  function repeatTest(node: HTMLDivElement) {
    ReactDOM.render(<App />, node)
    const intro = node.querySelector('.App');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  }

  before('setup', function () {
    node = document.createElement('div');
    document.body.appendChild(node);
  })

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
  })

  it('renders', function () {
    repeatTest(node);
  })

  it('renders', function () {
    repeatTest(node);
  })

  describe('Pretend its a complicated test', function () {
    it('renders', function () {
      repeatTest(node);
    })

    it('renders', function () {
      repeatTest(node);
    })
  })
})
