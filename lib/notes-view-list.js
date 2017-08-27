/** @babel */

import * as fp from 'fuzzaldrin-plus'
import * as TimSort from 'timsort'
import SelectList from 'atom-select-list'

import * as NotesFs from './notes-fs'
import NotesViewListItem from './notes-view-list-item'

let autocompleteTimeout

/**
  * @typedef DocumentItem
  * @type {Object}
  * @property {string} title - Title of the note.
  * @property {string} fileName - Name of the file where note is stored.
  * @property {string} filePath - Path to the file where note is stored.
  * @property {string} body - Body of the note.
  * @property {Date} modifiedAt - Date and time of last modification to the note.
  */

/**
  * @typedef Options
  * @type {Object}
  * @property {function()} [didHide] - Callback to call whenever this view is hidden.
  */

export default class NotesViewList {
  /** Builds a new notes query and list interface element.
    *
    * @param {Promise.<DocQuery>} store - The document storage for notes.
    * @param {Options} [options] - Behaviour and configuration settings.
    */
  constructor (store, options = {}) {
    store.then(dq => {
      this.dq = dq
      let reload = () => {
        if (!this.isLoaded()) return
        this.selectList.update({items: this.dq.documents})
      }
      let makeReady = () => {
        this.dq.loaded = true
        this.selectList.update({loadingMessage: null})
        reload()
        this.dq.on('added', _ => reload())
        this.dq.on('updated', _ => reload())
        this.dq.on('removed', _ => reload())
      }
      if (this.dq.loaded) makeReady()
      else this.dq.on('ready', () => makeReady())
    })
    if (options.hasOwnProperty('didHide')) {
      this.didHide = options.didHide
    }
    this.filteredItems = []
    this.selectList = new SelectList({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      elementForItem: (item) => this.elementForItem(item),
      filter: (items, query) => this.filter(items, query),
      filterQuery: (query) => this.filterQuery(query),
      didChangeQuery: (query) => this.didChangeQuery(query),
      didConfirmSelection: (item) => this.didConfirmSelection(item),
      didConfirmEmptySelection: () => this.didConfirmEmptySelection(),
      didCancelSelection: () => this.didCancelSelection()
    })
    this.selectList.element.classList.add('atom-notes')
  }

  /** Returns true iff the document storage has finished loading notes. */
  isLoaded () {
    return this.dq !== undefined && this.dq.loaded
  }

  /** Returns HTMLElement object that should represent a single DocumentItem in this view. */
  elementForItem (item) {
    return new NotesViewListItem({item: item}).element
  }

  /** Renders completion for query; if not supplied, re-render existing completion. */
  autocomplete (query = undefined) {
    if (!this.lastAutocompleteQuery) this.lastAutocompleteQuery = ''
    if (!this.isLoaded()) {
      this.lastAutocompleteQuery = ''
      return
    }
    __guard__(autocompleteTimeout, x => {
      clearTimeout(x)
      autocompleteTimeout = null
    })
    if (query) {
      this.filteredItems = fp.filter(this.dq.documents, query, {key: 'title'})
    } else {
      this.lastAutocompleteQuery = ''
      this.selectList.refs.queryEditor.selectAll()
      return
    }
    if (this.filteredItems.length <= 0) {
      this.lastAutocompleteQuery = ''
      return
    }
    autocompleteTimeout = setTimeout(() => {
      if (this.filteredItems.length <= 0) {
        this.lastAutocompleteQuery = ''
        return
      }
      const best = this.filteredItems[0]
      const q = this.selectList.getFilterQuery()
      const complete = (q !== undefined &&
                        q.length > 0 &&
                        best.title.toLowerCase().startsWith(q.toLowerCase()))
      if (complete) {
        let newQuery = q + best.title.slice(q.length)
        this.selectList.setQuery(newQuery, {doDidChangeQuery: false})
        this.selectList.refs.queryEditor.selectLeft(newQuery.length - q.length)
        this.lastAutocompleteQuery = q
      } else {
        this.lastAutocompleteQuery = ''
      }
    }, 300)
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
    return __guard__(query, x => {
      let t = x.trim()
      return x.length > 0 && x.endsWith(' ') ? t + ' ' : t
    })
  }

  /** Our override for our SelectList's didChangeQuery() callback. */
  didChangeQuery (query) {
    if (query.toLowerCase() !== this.lastAutocompleteQuery.toLowerCase()) {
      this.autocomplete(query)
    }
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
    if (this.selectList.items.length > 0) {
      atom.workspace.open(this.selectList.items[0].filePath)
    } else {
      NotesFs.openNote(title)
    }
  }

  /** Our override for our SelectList's didCancelSelection() callback. */
  didCancelSelection () {
    __guard__(autocompleteTimeout, x => {
      clearTimeout(x)
      autocompleteTimeout = null
    })
    const selectedText = this.selectList.refs.queryEditor.getSelectedText()
    if (selectedText !== '') {
      let query = this.selectList.getQuery()
      query = query.slice(0, query.length - selectedText.length)
      this.selectList.setQuery(query, {doDidChangeQuery: false})
      return
    }
    if (this.selectList.element.contains(document.activeElement)) {
      if (this.selectList.getSelectedItem()) return this.selectList.selectNone()
      __guard__(this.previousFocus, x => x.focus())
    } else {
      this.selectList.selectNone()
    }
    this.didHide()
  }

  destroy () {
    __guard__(autocompleteTimeout, x => {
      clearTimeout(x)
      autocompleteTimeout = null
    })
  }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
