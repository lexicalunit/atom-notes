var ipc = require('node-ipc')

ipc.config.id = 'world'
ipc.config.retry = 1500

const NotesStore = require('./notes-store')
const directoryPath = '/Users/atroschinetz/Dropbox/nv'
const extensions = ['.md', '.markdown', '.adoc', '.txt']

let store = new NotesStore(directoryPath, extensions)
store.on('ready', function () {
  console.log('atom-server: ready')
})

ipc.serve(function () {
  ipc.server.on('search', function (data, socket) {
    // ipc.log('got search request for :'.debug, data)
    console.log('got search:', data)
    const results = store.search(data)
    console.log('results:', results)
    ipc.server.emit(socket, 'search', JSON.stringify(results))
  })
  // ipc.server.on('socket.disconnected', function (socket, destroyedSocketID) {
  //   ipc.log('client ' + destroyedSocketID + ' has disconnected!')
  // })
})

ipc.server.start()
