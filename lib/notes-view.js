/** @babel */

import NotesViewList from './notes-view-list'

/** Provides querying for and a list of notes in our document store.
  *
  * @param {Promise.<DocQuery>} store - The documentation storage for notes.
  */
export default class NotesView {
  constructor (store) {
    this.list = new NotesViewList(store, () => this.hide())
    this.panel = atom.workspace.addModalPanel({
      item: this.list.selectList.element,
      visible: false
    })

    // Add a back-reference in the DOM to help with debugging.
    this.list.selectList.element.notes = this
  }

  /** Returns true iff the notes interface is visible to the user. */
  isVisible () {
    return this.panel.isVisible()
  }

  /** Brings up the notes view so the user can see it. */
  show () {
    this.previousFocus = document.activeElement
    this.list.selectList.selectNone()
    this.list.autocomplete()
    this.panel.show()
    this.list.selectList.focus()
  }

  /** Hids the notes view from the user's sight. */
  hide () {
    this.panel.hide()
  }

  /** Toggles between hidden and shown. */
  toggle () {
    this.isVisible() ? this.hide() : this.show()
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
