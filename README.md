# Fancy Events

A small and fast event emitter for node.js and browser with wildcards and regular expressions

## Installing

`npm install fancy-events`

## EventEmitter

### Options

- **mode**?: 'wildcard' | 'regex' | 'simple' = 'wildcard'
- **includeStack**?: boolean = false
- **delimiter**?: string = '.'

### Methods

- **addListener**: (event: string, cb: Function, options?: { once?: boolean; }) => void;
- **on**: (event: string, cb: Function) => void;
- **once**: (event: string, cb: Function) => void;
- **removeListener**: (event: string, listener: Function) => void;
- **off**: (event: string, listener: Function) => void;
- **removeAllListeners**: (event: string) => void;
- **eventNames**: () => string[];
- **listenerCount**: (event: string) => number;
- **listeners**: (event: string) => Listener[];
- **emit**: (event: string, ...params: any) => void;

## Example

```javascript
import EventEmitter from 'fancy-events';


const em = new EventEmitter();

em.on('todo.*', (e, data) => {
    console.log(e, data);
});

//...

em.emit('todo.add', {test: 'data'});

```
