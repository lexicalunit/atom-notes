/** @babel */

import * as fp from 'fuzzaldrin-plus'
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

function privateAutocomplete (query) {
  __guard__(autocompleteTimeout, x => clearTimeout(x))
  const results = fp.filter(this.dq.documents, query, {key: 'title'})
  if (results.length <= 0) return
  const best = results[0]
  autocompleteTimeout = setTimeout(() => {
    if (best.title.toLowerCase().startsWith(this.selectList.getFilterQuery().toLowerCase())) {
      let line = getEditorLine(this.selectList)
      let rest = best.title.substr(query.length, best.title.length - query.length)
      autocompleteElement = document.createElement('span')
      autocompleteElement.classList.add('atom-notes-autocomplete')
      autocompleteElement.innerHTML = rest
      line.appendChild(autocompleteElement)
    }
  }, 100)
}

export default class NotesViewList {
  constructor (docquery, didHide) {
    this.dq = docquery
    this.didHide = didHide
    this.selectList = new SelectList({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      elementForItem: (item) => this.elementForItem(item),
      filter: (items, query) => this.filter(items, query),
      filterQuery: (query) => this.filterQuery(query),
      order: (lhsItem, rhsItem) => this.order(lhsItem, rhsItem),
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

  isLoaded () {
    return loaded
  }

  hasAutocomplete () {
    return autocompleteElement && getEditorLine(this.selectList).contains(autocompleteElement)
  }

  elementForItem (item) {
    return new NotesViewListItem({item: item}).element
  }

  filter (items, query) {
    if (!this.isLoaded()) return []
    if (query === '' || query === undefined) return this.dq.documents
    return this.dq.search(query)
  }

  filterQuery (query) {
    return __guard__(query, x => x.trim())
  }

  order (lhsItem, rhsItem) {
    const query = this.selectList.getFilterQuery()
    const lhs = fp.score(lhsItem.title, query)
    const rhs = fp.score(rhsItem.title, query)
    if (lhs > rhs) return -1
    else if (lhs < rhs) return 1
    return 0
  }

  didChangeSelection (item) {
    if (item && this.hasAutocomplete()) {
      autocompleteElement.remove()
    }
  }

  didChangeQuery (query) {
    privateAutocomplete.bind(this)(query)
  }

  didConfirmSelection (item) {
    this.didHide()
    atom.workspace.open(item.filePath)
  }

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

  didCancelSelection () {
    if (this.selectList.getSelectedItem()) return this.selectList.selectNone()
    if (this.hasAutocomplete()) return autocompleteElement.remove()
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
