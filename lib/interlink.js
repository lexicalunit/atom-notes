'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openInterlink = openInterlink;
exports.getInterlinkTitle = getInterlinkTitle;

var _notesFs = require('./notes-fs');

var NotesFs = _interopRequireWildcard(_notesFs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Opens the interlink under the user's current cursor position in the active editor.
 * @return {Promise} The `workspace.open()` if there is an interlink, otherwise undefined.
 */
function openInterlink() {
  var editor = atom.workspace.getActiveTextEditor();
  if (!__guard__(editor, function (x) {
    return NotesFs.isNote(editor.getPath());
  })) return undefined;

  var noteTitle = getInterlinkTitle(editor);
  if (!__guard__(noteTitle, function (x) {
    return noteTitle.length > 0;
  })) return undefined;

  var notePath = NotesFs.notePathForTitle(noteTitle);
  if (!__guard__(notePath, function (x) {
    return x;
  })) return undefined;

  try {
    var fs = require('fs-plus');
    if (!fs.existsSync(notePath)) {
      fs.writeFileSync(notePath, '');
    }
    return atom.workspace.open(notePath);
  } catch (e) {
    atom.notifications.addError('Failed to create new note "' + noteTitle + '"', {
      detail: e.message,
      dismissable: true
    });
    return undefined;
  }
}

/**
 * Gets the title of the interlink under the user's current cursor position.
 * @param  {TextEditor} editor Within the given editor.
 * @return {String}            The title of the interlink sans wrapping braces.
 */
/** @babel */

function getInterlinkTitle(editor) {
  if (!__guard__(editor, function (x) {
    return x;
  })) return null;

  var pos = editor.getCursorBufferPosition();
  var token = editor.tokenForBufferPosition(pos);
  if (!__guard__(token, function (x) {
    return token.value;
  })) return null;

  // support for language-atom-notes
  if (token.scopes.includes('source.gfm.notes')) {
    if (token.value === '[[' || token.value === ']]') return null;
    if (!token.scopes.includes('interlink')) return null;
    var _text = __guard__(token.value, function (x) {
      return x.trim();
    });
    if (__guard__(_text, function (x) {
      return x.length <= 0;
    })) return null;
    return _text;
  }

  var text = token.value;
  if (text.length < 5) return null;

  var found = void 0;

  var lhs = pos.column;
  found = false;
  while (lhs >= 2 && !found) {
    var _token = text.slice(lhs - 2, lhs);
    if (_token === '[[') found = true;else if (_token === ']]' || _token.includes('|')) return null;else lhs -= 1;
  }
  if (!found) return null;

  var rhs = pos.column;
  found = false;
  while (rhs <= text.length - 2 && !found) {
    var _token2 = text.slice(rhs, rhs + 2);
    if (_token2 === ']]') {
      found = true;
    } else if (_token2 === '[[' || _token2.includes('|')) return null;else rhs += 1;
  }
  if (!found) return null;

  var title = text.substring(lhs, rhs).trim();
  if (title) return title;else return null;
}

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}