/** @babel */

import fs from 'fs-plus'
import path from 'path'

import * as NotesFs from './notes-fs'

export default {
  config: require('./config.coffee').config,

  activate (state) {
    this.dq = null
    this.ready = undefined

    if (state) {
      makeReady(this, state)
    } else {
      makeReady(this)
    }
  },

  serialize () {
    if (this.dq) {
      return {
        'deserializer': 'SearchIndex',
        'data': JSON.stringify(this.dq.searchIndex)
      }
    }
  },

  deserializeSearchIndex ({data}) {
    try {
      return JSON.parse(data)
    } catch (_) {
      return null
    }
  },

  async deactivate () {
    __guard__(this.subs, x => x.dispose())
    this.subs = null
  },

  /** Returns our package's NotesView controller. */
  getNotesView () {
    if (!_notesView) {
      const {Disposable} = require('atom')
      const NotesView = require('./notes-view')

      _notesView = new NotesView(this.store)
      this.subs.add(new Disposable(() => {
        _notesView.destroy()
        _notesView = null
      }))
    }

    return _notesView
  },

  /** Returns true iff the given file path is a note. */
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
function makeReady (self, state = null) {
  setTimeout(() => {
    if (!ensureNotesDirectory()) {
      // If we don't have a suitable notes directory, we can't finish activation.
      __guard__(atom.packages.getActivePackage('atom-notes'), x => x.deactivate())
      self.ready = false
      return
    }

    self.store = new Promise(function (resolve, reject) {
      const DocQuery = require('docquery')
      let options = {
        recursive: true,
        extensions: atom.config.get('atom-notes.extensions')
      }
      if (state) options.searchIndex = atom.deserializers.deserialize(state)
      let dq = new DocQuery(NotesFs.getNotesDirectory(), options)
      dq.on('ready', () => {
        self.ready = true
        dq.loaded = true
      })
      if (!atom.config.get('atom-notes.useLunrPipeline')) {
        dq.searchIndex.pipeline.reset()
      }
      resolve(dq)
    })
    self.store.then(dq => (self.dq = dq))

    handleEvents(self)
  }, 0)
}

function handleEvents (self) {
  const {openInterlink} = require('./interlink')
  const {CompositeDisposable, Disposable} = require('atom')
  self.subs = new CompositeDisposable()

  // user commands
  self.subs.add(
    atom.commands.add('atom-workspace', 'atom-notes:toggle', () => self.getNotesView().toggle()),
    atom.commands.add('atom-workspace', 'atom-notes:interlink', () => openInterlink())
  )

  // window::beforeunload
  window.addEventListener('beforeunload', autosaveAll, true)
  self.subs.add(new Disposable(() => {
    window.removeEventListener('beforeunload', autosaveAll, true)
  }))

  // window::blur
  let handleBlur = (event) => {
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
    atom.workspace.onWillDestroyPaneItem((paneItem) => {
      if (!autodelete(paneItem.item)) autosave(paneItem.item)
      // TODO: Invalidate the select list search results?
    })
  )
}

/** Ensures the configured notes directory exists. */
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

/** Automatically saves the the note found in the given pane item. */
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

/** Automatically deletes empty notes found in the given pane item. */
function autodelete (paneItem) {
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
  try {
    fs.unlinkSync(filePath)
  } catch (e) {
    if (e.code === 'ENOENT') return true
    atom.notifications.addError(`Failed to delete empty note "${noteTitle}"`, {
      detail: e.message,
      dismissable: true
    })
    return false
  }
  return true
}

/** Go through text editors and save all notes. */
function autosaveAll () {
  if (!atom.config.get('atom-notes.enableAutosave')) return
  atom.workspace.getPaneItems().forEach(i => autosave(i))
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
