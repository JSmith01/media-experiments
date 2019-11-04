import React, { PureComponent } from 'react';

interface CounterProps {
    initial?: number;
};

interface CounterState {
    counter: number;
};

class Counter extends PureComponent<CounterProps, CounterState> {
    constructor(props: CounterProps) {
        super(props);
        this.state = {
            counter: props.initial || 0,
        }
    }
    
    inc = () => {
        this.setState(({ counter }) => ({ counter: counter + 1 }));
    }
    
    dec = () => {
        this.setState(({ counter }) => ({ counter: counter - 1 }));
    }
    
    render() {
        return <div>
        <button onClick={this.inc}>Inc</button>
        {this.state.counter}
        <button onClick={this.dec}>Dec</button>
        </div>
    }
}

export default Counter;
