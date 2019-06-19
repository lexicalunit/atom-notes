/** @babel */

import * as fp from 'fuzzaldrin-plus'
import * as TimSort from 'timsort'
import path from 'path'

import * as NotesFs from './notes-fs'
import SelectListView from './select-list-view'

import matter from 'gray-matter'

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
  * @property {Boolean} [preview] - Set to true if document should open in markdown preview
  */

function getMarkdownPreviewUriPrefix () {
  if (atom.packages.getActivePackage('markdown-preview-plus')) return 'markdown-preview-plus://file'
  if (atom.packages.getActivePackage('markdown-preview')) return 'markdown-preview://'
  return null
}

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
        this.selectListView.update({ items: this.store.documents })
      }
      let makeReady = () => {
        this.store.loaded = true
        this.selectListView.update({ loadingMessage: null })
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
    this.selectListView = new SelectListView({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      elementForItem: item => this.elementForItem(item),
      filter: (items, query) => this.filter(items, query),
      filterQuery: query => this.filterQuery(query),
      didChangeQuery: query => this.didChangeQuery(query),
      didConfirmSelection: item => this.didConfirmSelection(item),
      didConfirmEmptySelection: () => this.didConfirmEmptySelection(),
      didCancelSelection: () => this.didCancelSelection()
    })
    this.selectListView.element.classList.add('atom-notes')
  }

  /**
   * Returns true iff the document storage has finished loading notes.
   * @return {Boolean}
   */
  isLoaded () {
    return this.store !== undefined && this.store.loaded
  }

  /**
   * Returns HTMLElement object that should represent a single document item in this view.
   * @param  {DocumentItem} item The document item to display in our list.
   * @return {HTMLElement}
   */
  elementForItem (item) {
    const query = this.selectListView.getFilterQuery()
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

    if (item.abstract != null) {
      secondary.textContent = item.abstract.slice(0, 100)
    } else {
      secondary.textContent = matter(item.body).content.slice(0, 100)
    }

    if (item.keywords && Array.isArray(item.keywords) && item.keywords.length > 0) {
      let keywords = document.createElement('div')
      keywords.classList.add('keywords')
      keywords.innerHTML = '<span class="highlight-info">' +
        item.keywords.join('</span><span class="highlight-info">') +
        '</span>'
      secondary.appendChild(keywords)
    }

    let element = document.createElement('li')
    element.classList.add('two-lines')
    element.appendChild(primary)
    element.appendChild(secondary)
    return element
  }

  /**
   * Renders completion for query; if not supplied, re-render existing completion.
   * @param {String} [query=undefined] The current search query to build autocomplete off of.
   */
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
      this.filteredItems = fp.filter(this.store.documents, query, { key: 'title' })
    } else {
      this.lastAutocompleteQuery = ''
      this.selectListView.refs.queryEditor.selectAll()
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
      const q = this.selectListView.getFilterQuery()
      const complete = (q !== undefined &&
                        q.length > 0 &&
                        best.title.toLowerCase().startsWith(q.toLowerCase()))
      if (complete) {
        let newQuery = q + best.title.slice(q.length)
        this.selectListView.update({ query: newQuery, doDidChangeQuery: false })
        this.selectListView.refs.queryEditor.selectLeft(newQuery.length - q.length)
        this.lastAutocompleteQuery = q
      } else {
        this.lastAutocompleteQuery = ''
      }
    }, 300)
  }

  /**
   * Our override for our SelectListView's filter() callback.
   * @param  {String} query The users current search query.
   * @return {DocumentItem[]}
   */
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
      items = this.store.search(query).filter(item => item !== undefined)

      if (atom.config.get('atom-notes.orderByFuzzyFileNameMatch')) {
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
    }
    // docsearch returned nothing, fallback to fuzzy finder
    if (items.length <= 0) {
      return this.filteredItems
    }
    return items
  }

  /**
   * Our override for our SelectListView's filterQuery() callback.
   * @param  {String} query The users current search query.
   * @return {String}       Sanitized version of user's query.
   */
  filterQuery (query) {
    return __guard__(query, x => {
      let t = x.trim()
      return x.length > 0 && x.endsWith(' ') ? t + ' ' : t
    })
  }

  /**
   * Our override for our SelectListView's didChangeQuery() callback.
   * @param {String} query The users current search query.
   */
  didChangeQuery (query) {
    if (query.toLowerCase() !== this.lastAutocompleteQuery.toLowerCase()) {
      this.autocomplete(query)
    }
  }

  /**
   * Our override for our SelectListView's didConfirmSelection() callback.
   * @param {DocumentItem} item The user's selected document item.
   */
  didConfirmSelection (item) {
    this.didHide()
    const markdownPreviewUriPrefix = getMarkdownPreviewUriPrefix()
    const ext = path.extname(item.filePath)
    const isMarkdown = ['.markdown', '.md'].includes(ext)
    if (this.openInPreview && isMarkdown && markdownPreviewUriPrefix) {
      atom.workspace.open(`${markdownPreviewUriPrefix}${encodeURI(item.filePath)}`)
    } else {
      atom.workspace.open(item.filePath)
    }
  }

  /**
   * Our override for our SelectListView's didConfirmEmptySelection() callback.
   */
  didConfirmEmptySelection () {
    const title = this.selectListView.getFilterQuery()
    if (title.length <= 0) return
    this.didHide()
    NotesFs.openNote(title)
  }

  /**
   * Our override for our SelectListView's didCancelSelection() callback.
   */
  didCancelSelection () {
    __guard__(autocompleteTimeout, x => {
      clearTimeout(x)
      autocompleteTimeout = null
    })

    // focus leaving atom-notes unselects any selected item and dismisses modal
    if (!this.selectListView.element.contains(document.activeElement)) {
      this.selectListView.selectNone()
      this.didHide()
      return
    }

    // cancel with a selected item unselects the item
    if (this.selectListView.getSelectedItem()) {
      this.selectListView.selectNone()
      return
    }

    // cancel with selected text unselects the text
    const selectedText = this.selectListView.refs.queryEditor.getSelectedText()
    if (selectedText !== '') {
      let query = this.selectListView.getQuery()
      query = query.slice(0, query.length - selectedText.length)
      this.selectListView.update({ query, doDidChangeQuery: false })
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

/**
 * Highlights the fuzzy-finder matching text in our search results.
 * @see    {@link https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.js#L304}
 * @param  {string}   path            The text to be highlighted.
 * @param  {Number[]} matches         Positions of matching characters.
 * @param  {Number}   [offsetIndex=0] Offset into path to begin highlighting.
 * @return {HTMLElement}              Returns a span element with highlight annotations.
 */
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
