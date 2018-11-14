/** @babel */

import fs from 'fs-plus'
import path from 'path'

/** Default file extension for notes. */
const defaultNoteExtension = '.md'

export default {
  /**
   * Get the root directory for notes archival.
   * @return {String} Normalized path.
   */
  getNotesDirectory () {
    return fs.normalize(atom.config.get('atom-notes.directory'))
  },

  /**
   * Returns the default file extension for newly created notes.
   * @return {String} For example ".md".
   */
  getPrimaryNoteExtension () {
    const extensions = atom.config.get('atom-notes.extensions')
    if (extensions.length > 0) return extensions[0]
    return defaultNoteExtension
  },

  /**
   * Returns the intended path on your filesystem for a note with the given title.
   * @param  {String} title The note's title sans file-extension.
   * @return {String}       Full normalized path within your notes directory.
   */
  notePathForTitle (title) {
    if (!__guard__(title, x => x)) return null
    return path.join(
      this.getNotesDirectory(),
      title.trim() + this.getPrimaryNoteExtension()
    )
  },

  /**
   * Opens a note for the given title in Atom; creates one if it doesn't exist already.
   * @param  {String} title The note's title sans file-extension.
   */
  openNote (title) {
    let destination = this.notePathForTitle(title)
    if (!__guard__(title, x => x)) return
    try {
      if (!fs.existsSync(destination)) {
        fs.writeFileSync(destination, '')
      }
      atom.workspace.open(destination)
    } catch (e) {
      atom.notifications.addError(`Failed to open note "${title}"`, {
        detail: e.message,
        dismissable: true
      })
    }
  },

  /**
   * Returns true iff the given file path is a note.
   * @param  {String}  filePath Any valid file path.
   * @return {Boolean}
   */
  isNote (filePath) {
    if (!filePath) return false
    const normalPath = fs.normalize(filePath)
    // if (!fs.existsSync(normalPath)) return false // NOTE: Not necessary!

    const extensions = atom.config.get('atom-notes.extensions')
    const regex = RegExp(extensions.join('|'), 'i')
    const ext = path.extname(filePath.toString())
    if (!regex.test(ext)) return false

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
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
