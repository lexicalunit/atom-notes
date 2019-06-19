/** @babel */

import * as NotesFs from './notes-fs'

/**
 * Opens the interlink under the user's current cursor position in the active editor.
 * @return {Promise} The `workspace.open()` if there is an interlink, otherwise undefined.
 */
export function openInterlink () {
  const editor = atom.workspace.getActiveTextEditor()
  // We used to only support interlinks between notes files, but that seems needlessly restrictive.
  // if (!__guard__(editor, x => NotesFs.isNote(editor.getPath()))) return undefined

  const noteTitle = getInterlinkTitle(editor)
  if (!__guard__(noteTitle, x => noteTitle.length > 0)) return undefined

  const notePath = NotesFs.notePathForTitle(noteTitle)
  if (!__guard__(notePath, x => x)) return undefined

  try {
    const fs = require('fs-plus')
    if (!fs.existsSync(notePath)) {
      fs.writeFileSync(notePath, '')
    }
    return atom.workspace.open(notePath)
  } catch (e) {
    atom.notifications.addError(`Failed to create new note "${noteTitle}"`, {
      detail: e.message,
      dismissable: true
    })
    return undefined
  }
}

/**
 * Gets the title of the interlink under the user's current cursor position.
 * @param  {TextEditor} editor Within the given editor.
 * @return {String}            The title of the interlink sans wrapping braces.
 */
export function getInterlinkTitle (editor) {
  if (!__guard__(editor, x => x)) return null

  const pos = editor.getCursorBufferPosition()

  let lhs
  editor.buffer.backwardsScanInRange(/\[\[[^[]*/, [pos, 0], (match) => {
    lhs = match.range.start.column
    match.stop()
  })
  if (lhs === undefined) return null

  let rhs
  const rowRange = editor.buffer.rangeForRow(pos.row)
  editor.buffer.scanInRange(/[^]]*]]/, [pos, rowRange.end],
    (match) => {
      rhs = match.range.end.column
      match.stop()
    })
  if (rhs === undefined) return null

  let title
  editor.buffer.scanInRange(/\[\[[^|]+?]]/, [[pos.row, lhs], [pos.row, rhs]],
    (match) => {
      title = match.matchText.replace(/^\[*/, '').replace(/]*$/, '').trim()
    })
  if (title === undefined || title === '') return null

  return title
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
