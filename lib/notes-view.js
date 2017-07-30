/** @babel */

import DocQuery from 'docquery'

import * as Utility from './utility'
import NotesViewList from './notes-view-list'

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
  }

  isVisible () {
    return this.panel.isVisible()
  }

  show () {
    this.previousFocus = document.activeElement
    this.list.selectList.selectNone()
    this.panel.show()
    this.list.selectList.focus()
  }

  hide () {
    this.panel.hide()
  }

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
