'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @babel */

var _notesViewList = require('./notes-view-list');

var _notesViewList2 = _interopRequireDefault(_notesViewList);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NotesView = function () {
  /**
   * Provides querying for and a list of notes in our document store.
   * @param {Promise.<NotesStore>} storePromise Document storage for notes.
   */
  function NotesView(storePromise) {
    var _this = this;

    _classCallCheck(this, NotesView);

    this.list = new _notesViewList2.default(storePromise, { didHide: function didHide() {
        return _this.hide();
      } });
    this.panel = atom.workspace.addModalPanel({
      item: this.list.selectListView.element,
      visible: false
    });

    // Add a back-reference in the DOM to help with debugging.
    this.list.selectListView.element.notes = this;
  }

  /**
   * Returns true iff the notes interface is visible to the user.
   * @return {Boolean}
   */


  _createClass(NotesView, [{
    key: 'isVisible',
    value: function isVisible() {
      return this.panel.isVisible();
    }

    /**
     * Brings up the notes view so the user can see it.
     */

  }, {
    key: 'show',
    value: function show() {
      this.previousFocus = document.activeElement;
      this.list.selectListView.selectNone();
      this.list.autocomplete();
      this.panel.show();
      this.list.selectListView.focus();
    }

    /**
     * Hids the notes view from the user's sight.
     */

  }, {
    key: 'hide',
    value: function hide() {
      this.panel.hide();
    }

    /**
     * Toggles between hidden and shown.
     */

  }, {
    key: 'toggle',
    value: function toggle() {
      this.isVisible() ? this.hide() : this.show();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      __guard__(this.list, function (x) {
        return x.destroy();
      });
      this.list = null;
      __guard__(this.panel, function (x) {
        return x.destroy();
      });
      this.panel = null;
    }
  }]);

  return NotesView;
}();

exports.default = NotesView;


function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}