import * as ReactDOM from 'react-dom';
import * as React from 'react';

interface Props { }

export class App extends React.Component<Props> {
  render() {
    return (
      <div>
        <h1 id='hiworld' >Hello, world!</h1>
      </div>
    );
  }
}
