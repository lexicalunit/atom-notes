/** @babel */

import * as Utility from './utility'

export default {
  config: require('./config.coffee').config,

  activate (state) {
    const {CompositeDisposable} = require('atom')

    Utility.ensureNotesGrammarIsLoaded()
    Utility.ensureNotesDirectory()

    this.subs = new CompositeDisposable()

    handleCommands.bind(this)()
    handleEvents.bind(this)()
    ensureGrammarForPackage.bind(this)('markdown-preview')
    ensureGrammarForPackage.bind(this)('spell-check')
  },

  /** Returns our package's NotesView controller. */
  getNotesView () {
    if (!_notesView) {
      const {Disposable} = require('atom')
      const NotesView = require('./notes-view')

      _notesView = new NotesView()
      this.subs.add(new Disposable(() => {
        _notesView.destroy()
        _notesView = null
      }))
    }

    return _notesView
  },

  deactivate () {
    this.subs.dispose()
    this.subs = null
  }
}

/***********************************************/
/* Private Methods - Remember to bind to this! */
/***********************************************/

/** Sets up Atom commands for our package. */
function handleCommands () {
  const {openInterlink} = require('./interlink')

  this.subs.add(
    atom.commands.add('atom-workspace',
                      `${Utility.packageName}:toggle`,
                      () => this.getNotesView().toggle()),
    atom.commands.add('atom-workspace',
                      `${Utility.packageName}:interlink`,
                      () => openInterlink())
  )
}

/** Sets up our event handlers and observers. */
function handleEvents () {
  const {Disposable} = require('atom')

  // window::beforeunload
  let handleBeforeUnload = autosaveAll.bind(this)
  window.addEventListener('beforeunload', handleBeforeUnload, true)
  this.subs.add(new Disposable(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload, true)
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
  this.subs.add(new Disposable(() => {
    window.removeEventListener('blur', handleBlur, true)
  }))

  // atom events
  this.subs.add(atom.workspace.onWillDestroyPaneItem((paneItem) => {
    if (!autodelete(paneItem.item)) autosave(paneItem.item)
  }))
  this.subs.add(atom.workspace.observeTextEditors((editor) => {
    if (Utility.isNote(editor.getPath())) {
      editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm.notes'))
    }
  }))
}

/** Ensures that our grammar is loaded into the conifg for the given package. */
function ensureGrammarForPackage (name) {
  if (atom.packages.isPackageActive(name)) {
    return addOurGrammarToPackage(name)
  }

  if (!this.pendingPackages) this.pendingPackages = []
  if (this.pendingPackages.includes(name)) return
  if (this.GrammarSub) return

  let callback = (pack) => {
    const index = this.pendingPackages.indexOf(pack.name)
    if (index === -1) return

    addOurGrammarToPackage(pack.name)
    this.pendingPackages.splice(index, 1)

    if (this.pendingPackages.length <= 0) {
      this.subs.remove(this.GrammarSub)
      this.GrammarSub.dispose()
      this.GrammarSub = null
    }
  }
  this.GrammarSub = atom.packages.onDidActivatePackage(callback)
  this.subs.add(this.GrammarSub)
}

/**************************/
/* Implementation Details */
/**************************/
let _notesView

async function addOurGrammarToPackage (name) {
  let markdownGrammars = atom.config.get(`${name}.grammars`)
  if (!markdownGrammars.includes('source.gfm.notes')) {
    atom.config.set(`${name}.grammars`, markdownGrammars.concat(['source.gfm.notes']))
  }
}

function autosave (paneItem) {
  if (!atom.config.get(`${Utility.packageName}.enableAutosave`)) return
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
  if (!atom.config.get(`${Utility.packageName}.enableAutosave`)) return
  atom.workspace.getPaneItems().forEach(i => autosave(i))
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
