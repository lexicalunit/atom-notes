/** @babel */

import * as NotesFs from './notes-fs'

export function openInterlink () {
  const editor = atom.workspace.getActiveTextEditor()
  if (!__guard__(editor, x => NotesFs.isNote(editor.getPath()))) return undefined

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

export function getInterlinkTitle (editor) {
  if (!__guard__(editor, x => x)) return null

  const pos = editor.getCursorBufferPosition()
  const token = editor.tokenForBufferPosition(pos)
  if (!__guard__(token, x => token.value)) return null

  const text = token.value
  if (text.length < 5) return null

  let found

  let lhs = pos.column
  found = false
  while (lhs >= 2 && !found) {
    const token = text.slice(lhs - 2, lhs)
    if (token === '[[') found = true
    else if (token === ']]' || token.includes('|')) return null
    else lhs -= 1
  }
  if (!found) return null

  let rhs = pos.column
  found = false
  while (rhs <= text.length - 2 && !found) {
    const token = text.slice(rhs, rhs + 2)
    if (token === ']]') {
      found = true
    } else if (token === '[[' || token.includes('|')) return null
    else rhs += 1
  }
  if (!found) return null

  const title = text.substring(lhs, rhs).trim()
  if (title) return title
  else return null
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
