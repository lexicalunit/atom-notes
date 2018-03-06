let ipc = require('node-ipc')

ipc.config.id = 'hello'
ipc.config.retry = 1500

ipc.connectTo('world', () => {
  ipc.of.world.on('connect', () => {
    // ipc.log('## connected to world ##'.rainbow, ipc.config.delay)
    const query = 'general'
    console.log('searching for:', query)
    ipc.of.world.emit('search', query)
  })
  // ipc.of.world.on('disconnect', () => {
  //   ipc.log('disconnected from world'.notice)
  // })
  ipc.of.world.on('search', data => {
    // ipc.log('got search results from server :'.debug, data)
    console.log('search results:', data)
  })
})
