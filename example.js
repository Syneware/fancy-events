const EventEmitter = require('./dist').default;


const em = new EventEmitter();

em.on('todo.*', (e, data) => {
    console.log(e, data);
})

//...

em.emit('todo.add', {test: 'data'});
