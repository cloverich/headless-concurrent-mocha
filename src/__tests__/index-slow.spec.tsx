import 'mocha';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'chai';
import { App } from '../index'

describe('Index 1 slow', function () {
  let node: HTMLDivElement;

  before('setup', function () {
    node = document.createElement('div');
    document.body.appendChild(node);
    ReactDOM.render(<App />, node)
  })

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
  })

  it('takes 2 seconds to run', function (done) {
    this.timeout(4000);
    const intro = document.querySelector('.App');
    expect(intro).to.exist;

    setTimeout(() => {
      expect(intro!.textContent).to.contain('Hello, world');
      done();
    }, 2000);
  })
})
