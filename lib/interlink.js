/** @babel */

import Utility from './utility'

export function openInterlink () {
  const editor = atom.workspace.getActiveTextEditor()
  if (!__guard__(editor, x => Utility.isNote(editor.getPath()))) return undefined

  const noteTitle = getInterlinkText(editor)
  if (!__guard__(noteTitle, x => noteTitle.length > 0)) return undefined

  const notePath = Utility.notePathForTitle(noteTitle)
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

export function getInterlinkText (editor) {
  if (!__guard__(editor, x => x)) return null

  const pos = editor.getCursorBufferPosition()
  const token = editor.tokenForBufferPosition(pos)
  if (!__guard__(token, x => token.value)) return null
  if (!token.scopes.includes('source.gfm.notes')) return null
  if (token.value === '[[' || token.value === ']]') return null
  if (!token.scopes.includes('interlink')) return null

  const text = __guard__(token.value, x => x.trim())
  if (__guard__(text, x => x.length <= 0)) return null
  return text
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
