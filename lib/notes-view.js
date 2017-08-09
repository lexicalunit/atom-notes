/** @babel */

import DocQuery from 'docquery'

import * as Utility from './utility'
import NotesViewList from './notes-view-list'

/** Provides quering for and a list of notes in our document store. */
export default class NotesView {
  constructor () {
    this.dq = new DocQuery(Utility.getNotesDirectory(), {
      recursive: true,
      extensions: atom.config.get(`${Utility.packageName}.extensions`)
    })
    this.list = new NotesViewList(this.dq, () => this.hide())
    if (!atom.config.get(`${Utility.packageName}.useLunrPipeline`)) {
      this.dq.searchIndex.pipeline.reset()
    }
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
