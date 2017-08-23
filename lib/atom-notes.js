/** @babel */

export default {
  config: require('./config.coffee').config,

  activate (state) {
    // FIXME: Using setTimeout() here breaks some spec tests.
    if (atom.inDevMode()) {
      asyncActivate(this)
    } else {
      setTimeout(() => asyncActivate(this), 0)
    }
  },

  async deactivate () {
    this.subs.dispose()
    this.subs = null
    __guard__(_activatePackageSub, x => x.dispose())
    _activatePackageSub = null
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

let _activatePackageSub
let _notesView
let _pendingGrammarPackages = []

/** Activate asynchronously to improve startup time and start loading notes asap. */
async function asyncActivate (self) {
  const {CompositeDisposable} = require('atom')
  const Utility = require('./utility')

  Utility.ensureNotesGrammarIsLoaded()
  Utility.ensureNotesDirectory()

  self.subs = new CompositeDisposable()
  self.store = new Promise(function (resolve, reject) {
    const DocQuery = require('docquery')
    let dq = new DocQuery(Utility.getNotesDirectory(), {
      recursive: true,
      extensions: atom.config.get('atom-notes.extensions')
    })
    dq.on('ready', () => (dq.loaded = true))
    if (!atom.config.get('atom-notes.useLunrPipeline')) {
      dq.searchIndex.pipeline.reset()
    }
    resolve(dq)
  })

  ensureGrammarForPackages(['markdown-preview', 'spell-check'])
  handleCommands(self)
  handleEvents(self)
}

/** Sets up Atom commands for our package. */
function handleCommands (self) {
  const {openInterlink} = require('./interlink')

  self.subs.add(
    atom.commands.add('atom-workspace',
                      'atom-notes:toggle',
                      () => self.getNotesView().toggle()),
    atom.commands.add('atom-workspace',
                      'atom-notes:interlink',
                      () => openInterlink())
  )
}

/** Sets up our event handlers and observers. */
function handleEvents (self) {
  const Utility = require('./utility')
  const {Disposable} = require('atom')

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
  self.subs.add(atom.workspace.onWillDestroyPaneItem((paneItem) => {
    if (!autodelete(paneItem.item)) autosave(paneItem.item)
  }))
  self.subs.add(atom.workspace.observeTextEditors((editor) => {
    if (Utility.isNote(editor.getPath())) {
      editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm.notes'))
    }
  }))
}

/** Ensures that our grammar is loaded into the conifg for the given package names. */
function ensureGrammarForPackages (names) {
  for (const name of names) {
    if (atom.packages.isPackageActive(name)) {
      addOurGrammarToPackage(name)
    } else {
      _pendingGrammarPackages.push(name)
    }
  }
  if (_pendingGrammarPackages.length <= 0) return

  let callback = (pack) => {
    const index = _pendingGrammarPackages.indexOf(pack.name)
    if (index === -1) return
    _pendingGrammarPackages.splice(index, 1)

    addOurGrammarToPackage(pack.name)

    if (_pendingGrammarPackages.length <= 0) {
      _activatePackageSub.dispose()
      _activatePackageSub = null
    }
  }
  _activatePackageSub = atom.packages.onDidActivatePackage(callback)
}

function addOurGrammarToPackage (name) {
  let markdownGrammars = atom.config.get(`${name}.grammars`)
  if (!markdownGrammars.includes('source.gfm.notes')) {
    atom.config.set(`${name}.grammars`, markdownGrammars.concat(['source.gfm.notes']))
  }
}

function autosave (paneItem) {
  const Utility = require('./utility')
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
  const Utility = require('./utility')
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
