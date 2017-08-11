/** @babel */

import * as fp from 'fuzzaldrin-plus'
import * as TimSort from 'timsort'
import SelectList from 'atom-select-list'

import * as Utility from './utility'
import NotesViewListItem from './notes-view-list-item'

let autocompleteTimeout
let autocompleteElement
let loaded = false

function getEditorLine (selectList) {
  const editor = selectList.refs.queryEditor
  return editor.element.querySelector('.line')
}

/**
  * @typedef DocumentItem
  * @type {Object}
  * @property {string} title - Title of the note.
  * @property {string} fileName - Name of the file where note is stored.
  * @property {string} filePath - Path to the file where note is stored.
  * @property {string} body - Body of the note.
  * @property {Date} modifiedAt - Date and time of last modification to the note.
  */

export default class NotesViewList {
  /** Builds a new notes query and list interface element.
    *
    * @param {DocQuery} store - Our documentation storeage for out notes.
    * @param {function()} didHide - Callback to call whenever this view is hidden.
    */
  constructor (store, didHide) {
    this.dq = store
    this.didHide = didHide
    this.filteredItems = []
    this.selectList = new SelectList({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      elementForItem: (item) => this.elementForItem(item),
      filter: (items, query) => this.filter(items, query),
      filterQuery: (query) => this.filterQuery(query),
      didChangeSelection: (item) => this.didChangeSelection(item),
      didChangeQuery: (query) => this.didChangeQuery(query),
      didConfirmSelection: (item) => this.didConfirmSelection(item),
      didConfirmEmptySelection: () => this.didConfirmEmptySelection(),
      didCancelSelection: () => this.didCancelSelection()
    })
    this.selectList.element.classList.add(Utility.packageName)

    let reload = () => {
      if (!this.isLoaded()) return
      this.selectList.update({items: this.dq.documents})
    }
    this.dq.on('ready', () => {
      loaded = true
      this.selectList.update({loadingMessage: null})
      reload()
    })
    this.dq.on('added', _ => reload())
    this.dq.on('updated', _ => reload())
    this.dq.on('removed', _ => reload())
  }

  /** Returns true iff the document storage has finished loading notes. */
  isLoaded () {
    return loaded
  }

  /** Returns true iff there is an autocompletion for the current query. */
  hasAutocomplete () {
    return (autocompleteElement &&
            getEditorLine(this.selectList).contains(autocompleteElement) &&
            autocompleteElement.style.display !== 'none')
  }

  /** Returns HTMLElement object that should represent a single DocumentItem in this view. */
  elementForItem (item) {
    return new NotesViewListItem({item: item}).element
  }

  /** Renders completion for query; if not supplied, re-render existing completion. */
  autocomplete (query = undefined) {
    __guard__(autocompleteTimeout, x => clearTimeout(x))
    if (query) {
      this.filteredItems = fp.filter(this.dq.documents, query, {key: 'title'})
    }
    if (this.filteredItems.length <= 0) return
    autocompleteTimeout = setTimeout(() => {
      if (this.filteredItems.length <= 0) return
      const best = this.filteredItems[0]
      const q = this.selectList.getFilterQuery()
      if (q !== undefined && q.length <= 0) {
        if (this.hasAutocomplete()) {
          autocompleteElement.style.display = 'none'
        }
      } else if (best.title.toLowerCase().startsWith(q.toLowerCase())) {
        let line = getEditorLine(this.selectList)
        let rest = best.title.substr(q.length, best.title.length - q.length)
        autocompleteElement = document.createElement('span')
        autocompleteElement.classList.add('atom-notes-autocomplete')
        autocompleteElement.innerHTML = rest
        line.appendChild(autocompleteElement)
      }
    }, 100)
  }

  /** Our override for our SelectList's filter() callback. */
  filter (_, query) {
    let items = []
    if (!this.isLoaded()) return items
    if (query === undefined || query.length <= 0) {
      items = this.dq.documents
      TimSort.sort(items, (lhs, rhs) => {
        if (lhs.modifiedAt > rhs.modifiedAt) return -1
        else if (lhs.modifiedAt < rhs.modifiedAt) return 1
        return 0
      })
    } else {
      items = this.dq.search(query)
      TimSort.sort(items, (lhs, rhs) => {
        if (query.length > 0) {
          const li = fp.score(lhs.title, query)
          const ri = fp.score(rhs.title, query)
          if (li > ri) return -1
          else if (li < ri) return 1
          return 0
        }
      })
    }
    return items
  }

  /** Our override for our SelectList's filterQuery() callback. */
  filterQuery (query) {
    return __guard__(query, x => x.trim())
  }

  /** Our override for our SelectList's didChangeSelection() callback. */
  didChangeSelection (item) {
    if (item && this.hasAutocomplete()) {
      autocompleteElement.style.display = 'none'
    }
  }

  /** Our override for our SelectList's didChangeQuery() callback. */
  didChangeQuery (query) {
    this.autocomplete(query)
  }

  /** Our override for our SelectList's didConfirmSelection() callback. */
  didConfirmSelection (item) {
    this.didHide()
    atom.workspace.open(item.filePath)
  }

  /** Our override for our SelectList's didConfirmEmptySelection() callback. */
  didConfirmEmptySelection () {
    const title = this.selectList.getFilterQuery()
    if (title.length <= 0) return

    this.didHide()
    if (this.hasAutocomplete() && this.selectList.items.length > 0) {
      atom.workspace.open(this.selectList.items[0].filePath)
    } else {
      Utility.createNote(title)
    }
  }

  /** Our override for our SelectList's didCancelSelection() callback. */
  didCancelSelection () {
    if (this.selectList.getSelectedItem()) return this.selectList.selectNone()
    if (this.hasAutocomplete()) return (autocompleteElement.style.display = 'none')
    this.didHide()
    __guard__(this.previousFocus, x => x.focus())
  }

  destroy () {
    __guard__(autocompleteTimeout, x => clearTimeout(x))
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
