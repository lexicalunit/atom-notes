/** @babel */

import chokidar from 'chokidar'
import elasticlunr from 'elasticlunr'
import fs from 'fs-plus'
import path from 'path'

let {EventEmitter} = require('events')

function createDocument (filePath) {
  let fileStats = fs.statSync(filePath)
  let fileName = path.basename(filePath)
  let title = path.basename(fileName, path.extname(fileName))
  let body = fs.readFileSync(filePath, {encoding: 'utf8'})

  return {
    filePath: filePath,
    fileName: fileName,
    title: title,
    modifiedAt: fileStats.mtime,
    body: body
  }
}

class NotesStore extends EventEmitter {
  constructor (directoryPath, extensions, index = null) {
    super()
    this.extensions = extensions
    this._documents = {}

    if (index) {
      console.log('atom-notes: loading...')
      this.loaded = true
      this.index = elasticlunr.Index.load(index)
    } else {
      console.log('atom-notes: indexing...')
      this.loaded = false
      this.index = elasticlunr(function () {
        this.addField('title')
        this.addField('body')
      })
    }

    this.watcher = chokidar.watch(null, {
      depth: undefined, // recursive
      useFsEvents: false, // avoid native module issues on macOS
      persistent: true,
      ignored: (watchedPath, fileStats) => {
        if (!fileStats) return false
        if (fileStats.isDirectory()) return false
        return !(this.extensions.indexOf(path.extname(watchedPath)) > -1)
      }
    })

    this.watcher
      .on('add', filePath => this.addDocument(createDocument(filePath)))
      .on('change', filePath => this.updateDocument(createDocument(filePath)))
      .on('unlink', filePath => this.removeDocument(this._documents[filePath]))
      .on('ready', () => this.emit('ready'))
    this.watcher.add(fs.normalize(directoryPath))
  }

  addDocument (doc) {
    this._documents[doc.filePath] = doc
    this.index.addDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body
    })
    this.emit('added', doc)
  }

  updateDocument (doc) {
    this._documents[doc.filePath] = doc
    this.index.updateDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body
    })
    this.emit('updated', doc)
  }

  removeDocument (doc) {
    delete this._documents[doc.filePath]
    this.index.removeDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body
    })
    this.emit('removed', doc)
  }

  search (query) {
    const config = { 'fields': { 'title': { 'boost': 10 } } }
    return this.index.search(query, config).map((result) => {
      return this._documents[result.ref]
    })
  }

  get documents () {
    var documents = []
    for (let key in this._documents) {
      documents.push(this._documents[key])
    }
    return documents.sort((a, b) => {
      if (a.modifiedAt < b.modifiedAt) return 1
      if (a.modifiedAt > b.modifiedAt) return -1
      return 0
    })
  }
}

module.exports = NotesStore
