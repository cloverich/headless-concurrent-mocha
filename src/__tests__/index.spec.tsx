import 'mocha';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'chai';
import { App } from '../index'

describe('A basic test', function () {
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

  it('works', function () {
    const intro = document.getElementById('hiworld');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  })

  describe('Pretend its a complicated test', function () {
    it('is indented?', function () {
      const intro = document.getElementById('hiworld');
      expect(intro).to.exist;
      expect(intro!.textContent).to.contain('Hello, world');
    })

    it('is still indented?', function () {
      const intro = document.getElementById('hiworld');
      expect(intro).to.exist;
      expect(intro!.textContent).to.contain('Hello, world');
    })
  })


  it('is no longer indented? Actually, is not run in the expected order', function () {
    const intro = document.getElementById('hiworld');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  })
})
