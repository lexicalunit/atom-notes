// This is a copy of https://github.com/lexicalunit/atom-select-list/blob/lexicalunit/autocomplete/src/select-list-view.js
// until such time that atom/atom-select-list has merged the changes required to support autocomplete.
// See https://github.com/atom/atom-select-list/pulls

const {Disposable, CompositeDisposable, TextEditor} = require('atom')
const etch = require('etch')
const $ = etch.dom
const fuzzaldrin = require('fuzzaldrin-plus')

module.exports = class SelectListView {
  constructor (props) {
    this.props = props
    if (!this.props.hasOwnProperty('initialSelectionIndex')) {
      this.props.initialSelectionIndex = 0
    }
    this.computeItems(false)
    this.disposables = new CompositeDisposable()
    etch.initialize(this)
    this.element.classList.add('select-list')
    this.didChangeQueryDisposable = this.refs.queryEditor.onDidChange(this.didChangeQuery.bind(this))
    if (!props.skipCommandsRegistration) {
      this.disposables.add(this.registerAtomCommands())
    }
    const editorElement = this.refs.queryEditor.element
    const didLoseFocus = this.didLoseFocus.bind(this)
    editorElement.addEventListener('blur', didLoseFocus)
    this.disposables.add(new Disposable(() => { editorElement.removeEventListener('blur', didLoseFocus) }))
  }

  focus () {
    this.refs.queryEditor.element.focus()
  }

  didLoseFocus (event) {
    if (this.element.contains(event.relatedTarget)) {
      this.refs.queryEditor.element.focus()
    } else if (document.hasFocus()) {
      this.cancelSelection()
    }
  }

  reset () {
    this.refs.queryEditor.setText('')
  }

  setQuery (text, {selectText, doDidChangeQuery} = {}) {
    if (doDidChangeQuery === false) {
      this.didChangeQueryDisposable.dispose()
    }
    let queryEditor = this.refs.queryEditor
    queryEditor.setText(text)
    if (selectText) {
      queryEditor.selectAll()
    } else {
      let lastSel = queryEditor.getLastSelection()
      if (lastSel) {
        lastSel.clear()
      }
    }
    if (doDidChangeQuery === false) {
      this.didChangeQueryDisposable = queryEditor.onDidChange(this.didChangeQuery.bind(this))
    }
  }

  destroy () {
    this.disposables.dispose()
    this.didChangeQueryDisposable.dispose()
    return etch.destroy(this)
  }

  registerAtomCommands () {
    return global.atom.commands.add(this.element, {
      'core:move-up': (event) => {
        this.selectPrevious()
        event.stopPropagation()
      },
      'core:move-down': (event) => {
        this.selectNext()
        event.stopPropagation()
      },
      'core:move-to-top': (event) => {
        this.selectFirst()
        event.stopPropagation()
      },
      'core:move-to-bottom': (event) => {
        this.selectLast()
        event.stopPropagation()
      },
      'core:confirm': (event) => {
        this.confirmSelection()
        event.stopPropagation()
      },
      'core:cancel': (event) => {
        this.cancelSelection()
        event.stopPropagation()
      }
    })
  }

  update (props = {}) {
    let shouldComputeItems = false

    if (props.hasOwnProperty('items')) {
      this.props.items = props.items
      shouldComputeItems = true
    }

    if (props.hasOwnProperty('maxResults')) {
      this.props.maxResults = props.maxResults
      shouldComputeItems = true
    }

    if (props.hasOwnProperty('filter')) {
      this.props.filter = props.filter
      shouldComputeItems = true
    }

    if (props.hasOwnProperty('filterQuery')) {
      this.props.filterQuery = props.filterQuery
      shouldComputeItems = true
    }

    if (props.hasOwnProperty('query')) {
      // Items will be recomputed as part of the change event handler, so we
      // don't need to recompute them again at the end of this function.
      this.refs.queryEditor.setText(props.query)
      shouldComputeItems = false
    }

    if (props.hasOwnProperty('order')) {
      this.props.order = props.order
    }

    if (props.hasOwnProperty('emptyMessage')) {
      this.props.emptyMessage = props.emptyMessage
    }

    if (props.hasOwnProperty('errorMessage')) {
      this.props.errorMessage = props.errorMessage
    }

    if (props.hasOwnProperty('infoMessage')) {
      this.props.infoMessage = props.infoMessage
    }

    if (props.hasOwnProperty('loadingMessage')) {
      this.props.loadingMessage = props.loadingMessage
    }

    if (props.hasOwnProperty('loadingBadge')) {
      this.props.loadingBadge = props.loadingBadge
    }

    if (props.hasOwnProperty('itemsClassList')) {
      this.props.itemsClassList = props.itemsClassList
    }

    if (props.hasOwnProperty('initialSelectionIndex')) {
      this.props.initialSelectionIndex = props.initialSelectionIndex
    }

    if (shouldComputeItems) {
      this.computeItems()
    }

    return etch.update(this)
  }

  render () {
    return $.div(
      {},
      $(TextEditor, {ref: 'queryEditor', mini: true}),
      this.renderLoadingMessage(),
      this.renderInfoMessage(),
      this.renderErrorMessage(),
      this.renderItems()
    )
  }

  renderItems () {
    if (this.items.length > 0) {
      const className = ['list-group'].concat(this.props.itemsClassList || []).join(' ')
      return $.ol(
        {className, ref: 'items'},
        ...this.items.map((item, index) => {
          const selected = this.getSelectedItem() === item

          return $(ListItemView, {
            element: this.props.elementForItem(item, {selected, index}),
            selected,
            onclick: () => this.didClickItem(index)
          })
        })
      )
    } else if (!this.props.loadingMessage && this.props.emptyMessage) {
      return $.span({ref: 'emptyMessage'}, this.props.emptyMessage)
    } else {
      return ''
    }
  }

  renderErrorMessage () {
    if (this.props.errorMessage) {
      return $.span({ref: 'errorMessage'}, this.props.errorMessage)
    } else {
      return ''
    }
  }

  renderInfoMessage () {
    if (this.props.infoMessage) {
      return $.span({ref: 'infoMessage'}, this.props.infoMessage)
    } else {
      return ''
    }
  }

  renderLoadingMessage () {
    if (this.props.loadingMessage) {
      return $.div(
        {className: 'loading'},
        $.span({ref: 'loadingMessage', className: 'loading-message'}, this.props.loadingMessage),
        this.props.loadingBadge ? $.span({ref: 'loadingBadge', className: 'badge'}, this.props.loadingBadge) : ''
      )
    } else {
      return ''
    }
  }

  getQuery () {
    if (this.refs && this.refs.queryEditor) {
      return this.refs.queryEditor.getText()
    } else {
      return ''
    }
  }

  getFilterQuery () {
    return this.props.filterQuery ? this.props.filterQuery(this.getQuery()) : this.getQuery()
  }

  didChangeQuery () {
    if (this.props.didChangeQuery) {
      this.props.didChangeQuery(this.getFilterQuery())
    }

    this.computeItems()
  }

  didClickItem (itemIndex) {
    this.selectIndex(itemIndex)
    this.confirmSelection()
  }

  computeItems (updateComponent) {
    const filterFn = this.props.filter || this.fuzzyFilter.bind(this)
    this.items = filterFn(this.props.items.slice(), this.getFilterQuery())
    if (this.props.order) {
      this.items.sort(this.props.order)
    }
    if (this.props.maxResults) {
      this.items = this.items.slice(0, this.props.maxResults)
    }

    this.selectIndex(this.props.initialSelectionIndex, updateComponent)
  }

  fuzzyFilter (items, query) {
    if (query.length === 0) {
      return items
    } else {
      const scoredItems = []
      for (const item of items) {
        const string = this.props.filterKeyForItem ? this.props.filterKeyForItem(item) : item
        let score = fuzzaldrin.score(string, query)
        if (score > 0) {
          scoredItems.push({item, score})
        }
      }
      scoredItems.sort((a, b) => b.score - a.score)
      return scoredItems.map((i) => i.item)
    }
  }

  getSelectedItem () {
    if (this.selectionIndex === undefined) return null
    return this.items[this.selectionIndex]
  }

  selectPrevious () {
    if (this.selectionIndex === undefined) return this.selectLast()
    return this.selectIndex(this.selectionIndex - 1)
  }

  selectNext () {
    if (this.selectionIndex === undefined) return this.selectFirst()
    return this.selectIndex(this.selectionIndex + 1)
  }

  selectFirst () {
    return this.selectIndex(0)
  }

  selectLast () {
    return this.selectIndex(this.items.length - 1)
  }

  selectNone () {
    return this.selectIndex(undefined)
  }

  selectIndex (index, updateComponent = true) {
    if (index >= this.items.length) {
      index = 0
    } else if (index < 0) {
      index = this.items.length - 1
    }

    this.selectionIndex = index
    if (index !== undefined && this.props.didChangeSelection) {
      this.props.didChangeSelection(this.getSelectedItem())
    }

    if (updateComponent) {
      return etch.update(this)
    } else {
      return Promise.resolve()
    }
  }

  selectItem (item) {
    const index = this.items.indexOf(item)
    if (index === -1) {
      throw new Error('Cannot select the specified item because it does not exist.')
    } else {
      return this.selectIndex(index)
    }
  }

  confirmSelection () {
    const selectedItem = this.getSelectedItem()
    if (selectedItem != null) {
      if (this.props.didConfirmSelection) {
        this.props.didConfirmSelection(selectedItem)
      }
    } else {
      if (this.props.didConfirmEmptySelection) {
        this.props.didConfirmEmptySelection()
      }
    }
  }

  cancelSelection () {
    if (this.props.didCancelSelection) {
      this.props.didCancelSelection()
    }
  }
}

class ListItemView {
  constructor (props) {
    this.mouseDown = this.mouseDown.bind(this)
    this.mouseUp = this.mouseUp.bind(this)
    this.didClick = this.didClick.bind(this)
    this.selected = props.selected
    this.onclick = props.onclick
    this.element = props.element
    this.element.addEventListener('mousedown', this.mouseDown)
    this.element.addEventListener('mouseup', this.mouseUp)
    this.element.addEventListener('click', this.didClick)
    if (this.selected) {
      this.element.classList.add('selected')
    }
    this.domEventsDisposable = new Disposable(() => {
      this.element.removeEventListener('mousedown', this.mouseDown)
      this.element.removeEventListener('mouseup', this.mouseUp)
      this.element.removeEventListener('click', this.didClick)
    })
    etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this))
  }

  mouseDown (event) {
    event.preventDefault()
  }

  mouseUp (event) {
    event.preventDefault()
  }

  didClick (event) {
    event.preventDefault()
    this.onclick()
  }

  destroy () {
    this.element.remove()
    this.domEventsDisposable.dispose()
  }

  update (props) {
    this.element.removeEventListener('mousedown', this.mouseDown)
    this.element.removeEventListener('mouseup', this.mouseUp)
    this.element.removeEventListener('click', this.didClick)

    this.element.parentNode.replaceChild(props.element, this.element)
    this.element = props.element
    this.element.addEventListener('mousedown', this.mouseDown)
    this.element.addEventListener('mouseup', this.mouseUp)
    this.element.addEventListener('click', this.didClick)
    if (props.selected) {
      this.element.classList.add('selected')
    }

    this.selected = props.selected
    this.onclick = props.onclick
    etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this))
  }

  scrollIntoViewIfNeeded () {
    if (this.selected) {
      this.element.scrollIntoViewIfNeeded()
    }
  }
}
