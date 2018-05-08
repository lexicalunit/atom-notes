/** @babel */

import fs from 'fs-plus'
import path from 'path'

import * as NotesFs from './notes-fs'

/**
  * @typedef SerializedIndex
  * @type {Object}
  */

export default {
  config: require('./config.coffee').config,

  /**
   * Activate our package. Final activation and notes storage will be done async.
   * @param {SerializedIndex} state A previously serialized document storage index to load.
   */
  activate (state) {
    console.info('Activating atom-notes')
    this.store = null
    this.ready = undefined
    this.doSerialize = true

    if (state) {
      makeReady(this, state)
    } else {
      makeReady(this)
    }
  },

  /**
  * Handle URI calls to `atom://atom-notes`. See:
  * <https://flight-manual.atom.io/hacking-atom/sections/handling-uris/>
  *
  * Specifically `atom://atom-notes/toggle` will toggle the atom-notes view in
  * the front-most, most recently active or a new, Atom window; will start
  * atom if necessary.
  *
  * @param {urlObject} parsedUri URI parsed with Node's url.parse(uri, true)
  */
  handleURI (parsedUri) {
    if (parsedUri.pathname === '/toggle') {
      this.getNotesView().toggle()
    } if (parsedUri.pathname === '/toggle/preview') {
      if (this.markdownUri) {
        this.getNotesView().toggle(this.markdownUri)
      } else {
        atom.notifications.addError(
          'markdown-preview or markdown-preview-plus is required for this uri to work')
      }
    } else {
      atom.notifications.addError(
        'Only the URI `atom://atom-notes/toggle` and `atom:///atom-notes/toggle/preview` is currently supported')
    }
  },

  /**
   * Return serialized document storage index for faster package activation.
   * @return {SerializedIndex}
   */
  serialize () {
    let rvalue = {
      'deserializer': 'SearchIndex',
      'data': null
    }
    if (this.store && this.doSerialize) {
      let data = null
      try {
        data = JSON.stringify(this.store.index)
      } catch (e) {
        console.error('atom-notes: serialization failure', e)
      }
      const maxSerializedDataLength = 133169152
      if (data && data.length < maxSerializedDataLength) {
        rvalue.data = data
      } else {
        this.doSerialize = false
      }
    }
    return rvalue
  },

  /**
   * Returns deserialized search index.
   * @param  {SerializedIndex} data
   * @return {Object}               Search index if we could deserialize it, otherwise null.
   */
  deserializeSearchIndex ({data}) {
    try {
      const store = JSON.parse(data)

      // Older versions use DocQuery's lunr searchIndex v0.6.0.
      // We can not deserialize this properly for elasticlunr.
      if (store.hasOwnProperty('corpusTokens')) return null

      return store
    } catch (_) {
      return null
    }
  },

  async deactivate () {
    __guard__(this.subs, x => x.dispose())
    this.subs = null
  },

  /**
   * Returns our package's NotesView controller.
   * @return {NotesView}
   */
  getNotesView () {
    if (!_notesView) {
      const {Disposable} = require('atom')
      const NotesView = require('./notes-view')

      _notesView = new NotesView(this.storePromise)
      this.subs.add(new Disposable(() => {
        _notesView.destroy()
        _notesView = null
      }))
    }

    return _notesView
  },

  /**
   * Returns true iff the given file path is a note.
   * @param  {String}  filePath Any valid file path.
   * @return {Boolean}
   */
  isNote (filePath) {
    const NotesFs = require('./notes-fs')
    return NotesFs.isNote(filePath)
  }
}

let _notesView

/** Begin loading our document store in the background when event queue is empty.
  *
  * Note: We will signal that our module is ready when we set this.ready to true.
  */

/**
 * Begin loading our document store in the background when event queue is empty.
 * Note: We will signal that our module is ready when we set this.ready to true.
 * @param {Object}          self         Alias for this.
 * @param {SerializedIndex} [state=null]
 */
function makeReady (self, state = null) {
  setTimeout(() => {
    if (!ensureNotesDirectory()) {
      // If we don't have a suitable notes directory, we can't finish activation.
      __guard__(atom.packages.getActivePackage('atom-notes'), x => x.deactivate())
      self.ready = false
      return
    }

    const t0 = performance.now()
    self.storePromise = new Promise(function (resolve, reject) {
      const NotesStore = require('./notes-store')
      const directoryPath = NotesFs.getNotesDirectory()
      const extensions = atom.config.get('atom-notes.extensions')
      const index = state ? atom.deserializers.deserialize(state) : null
      let store = new NotesStore(directoryPath, extensions, index)
      store.on('ready', () => {
        self.ready = true
        store.loaded = true
        const td = Math.round(performance.now() - t0)
        console.log(`atom-notes: ready in ${td}ms`)
      })
      store.initialize()
      resolve(store)
    })
    self.storePromise.then(store => (self.store = store))

    handleEvents(self)
  }, 0)
}

/**
 * Install event handlers.
 * @param {Object} self Alias for this.
 */
function handleEvents (self) {
  const {openInterlink} = require('./interlink')
  const {CompositeDisposable, Disposable} = require('atom')
  self.subs = new CompositeDisposable()
  
  /**
   * List of supported preview packages in order from the most important.
   */
  let markdownPreviewPackages = {
    'markdown-preview-plus': 'markdown-preview-plus://file/',
    'markdown-preview': 'markdown-preview://',
  }
  let previewCommand = null
  
  // user commands
  self.subs.add(
    atom.commands.add('atom-workspace', 'atom-notes:toggle', () => self.getNotesView().toggle()),
    atom.commands.add('atom-workspace', 'atom-notes:interlink', () => openInterlink())
  )
  
  /**
   * Quickly activate the 'atom-notes:toggle-preview' command if not
   * already active.
   */
  function activatePreviewCommand() {
    if (!previewCommand) {
      previewCommand = atom.commands.add(
        'atom-workspace',
        'atom-notes:toggle-preview',
        () => self.getNotesView().toggle(self.markdownUri))
      self.subs.add(previewCommand)
    }
  }
  
  /**
   * Quickly deactivate the 'atom-notes:toggle-preview' command if is
   * already active.
   */
  function deactivatePreviewCommand() {
    if (previewCommand) {
      if (self.subs) {
        self.subs.remove(previewCommand)
      }
      previewCommand.dispose()
      previewCommand = null
    }
  }
  
  /**
   * Choose first active package from markdownPreviewPackages, set the uri
   * and activate the command if not already active. If none of the packages
   * from the list is active it will deactivate the command and reset the uri.
   */
  function activatePreview() {
    for ([package, uri] of Object.entries(markdownPreviewPackages)) {
      if (atom.packages.isPackageActive(package)) {
        self.markdownUri = uri
        activatePreviewCommand()
        return
      }
    }
    deactivatePreviewCommand()
    self.markdownUri = null
  }
  
  /**
   * Let's initialize on start
   */
  activatePreview()
  
  /**
   * Check the packages again if something changed and activate or deactivate
   * the command and uri.
   */
  atom.packages.onDidActivatePackage(activatePreview)
  atom.packages.onDidDeactivatePackage(activatePreview)

  // window::beforeunload
  window.addEventListener('beforeunload', autosaveAll, true)
  self.subs.add(new Disposable(() => {
    window.removeEventListener('beforeunload', autosaveAll, true)
  }))

  // window::blur
  let handleBlur = event => {
    if (event.target === window) {
      autosaveAll()
    } else if (
      event.target.matches('atom-text-editor:not([mini])') &&
      !event.target.contains(event.relatedTarget)
    ) {
      autosave(event.target.getModel())
    }
  }
  window.addEventListener('blur', handleBlur, true)
  self.subs.add(new Disposable(() => {
    window.removeEventListener('blur', handleBlur, true)
  }))

  // atom events
  self.subs.add(
    atom.workspace.onWillDestroyPaneItem(paneItem => {
      autodelete(paneItem.item).then(deleted => {
        if (!deleted) {
          autosave(paneItem.item)
        }
      })
    })
  )
}

/**
 * Ensures the configured notes directory exists.
 */
function ensureNotesDirectory () {
  let notesDirectory = NotesFs.getNotesDirectory()
  let packagesDirectory = fs.normalize(path.join(process.env.ATOM_HOME, 'packages'))
  let defaultNotesDirectory = path.join(packagesDirectory, 'atom-notes', 'notebook')

  if (notesDirectory.startsWith(packagesDirectory)) {
    let msg = `Notes Directory ${notesDirectory} cannot reside within your atom packages directory.`
    atom.notifications.addError(msg, { dismissable: true })
    return false
  }

  if (!fs.existsSync(notesDirectory)) {
    fs.makeTreeSync(notesDirectory)
    fs.copySync(defaultNotesDirectory, notesDirectory)
  }

  return true
}

/**
 * Automatically saves the the note found in the given pane item.
 * @param {TextEditor} paneItem
 */
function autosave (paneItem) {
  if (!atom.config.get('atom-notes.enableAutosave')) return
  if (!__guard__(paneItem, x => x)) return
  let uri = __guard__(paneItem.getURI, f => f.call(paneItem))
  if (!uri) return
  let modified = __guard__(paneItem.isModified, f => f.call(paneItem))
  if (!modified) return
  if (!NotesFs.isNote(uri)) return
  __guard__(paneItem.save, f => f.call(paneItem))
}

/**
 * Automatically deletes empty notes found in the given pane item.
 * @param {TextEditor} paneItem
 */
async function autodelete (paneItem) {
  if (!__guard__(paneItem, x => x)) return false
  let filePath = __guard__(paneItem.getURI, f => f.call(paneItem))
  if (!filePath) return false
  if (!NotesFs.isNote(filePath)) return false
  let empty = __guard__(paneItem.isEmpty, f => f.call(paneItem))
  if (!empty) return false
  let noteTitle = filePath.substr(filePath.lastIndexOf('/') + 1)
  atom.notifications.addInfo(`Deleting empty note "${noteTitle}"...`, {
    dismissable: true
  })

  return new Promise(resolve => {
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath)
        resolve(true)
      } catch (e) {
        if (e.code === 'ENOENT') {
          // The path already doesn't exist, this is fine.
          resolve(true)
        } else {
          atom.notifications.addError(`Failed to delete empty note "${noteTitle}"`, {
            detail: e.message,
            dismissable: true
          })
          resolve(false)
        }
      }
    })
  })
}

/**
 * Go through text editors and save all notes.
 */
function autosaveAll () {
  if (!atom.config.get('atom-notes.enableAutosave')) return
  if (atom.workspace) {
    __guard__(atom.workspace.getPaneItems(), items => {
      items.forEach(i => autosave(i))
    })
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
