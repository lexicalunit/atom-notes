'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** Default file extension for notes. */
/** @babel */

var defaultNoteExtension = '.md';

exports.default = {
  /**
   * Get the root directory for notes archival.
   * @return {String} Normalized path.
   */
  getNotesDirectory: function getNotesDirectory() {
    return _fsPlus2.default.normalize(atom.config.get('atom-notes.directory'));
  },


  /**
   * Returns the default file extension for newly created notes.
   * @return {String} For example ".md".
   */
  getPrimaryNoteExtension: function getPrimaryNoteExtension() {
    var extensions = atom.config.get('atom-notes.extensions');
    if (extensions.length > 0) return extensions[0];
    return defaultNoteExtension;
  },


  /**
   * Returns the intended path on your filesystem for a note with the given title.
   * @param  {String} title The note's title sans file-extension.
   * @return {String}       Full normalized path within your notes directory.
   */
  notePathForTitle: function notePathForTitle(title) {
    if (!__guard__(title, function (x) {
      return x;
    })) return null;
    return _path2.default.join(this.getNotesDirectory(), title.trim() + this.getPrimaryNoteExtension());
  },


  /**
   * Opens a note for the given title in Atom; creates one if it doesn't exist already.
   * @param  {String} title The note's title sans file-extension.
   */
  openNote: function openNote(title) {
    var destination = this.notePathForTitle(title);
    if (!__guard__(title, function (x) {
      return x;
    })) return;
    try {
      if (!_fsPlus2.default.existsSync(destination)) {
        _fsPlus2.default.writeFileSync(destination, '');
      }
      atom.workspace.open(destination);
    } catch (e) {
      atom.notifications.addError('Failed to open note "' + title + '"', {
        detail: e.message,
        dismissable: true
      });
    }
  },


  /**
   * Returns true iff the given file path is a note.
   * @param  {String}  filePath Any valid file path.
   * @return {Boolean}
   */
  isNote: function isNote(filePath) {
    if (!filePath) return false;
    var normalPath = _fsPlus2.default.normalize(filePath);
    // if (!fs.existsSync(normalPath)) return false // NOTE: Not necessary!

    var extensions = atom.config.get('atom-notes.extensions');
    var ext = _path2.default.extname(filePath.toString());
    if (!extensions.includes(ext)) return false;

    var notesDirectory = this.getNotesDirectory();
    if (normalPath.startsWith(notesDirectory)) return true;

    // support symlinks
    try {
      var realNotesDirectory = _fsPlus2.default.realpathSync(notesDirectory);
      if (normalPath.startsWith(realNotesDirectory)) return true;

      var syncPath = _fsPlus2.default.realpathSync(normalPath);
      if (syncPath.startsWith(notesDirectory)) return true;
      if (syncPath.startsWith(realNotesDirectory)) return true;
    } catch (e) {
      if (e.code === 'ENOENT') return false;
      throw e;
    }

    return false;
  }
};


function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}