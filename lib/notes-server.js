'use strict';

var ipc = require('node-ipc');

ipc.config.id = 'world';
ipc.config.retry = 1500;

var NotesStore = require('./notes-store');
var directoryPath = '/Users/atroschinetz/Dropbox/nv';
var extensions = ['.md', '.markdown', '.adoc', '.txt'];

var store = new NotesStore(directoryPath, extensions);
store.on('ready', function () {
  console.log('atom-server: ready');
});

ipc.serve(function () {
  ipc.server.on('search', function (data, socket) {
    // ipc.log('got search request for :'.debug, data)
    console.log('got search:', data);
    var results = store.search(data);
    console.log('results:', results);
    ipc.server.emit(socket, 'search', JSON.stringify(results));
  });
  // ipc.server.on('socket.disconnected', function (socket, destroyedSocketID) {
  //   ipc.log('client ' + destroyedSocketID + ' has disconnected!')
  // })
});

ipc.server.start();