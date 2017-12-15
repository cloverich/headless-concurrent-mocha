import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { Greeting } from './components/greeting';

interface Props { }

export class App extends React.Component<Props> {
  render() {
    return (
      <div className="App">
        <Greeting name="world" />
      </div>
    );
  }
}
