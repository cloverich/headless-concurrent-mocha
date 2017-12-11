import * as ReactDOM from 'react-dom';
import * as React from 'react';

interface Props { }

export class Component2 extends React.Component<Props> {
  render() {
    return (
      <div>
        <h1 id='hiworld' >Hello, Component2!</h1>
      </div>
    );
  }
}
