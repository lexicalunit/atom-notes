/** @babel */

import DocQuery from 'docquery'
import SelectList from 'atom-select-list'

import * as Utility from './utility'
import NotesViewItem from './notes-view-item'

export default class NotesView {
  constructor () {
    let extensions = atom.config.get(`${Utility.packageName}.extensions`)
    let useLunrPipeline = atom.config.get(`${Utility.packageName}.useLunrPipeline`)

    // DocQuery
    this._loaded = false
    this.dq = new DocQuery(Utility.getNotesDirectory(), {
      recursive: true,
      extensions: extensions
    })
    this.dq.on('ready', () => {
      this._loaded = true
      this.view.update({loadingMessage: null})
      this.update()
    })
    this.dq.on('added', _ => this.update())
    this.dq.on('updated', _ => this.update())
    this.dq.on('removed', _ => this.update())
    if (!useLunrPipeline) {
      this.dq.searchIndex.pipeline.reset()
    }

    // SelectList Modal
    this.view = new SelectList({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      didConfirmSelection: (item) => this.confirm(item),
      didConfirmEmptySelection: () => {
        const title = this.view.getFilterQuery()
        if (title.length <= 0) return
        this.hide()
        Utility.createNote(title)
      },
      elementForItem: (item) => this.elementForItem(item),
      filter: (items, query) => this.filter(items, query),
      filterQuery: (query) => __guard__(query, x => x.trim()),
      didCancelSelection: () => {
        this.hide()
        __guard__(this.previousFocus, x => x.focus())
      }
    })
    this.view.element.classList.add(Utility.packageName)
    this.panel = atom.workspace.addModalPanel({
      item: this.view.element,
      visible: false
    })
  }

  isLoaded () {
    return this._loaded
  }

  elementForItem (item) {
    return new NotesViewItem({item: item}).element
  }

  toggle () {
    this.isVisible() ? this.hide() : this.show()
  }

  isVisible () {
    return this.panel.isVisible()
  }

  show () {
    this.previousFocus = document.activeElement
    this.view.selectNone()
    this.panel.show()
    this.view.focus()
  }

  hide () {
    this.panel.hide()
  }

  filter (_, query) {
    if (!this.isLoaded()) return []
    if (query === '' || query === undefined) return this.dq.documents
    return this.dq.search(query)
  }

  update () {
    if (!this.isLoaded()) return
    this.view.update({items: this.dq.documents})
  }

  confirm (item) {
    this.hide()
    atom.workspace.open(item.filePath)
  }

  destroy () {
    __guard__(this.view, x => x.destroy())
    this.view = null
    __guard__(this.panel, x => x.destroy())
    this.panel = null
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
