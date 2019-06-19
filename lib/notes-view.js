/** @babel */

import NotesViewList from './notes-view-list'

export default class NotesView {
  /**
   * Provides querying for and a list of notes in our document store.
   * @param {Promise.<NotesStore>} storePromise Document storage for notes.
   */
  constructor (storePromise) {
    this.list = new NotesViewList(storePromise, { didHide: () => this.hide() })
    this.panel = atom.workspace.addModalPanel({
      item: this.list.selectListView.element,
      visible: false
    })

    // Add a back-reference in the DOM to help with debugging.
    this.list.selectListView.element.notes = this
  }

  /**
   * Returns true iff the notes interface is visible to the user.
   * @return {Boolean}
   */
  isVisible () {
    return this.panel.isVisible()
  }

  /**
   * Brings up the notes view so the user can see it.
   * @param {Object} options:
   *   - preview {Boolean}: Open file in editor or preview iff true.
   */
  show (options) {
    this.previousFocus = document.activeElement
    this.list.openInPreview = (options && options.preview === true)
    this.list.selectListView.selectNone()
    this.list.autocomplete()
    this.panel.show()
    this.list.selectListView.focus()
  }

  /**
   * Hides the notes view from the user's sight.
   */
  hide () {
    this.panel.hide()
  }

  /**
   * Toggles between hidden and shown.
   * @param {Object} options:
   *   - preview {Boolean}: Open file in editor or preview iff true.
   */
  toggle (options = { preview: false }) {
    this.isVisible() ? this.hide() : this.show(options)
  }

  destroy () {
    __guard__(this.list, x => x.destroy())
    this.list = null
    __guard__(this.panel, x => x.destroy())
    this.panel = null
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
