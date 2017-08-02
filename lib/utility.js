/** @babel */

// Lazy load requirements to lessen package load time.
let _fs = null
let _path = null
function getFs () {
  if (_fs === null) _fs = require('fs-plus')
  return _fs
}
function getPath () {
  if (_path === null) _path = require('path')
  return _path
}

export default {
  /** Package name and settings namespace. */
  packageName: 'atom-notes',

  /** Default file extension for notes. */
  defaultNoteExtension: '.md',

  /** Get the root directory for notes archival. */
  getNotesDirectory () {
    return getFs().normalize(atom.config.get(`${this.packageName}.directory`))
  },

  /** Ensures the configured notes directory exists. */
  ensureNotesDirectory () {
    let fs = getFs()
    let path = getPath()
    let notesDirectory = this.getNotesDirectory()
    let packagesDirectory = fs.normalize(path.join(process.env.ATOM_HOME, 'packages'))
    let defaultNotesDirectory = path.join(packagesDirectory, this.packageName, 'notebook')

    if (notesDirectory.startsWith(packagesDirectory)) {
      throw new Error(`Notes Directory ${notesDirectory} cannot reside
                       within your atom packages directory.`)
    }

    if (!fs.existsSync(notesDirectory)) {
      fs.makeTreeSync(notesDirectory)
      fs.copySync(defaultNotesDirectory, notesDirectory)
    }
  },

  /** Ensures the notes grammer is properly loaded */
  ensureNotesGrammarIsLoaded () {
    if (!atom.grammars.grammarForScopeName('source.gfm.notes')) {
      const packagePath = atom.packages.resolvePackagePath(this.packageName)
      const grammarPath = getPath().join(packagePath, 'grammars', 'notes.cson')
      atom.grammars.loadGrammarSync(grammarPath)
    }
  },

  /** Returns the default file extension for newly created notes. */
  getPrimaryNoteExtension () {
    const extensions = atom.config.get(`${this.packageName}.extensions`)
    if (extensions.length > 0) return extensions[0]
    return this.defaultNoteExtension
  },

  /** Returns the intended path on your filesystem for a note with the given title. */
  notePathForTitle (title) {
    if (!__guard__(title, x => x)) return null
    return getPath().join(
      this.getNotesDirectory(),
      title.trim() + this.getPrimaryNoteExtension()
    )
  },

  /** Creates a new note with the given title, then opens the note in Atom. */
  createNote (title) {
    let destination = this.notePathForTitle(title)
    if (!__guard__(title, x => x)) return
    try {
      getFs().writeFileSync(destination, '')
      atom.workspace.open(destination)
    } catch (e) {
      atom.notifications.addError(`Failed to create new note "${title}"`, {
        detail: e.message,
        dismissable: true
      })
    }
  },

  /** Returns true iff the given file path is a note. */
  isNote (filePath) {
    let fs = getFs()

    if (!filePath) return false
    const normalPath = fs.normalize(filePath)
    // if (!fs.existsSync(normalPath)) return false // TODO: Is this necessiary?

    const extensions = atom.config.get(`${this.packageName}.extensions`)
    const ext = getPath().extname(filePath.toString())
    if (!extensions.includes(ext)) return false

    const notesDirectory = this.getNotesDirectory()
    if (normalPath.startsWith(notesDirectory)) return true

    // support symlinks
    try {
      const realNotesDirectory = fs.realpathSync(notesDirectory)
      if (normalPath.startsWith(realNotesDirectory)) return true

      const syncPath = fs.realpathSync(normalPath)
      if (syncPath.startsWith(notesDirectory)) return true
      if (syncPath.startsWith(realNotesDirectory)) return true
    } catch (e) {
      if (e.code === 'ENOENT') return false
      throw e
    }

    return false
  },

  /** Deletes the given file at the given filePath from your filesystem */
  unlinkFile (filePath) {
    getFs().unlinkSync(filePath)
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
