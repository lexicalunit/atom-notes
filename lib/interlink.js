/** @babel */

// Lazy load requirements to lessen package load time.
let _fs = null
function getFs () {
  if (_fs === null) _fs = require('fs-plus')
  return _fs
}

import Utility from './utility'

export function openInterlink () {
  const editor = atom.workspace.getActiveTextEditor()
  if (editor === null || !Utility.isNote(editor.getPath())) return undefined

  const noteTitle = getInterlinkText(editor)
  if (noteTitle === null || noteTitle.length <= 0) return undefined

  const notePath = Utility.notePathForTitle(noteTitle)
  const fs = getFs()
  if (!fs.existsSync(notePath)) {
    fs.writeFileSync(notePath, '')
  }
  return atom.workspace.open(notePath)
}

export function getInterlinkText (editor) {
  if (editor === null) return null

  const token = editor.tokenForBufferPosition(editor.getCursorBufferPosition())
  if (!token || !token.value) return null
  if (token.scopes.indexOf('markup.underline.link.interlink.gfm') <= -1) return null

  const text = __guard__(token.value, x => x.trim())
  if (!text || text.length <= 0) return null
  return text
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
