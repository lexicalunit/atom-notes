/** @babel */

import {CompositeDisposable, Disposable} from 'atom'

import * as Utility from './utility'
import * as Interlink from './interlink'

let _notesView = null

export default {
  config: require('./config.coffee').config,

  activate (state) {
    Utility.ensureNotesGrammarIsLoaded()
    Utility.ensureNotesDirectory()

    this.subs = new CompositeDisposable()
    this.handleCommands()
    this.handleEvents()
    this.handleMarkdownPreviewIntegration()
  },

  handleCommands () {
    this.subs.add(
      atom.commands.add('atom-workspace',
                        `${Utility.packageName}:toggle`,
                        () => this.getNotesView().toggle()),
      atom.commands.add('atom-workspace',
                        `${Utility.packageName}:interlink`,
                        () => Interlink.openInterlink())
    )
  },

  handleEvents () {
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
  },

  handleMarkdownPreviewIntegration () {
    if (atom.packages.isPackageActive('markdown-preview')) {
      ensureMarkdownPreviewGrammarIsConfigured()
    }
    this.subs.add(atom.packages.onDidActivatePackage((pack) => {
      if (pack.name !== 'markdown-preview') return
      ensureMarkdownPreviewGrammarIsConfigured()
    }))
  },

  getNotesView () {
    if (_notesView === null) {
      let NotesView = require('./notes-view')
      _notesView = new NotesView()
    }
    return _notesView
  },

  deactivate () {
    __guard__(this.subs, x => x.dispose())
    this.subs = null
    __guard__(this.notesView, x => x.destroy())
    this.notesView = null
  }
}

async function ensureMarkdownPreviewGrammarIsConfigured () {
  let markdownGrammars = atom.config.get('markdown-preview.grammars')
  if (!__guard__(markdownGrammars, x => x)) return
  if (!markdownGrammars.includes('source.gfm.notes')) {
    atom.config.set('markdown-preview.grammars', markdownGrammars.concat(['source.gfm.notes']))
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
