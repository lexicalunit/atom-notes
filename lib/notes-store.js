/** @babel */

import elasticlunr from 'elasticlunr'
import fs from 'fs-plus'
import path from 'path'
import matter from 'gray-matter'
import * as NotesFs from './notes-fs'

let { EventEmitter } = require('events')
const { watchPath } = require('atom')

function isEmpty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

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
  if (!fs.existsSync(filePath)) { return false }

  // we can't just check isFile() b/c we want to support symlinks to files
  let fileStats = fs.statSync(filePath)
  if (fileStats.isDirectory() ||
      fileStats.isBlockDevice() ||
      fileStats.isCharacterDevice() ||
      fileStats.isFIFO() ||
      fileStats.isSocket()) { return false }

  let fileName = path.basename(filePath)
  let title = path.basename(fileName, path.extname(fileName))
  let keywords = []
  let abstract = null

  let body
  try {
    body = fs.readFileSync(filePath, { encoding: 'utf8' })
  } catch (_) {
    // if we fail to read the file for whatever reason, let's ignore the file
    return false
  }

  let meta
  try {
    meta = matter(body).data
  } catch (_) {
    // If YAML parsing fails, that's fine. We just won't have meta data.
  }

  if (meta !== undefined && meta.keywords !== undefined) {
    keywords = meta.keywords
  }

  if (meta !== undefined && meta.abstract !== undefined) {
    abstract = meta.abstract
  }

  try {
    return {
      filePath: filePath,
      fileName: fileName,
      title: title,
      modifiedAt: fileStats.mtime,
      body: body,
      keywords: keywords,
      abstract: abstract
    }
  } catch (_) {
    return {}
  }
}

async function setupFileWatcher (directoryPath) {
  const watchedDirectory = fs.normalize(directoryPath)
  fs.listTreeSync(watchedDirectory).forEach(path => {
    if (!fs.isDirectorySync(path)) {
      if (NotesFs.isNote(path)) {
        this.addDocument(createDocument(path))
      }
    }
  })
  return watchPath(watchedDirectory, {}, events => {
    for (const event of events) {
      if (event.action === 'created') {
        this.addDocument(createDocument(event.path))
      } else if (event.action === 'modified') {
        this.updateDocument(createDocument(event.path))
      } else if (event.action === 'deleted') {
        this.removeDocument(this._documents[event.path])
      } else if (event.action === 'renamed') {
        this.removeDocument(this._documents[event.oldPath])
        this.addDocument(createDocument(event.path))
      }
    }
  })
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
    this.directoryPath = directoryPath
    this.extensions = extensions
    this.index = index
    this._documents = {}
  }

  /**
   * Initialize document storage by creating the document index.
   * Emits "ready" when index is ready.
   */
  initialize () {
    if (this.index) {
      console.log('atom-notes: loading...')
      this.loaded = true
      this.index = elasticlunr.Index.load(this.index)
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

    this.watcher = setupFileWatcher.bind(this)(this.directoryPath)
    this.emit('ready')
  }

  /**
   * Adds the given document to our index.
   * @param {DocumentItem} doc
   */
  addDocument (doc) {
    if (!doc || isEmpty(doc)) return
    const key = fs.realpathSync(doc.filePath)
    this._documents[key] = doc
    let data = {
      id: key,
      title: doc.title,
      body: doc.body,
      abstract: doc.abstract
    }
    if (doc.keywords && Array.isArray(doc.keywords)) {
      data.keywords = doc.keywords.join(', ')
    }
    this.index.addDoc(data)
    this.emit('added', doc)
  }

  /**
   * Updates the given document, identified by filePath, in our index.
   * @param {DocumentItem} doc
   */
  updateDocument (doc) {
    if (!doc || isEmpty(doc)) return
    const key = fs.realpathSync(doc.filePath)
    this._documents[key] = doc
    let data = {
      id: key,
      title: doc.title,
      body: doc.body,
      abstract: doc.abstract
    }
    if (doc.keywords && Array.isArray(doc.keywords)) {
      data.keywords = doc.keywords.join(', ')
    }
    this.index.updateDoc(data)
    this.emit('updated', doc)
  }

  /**
   * Removes the given document, identified by filePath, from our index.
   * @param {DocumentItem} doc
   */
  removeDocument (doc) {
    if (!doc || isEmpty(doc)) return false
    const key = doc.filePath
    delete this._documents[key]
    let data = {
      id: key,
      title: doc.title,
      body: doc.body,
      abstract: doc.abstract
    }
    if (doc.keywords && Array.isArray(doc.keywords)) {
      data.keywords = doc.keywords.join(', ')
    }
    this.index.removeDoc(data)
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
    return this.index.search(query, config).map(result => {
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
