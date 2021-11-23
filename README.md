# Fancy Events

## WIP


## Example

```javascript
const EventEmitter = require('fancy-events').default;
// OR
import EventEmitter from 'fancy-events';


const em = new EventEmitter();

em.on('todo.*', (e, data) => {
    console.log(e, data);
})

//...

em.emit('todo.add', {test: 'data'});

```
