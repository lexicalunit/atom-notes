/** @babel */

import chokidar from 'chokidar'
import elasticlunr from 'elasticlunr'
import fs from 'fs-plus'
import path from 'path'
import matter from 'gray-matter'

let {EventEmitter} = require('events')

/**
  * @typedef DocumentItem
  * @type {Object}
  * @property {string} title - Title of the note.
  * @property {string} fileName - Name of the file where note is stored.
  * @property {string} filePath - Path to the file where note is stored.
  * @property {string} body - Body of the note.
  * @property {Array} keywords - Keywords of the note.
  * @property {Array} abstract - Summary of the note.
  * @property {Date} modifiedAt - Date and time of last modification to the note.
  */

/**
 * Builds a document object to hold state about a note document.
 * @param  {String} filePath Full path to the document.
 * @return {DocumentItem}
 */
function createDocument (filePath) {
  let fileStats = fs.statSync(filePath)
  let fileName = path.basename(filePath)
  let title = path.basename(fileName, path.extname(fileName))
  let body = fs.readFileSync(filePath, {encoding: 'utf8'})
  let meta = matter(body).data
  let keywords = []
  let abstract = null

  if (meta !== undefined && meta.keywords !== undefined) {
    keywords = meta.keywords
  }

  if (meta !== undefined && meta.abstract !== undefined) {
    abstract = meta.abstract
  }

  return {
    filePath: filePath,
    fileName: fileName,
    title: title,
    modifiedAt: fileStats.mtime,
    body: body,
    keywords: keywords,
    abstract: abstract
  }
}

class NotesStore extends EventEmitter {
  /**
   * Document storage for notes.
   * @param {String}   directoryPath Full path to where notes are stored.
   * @param {String[]} extensions    File extensions of notes.
   * @param {Object}   [index=null]  Serialized elasticlunr index to load.
   */
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
        this.addField('keywords')
        this.addField('abstract')
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

  /**
   * Adds the given document to our index.
   * @param {DocumentItem} doc
   */
  addDocument (doc) {
    this._documents[doc.filePath] = doc
    this.index.addDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body,
      keywords: doc.keywords.join(', '),
      abstract: doc.abstract
    })
    this.emit('added', doc)
  }

  /**
   * Updates the given document, identified by filePath, in our index.
   * @param {DocumentItem} doc
   */
  updateDocument (doc) {
    this._documents[doc.filePath] = doc
    this.index.updateDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body,
      keywords: doc.keywords.join(', '),
      abstract: doc.abstract
    })
    this.emit('updated', doc)
  }

  /**
   * Removes the given document, identified by filePath, from our index.
   * @param {DocumentItem} doc
   */
  removeDocument (doc) {
    delete this._documents[doc.filePath]
    this.index.removeDoc({
      id: doc.filePath,
      title: doc.title,
      body: doc.body,
      keywords: doc.keywords.join(', '),
      abstract: doc.abstract
    })
    this.emit('removed', doc)
  }

  /**
   * Search for notes in our document store.
   * @param  {String} query Some text to use for matching indexed documents.
   * @return {DocumentItem[]}
   */
  search (query) {
    const config = {
      fields: {
        keywords: { boost: 20, bool: 'AND' },
        title: { boost: 10, bool: 'AND' },
        abstract: { boost: 5, bool: 'AND' },
        body: { boost: 1 }
      },
      bool: 'OR',
      expand: true
    }
    return this.index.search(query, config).map((result) => {
      return this._documents[result.ref]
    })
  }

  /**
   * Fetch all documents in our index.
   * @return {DocumentItem[]}
   */
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
