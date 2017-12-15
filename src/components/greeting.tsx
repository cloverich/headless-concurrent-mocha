import * as ReactDOM from 'react-dom';
import * as React from 'react';

interface Props {
  name: string;
}

export class Greeting extends React.Component<Props> {
  render() {
    return (
      <div>
        <h1 className='Greeting' >Hello, {this.props.name}!</h1>
      </div>
    );
  }
}
