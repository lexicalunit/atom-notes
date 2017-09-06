/** @babel */

import * as fp from 'fuzzaldrin-plus'
import * as TimSort from 'timsort'
import SelectList from 'atom-select-list'

import * as NotesFs from './notes-fs'

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
    * @param {Promise.<NotesStore>} storePromise - The document storage for notes.
    * @param {Options} [options] - Behaviour and configuration settings.
    */
  constructor (storePromise, options = {}) {
    storePromise.then(store => {
      this.store = store
      let reload = () => {
        if (!this.isLoaded()) return
        this.selectList.update({items: this.store.documents})
      }
      let makeReady = () => {
        this.store.loaded = true
        this.selectList.update({loadingMessage: null})
        reload()
        this.store.on('added', _ => reload())
        this.store.on('updated', _ => reload())
        this.store.on('removed', _ => reload())
      }
      if (this.store.loaded) makeReady()
      else this.store.on('ready', () => makeReady())
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
    return this.store !== undefined && this.store.loaded
  }

  /** Returns HTMLElement object that should represent a single DocumentItem in this view. */
  elementForItem (item) {
    const query = this.selectList.getFilterQuery()
    const matches = fp.match(item.title, query)

    let primary = document.createElement('div')
    primary.classList.add('primary-line')
    primary.appendChild(highlight(item.title, matches))

    let metadata = document.createElement('div')
    metadata.classList.add('metadata')
    metadata.textContent = item.modifiedAt.toLocaleDateString()
    primary.appendChild(metadata)

    let secondary = document.createElement('div')
    secondary.classList.add('secondary-line')
    secondary.textContent = item.body.slice(0, 100)

    let element = document.createElement('li')
    element.classList.add('two-lines')
    element.appendChild(primary)
    element.appendChild(secondary)
    return element
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
      this.filteredItems = fp.filter(this.store.documents, query, {key: 'title'})
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
      items = this.store.documents
      TimSort.sort(items, (lhs, rhs) => {
        if (lhs.modifiedAt > rhs.modifiedAt) return -1
        else if (lhs.modifiedAt < rhs.modifiedAt) return 1
        return 0
      })
    } else {
      items = this.store.search(query)
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
    // docsearch returned nothing, fallback to fuzzy finder
    if (items.length <= 0) {
      return this.filteredItems
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
    if (this.selectList.items.length > 0 &&
        this.selectList.items[0].title.toLowerCase().startsWith(title)) {
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

    // focus leaving atom-notes unselects any selected item and dismisses modal
    if (!this.selectList.element.contains(document.activeElement)) {
      this.selectList.selectNone()
      this.didHide()
      return
    }

    // cancel with a selected item unselects the item
    if (this.selectList.getSelectedItem()) {
      this.selectList.selectNone()
      return
    }

    // cancel with selected text unselects the text
    const selectedText = this.selectList.refs.queryEditor.getSelectedText()
    if (selectedText !== '') {
      let query = this.selectList.getQuery()
      query = query.slice(0, query.length - selectedText.length)
      this.selectList.setQuery(query, {doDidChangeQuery: false})
      return
    }

    // cancel with no selected item and no selected text dismisses the modal
    __guard__(this.previousFocus, x => x.focus())
    this.didHide()
  }

  destroy () {
    __guard__(autocompleteTimeout, x => {
      clearTimeout(x)
      autocompleteTimeout = null
    })
  }
}

// Taken from https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.js#L304
function highlight (path, matches, offsetIndex = 0) {
  // guard against case where there's nothing to highlight
  if (!path || path.length <= 0) return document.createTextNode(path)
  if (!matches || matches.length <= 0) return document.createTextNode(path)

  let lastIndex = 0
  let matchedChars = []
  const fragment = document.createDocumentFragment()
  for (let matchIndex of matches) {
    matchIndex -= offsetIndex
    // If marking up the basename, omit path matches
    if (matchIndex < 0) {
      continue
    }
    const unmatched = path.substring(lastIndex, matchIndex)
    if (unmatched) {
      if (matchedChars.length > 0) {
        const span = document.createElement('span')
        span.classList.add('character-match')
        span.textContent = matchedChars.join('')
        fragment.appendChild(span)
        matchedChars = []
      }

      fragment.appendChild(document.createTextNode(unmatched))
    }

    matchedChars.push(path[matchIndex])
    lastIndex = matchIndex + 1
  }

  if (matchedChars.length > 0) {
    const span = document.createElement('span')
    span.classList.add('character-match')
    span.textContent = matchedChars.join('')
    fragment.appendChild(span)
  }

  // Remaining characters are plain text
  fragment.appendChild(document.createTextNode(path.substring(lastIndex)))
  return fragment
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null)
    ? transform(value)
    : undefined
}
