/** @babel */

import * as Utility from './utility'

export default {
  config: require('./config.coffee').config,

  activate (state) {
    makeReady(this)
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
  }
}

let _notesView

/** Begin loading our document store in the background when event queue is empty.
  *
  * Note: We will signal that our module is ready when we set this.ready to true.
  */
function makeReady (self) {
  self.ready = undefined

  setTimeout(() => {
    if (!Utility.ensureNotesDirectory()) {
      // If we don't have a suitable notes directory, we can't finish activation.
      __guard__(atom.packages.getActivePackage('atom-notes'), x => x.deactivate())
      self.ready = false
      return
    }

    Utility.ensureNotesGrammarIsLoaded()

    self.store = new Promise(function (resolve, reject) {
      const DocQuery = require('docquery')
      let dq = new DocQuery(Utility.getNotesDirectory(), {
        recursive: true,
        extensions: atom.config.get('atom-notes.extensions')
      })
      dq.on('ready', () => {
        self.ready = true
        dq.loaded = true
      })
      if (!atom.config.get('atom-notes.useLunrPipeline')) {
        dq.searchIndex.pipeline.reset()
      }
      resolve(dq)
    })

    handleEvents(self)
  }, 0)
}

function handleEvents (self) {
  const {openInterlink} = require('./interlink')
  const {CompositeDisposable, Disposable} = require('atom')
  self.subs = new CompositeDisposable()

  // user commands
  self.subs.add(
    atom.commands.add('atom-workspace',
                      'atom-notes:toggle',
                      () => self.getNotesView().toggle()),
    atom.commands.add('atom-workspace',
                      'atom-notes:interlink',
                      () => openInterlink())
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
    }),
    atom.workspace.observeTextEditors((editor) => {
      if (Utility.isNote(editor.getPath())) {
        editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm.notes'))
      }
    }),
    atom.packages.onDidActivateInitialPackages(() => {
      ensureGrammarForPackages('markdown-preview', 'spell-check')
    })
  )
}

/** Ensures that our grammar is loaded into the conifg for the given package names. */
function ensureGrammarForPackages (...names) {
  for (const name of names) {
    if (atom.packages.isPackageActive(name)) {
      addOurGrammarToPackage(name)
    }
  }
}

function addOurGrammarToPackage (name) {
  let markdownGrammars = atom.config.get(`${name}.grammars`)
  if (!markdownGrammars.includes('source.gfm.notes')) {
    atom.config.set(`${name}.grammars`, markdownGrammars.concat(['source.gfm.notes']))
  }
}

function autosave (paneItem) {
  if (!atom.config.get('atom-notes.enableAutosave')) return
  if (!__guard__(paneItem, x => x)) return
  let uri = __guard__(paneItem.getURI, f => f.call(paneItem))
  if (!uri) return
  let modified = __guard__(paneItem.isModified, f => f.call(paneItem))
  if (!modified) return
  if (!Utility.isNote(uri)) return
  __guard__(paneItem.save, f => f.call(paneItem))
}

function autodelete (paneItem) {
  if (!__guard__(paneItem, x => x)) return false
  let filePath = __guard__(paneItem.getURI, f => f.call(paneItem))
  if (!filePath) return false
  if (!Utility.isNote(filePath)) return false
  let empty = __guard__(paneItem.isEmpty, f => f.call(paneItem))
  if (!empty) return false
  let noteTitle = filePath.substr(filePath.lastIndexOf('/') + 1)
  atom.notifications.addInfo(`Deleting empty note "${noteTitle}"...`, {
    dismissable: true
  })
  try {
    Utility.unlinkFile(filePath)
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

function autosaveAll () {
  if (!atom.config.get('atom-notes.enableAutosave')) return
  atom.workspace.getPaneItems().forEach(i => autosave(i))
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
