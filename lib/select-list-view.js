'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// This is a copy of https://github.com/lexicalunit/atom-select-list/blob/lexicalunit/autocomplete/src/select-list-view.js
// until such time that atom/atom-select-list has merged the changes required to support autocomplete.
// See https://github.com/atom/atom-select-list/pulls

var _require = require('atom'),
    Disposable = _require.Disposable,
    CompositeDisposable = _require.CompositeDisposable,
    TextEditor = _require.TextEditor;

var etch = require('etch');
var $ = etch.dom;
var fuzzaldrin = require('fuzzaldrin-plus');

module.exports = function () {
  function SelectListView(props) {
    _classCallCheck(this, SelectListView);

    this.props = props;
    if (!this.props.hasOwnProperty('initialSelectionIndex')) {
      this.props.initialSelectionIndex = 0;
    }
    this.computeItems(false);
    this.disposables = new CompositeDisposable();
    etch.initialize(this);
    this.element.classList.add('select-list');
    this.didChangeQueryDisposable = this.refs.queryEditor.onDidChange(this.didChangeQuery.bind(this));
    if (!props.skipCommandsRegistration) {
      this.disposables.add(this.registerAtomCommands());
    }
    var editorElement = this.refs.queryEditor.element;
    var didLoseFocus = this.didLoseFocus.bind(this);
    editorElement.addEventListener('blur', didLoseFocus);
    this.disposables.add(new Disposable(function () {
      editorElement.removeEventListener('blur', didLoseFocus);
    }));
  }

  _createClass(SelectListView, [{
    key: 'focus',
    value: function focus() {
      this.refs.queryEditor.element.focus();
    }
  }, {
    key: 'didLoseFocus',
    value: function didLoseFocus(event) {
      if (this.element.contains(event.relatedTarget)) {
        this.refs.queryEditor.element.focus();
      } else if (document.hasFocus()) {
        this.cancelSelection();
      }
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.refs.queryEditor.setText('');
    }
  }, {
    key: 'setQuery',
    value: function setQuery(text) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          selectText = _ref.selectText,
          doDidChangeQuery = _ref.doDidChangeQuery;

      if (doDidChangeQuery === false) {
        this.didChangeQueryDisposable.dispose();
      }
      var queryEditor = this.refs.queryEditor;
      queryEditor.setText(text);
      if (selectText) {
        queryEditor.selectAll();
      } else {
        var lastSel = queryEditor.getLastSelection();
        if (lastSel) {
          lastSel.clear();
        }
      }
      if (doDidChangeQuery === false) {
        this.didChangeQueryDisposable = queryEditor.onDidChange(this.didChangeQuery.bind(this));
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.disposables.dispose();
      this.didChangeQueryDisposable.dispose();
      return etch.destroy(this);
    }
  }, {
    key: 'registerAtomCommands',
    value: function registerAtomCommands() {
      var _this = this;

      return global.atom.commands.add(this.element, {
        'core:move-up': function coreMoveUp(event) {
          _this.selectPrevious();
          event.stopPropagation();
        },
        'core:move-down': function coreMoveDown(event) {
          _this.selectNext();
          event.stopPropagation();
        },
        'core:move-to-top': function coreMoveToTop(event) {
          _this.selectFirst();
          event.stopPropagation();
        },
        'core:move-to-bottom': function coreMoveToBottom(event) {
          _this.selectLast();
          event.stopPropagation();
        },
        'core:confirm': function coreConfirm(event) {
          _this.confirmSelection();
          event.stopPropagation();
        },
        'core:cancel': function coreCancel(event) {
          _this.cancelSelection();
          event.stopPropagation();
        }
      });
    }
  }, {
    key: 'update',
    value: function update() {
      var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var shouldComputeItems = false;

      if (props.hasOwnProperty('items')) {
        this.props.items = props.items;
        shouldComputeItems = true;
      }

      if (props.hasOwnProperty('maxResults')) {
        this.props.maxResults = props.maxResults;
        shouldComputeItems = true;
      }

      if (props.hasOwnProperty('filter')) {
        this.props.filter = props.filter;
        shouldComputeItems = true;
      }

      if (props.hasOwnProperty('filterQuery')) {
        this.props.filterQuery = props.filterQuery;
        shouldComputeItems = true;
      }

      if (props.hasOwnProperty('query')) {
        // Items will be recomputed as part of the change event handler, so we
        // don't need to recompute them again at the end of this function.
        this.refs.queryEditor.setText(props.query);
        shouldComputeItems = false;
      }

      if (props.hasOwnProperty('order')) {
        this.props.order = props.order;
      }

      if (props.hasOwnProperty('emptyMessage')) {
        this.props.emptyMessage = props.emptyMessage;
      }

      if (props.hasOwnProperty('errorMessage')) {
        this.props.errorMessage = props.errorMessage;
      }

      if (props.hasOwnProperty('infoMessage')) {
        this.props.infoMessage = props.infoMessage;
      }

      if (props.hasOwnProperty('loadingMessage')) {
        this.props.loadingMessage = props.loadingMessage;
      }

      if (props.hasOwnProperty('loadingBadge')) {
        this.props.loadingBadge = props.loadingBadge;
      }

      if (props.hasOwnProperty('itemsClassList')) {
        this.props.itemsClassList = props.itemsClassList;
      }

      if (props.hasOwnProperty('initialSelectionIndex')) {
        this.props.initialSelectionIndex = props.initialSelectionIndex;
      }

      if (shouldComputeItems) {
        this.computeItems();
      }

      return etch.update(this);
    }
  }, {
    key: 'render',
    value: function render() {
      return $.div({}, $(TextEditor, { ref: 'queryEditor', mini: true }), this.renderLoadingMessage(), this.renderInfoMessage(), this.renderErrorMessage(), this.renderItems());
    }
  }, {
    key: 'renderItems',
    value: function renderItems() {
      var _this2 = this;

      if (this.items.length > 0) {
        var className = ['list-group'].concat(this.props.itemsClassList || []).join(' ');
        return $.ol.apply($, [{ className: className, ref: 'items' }].concat(_toConsumableArray(this.items.map(function (item, index) {
          var selected = _this2.getSelectedItem() === item;

          return $(ListItemView, {
            element: _this2.props.elementForItem(item, { selected: selected, index: index }),
            selected: selected,
            onclick: function onclick() {
              return _this2.didClickItem(index);
            }
          });
        }))));
      } else if (!this.props.loadingMessage && this.props.emptyMessage) {
        return $.span({ ref: 'emptyMessage' }, this.props.emptyMessage);
      } else {
        return '';
      }
    }
  }, {
    key: 'renderErrorMessage',
    value: function renderErrorMessage() {
      if (this.props.errorMessage) {
        return $.span({ ref: 'errorMessage' }, this.props.errorMessage);
      } else {
        return '';
      }
    }
  }, {
    key: 'renderInfoMessage',
    value: function renderInfoMessage() {
      if (this.props.infoMessage) {
        return $.span({ ref: 'infoMessage' }, this.props.infoMessage);
      } else {
        return '';
      }
    }
  }, {
    key: 'renderLoadingMessage',
    value: function renderLoadingMessage() {
      if (this.props.loadingMessage) {
        return $.div({ className: 'loading' }, $.span({ ref: 'loadingMessage', className: 'loading-message' }, this.props.loadingMessage), this.props.loadingBadge ? $.span({ ref: 'loadingBadge', className: 'badge' }, this.props.loadingBadge) : '');
      } else {
        return '';
      }
    }
  }, {
    key: 'getQuery',
    value: function getQuery() {
      if (this.refs && this.refs.queryEditor) {
        return this.refs.queryEditor.getText();
      } else {
        return '';
      }
    }
  }, {
    key: 'getFilterQuery',
    value: function getFilterQuery() {
      return this.props.filterQuery ? this.props.filterQuery(this.getQuery()) : this.getQuery();
    }
  }, {
    key: 'didChangeQuery',
    value: function didChangeQuery() {
      if (this.props.didChangeQuery) {
        this.props.didChangeQuery(this.getFilterQuery());
      }

      this.computeItems();
    }
  }, {
    key: 'didClickItem',
    value: function didClickItem(itemIndex) {
      this.selectIndex(itemIndex);
      this.confirmSelection();
    }
  }, {
    key: 'computeItems',
    value: function computeItems(updateComponent) {
      var filterFn = this.props.filter || this.fuzzyFilter.bind(this);
      this.items = filterFn(this.props.items.slice(), this.getFilterQuery());
      if (this.props.order) {
        this.items.sort(this.props.order);
      }
      if (this.props.maxResults) {
        this.items = this.items.slice(0, this.props.maxResults);
      }

      this.selectIndex(this.props.initialSelectionIndex, updateComponent);
    }
  }, {
    key: 'fuzzyFilter',
    value: function fuzzyFilter(items, query) {
      if (query.length === 0) {
        return items;
      } else {
        var scoredItems = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            var string = this.props.filterKeyForItem ? this.props.filterKeyForItem(item) : item;
            var score = fuzzaldrin.score(string, query);
            if (score > 0) {
              scoredItems.push({ item: item, score: score });
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        scoredItems.sort(function (a, b) {
          return b.score - a.score;
        });
        return scoredItems.map(function (i) {
          return i.item;
        });
      }
    }
  }, {
    key: 'getSelectedItem',
    value: function getSelectedItem() {
      if (this.selectionIndex === undefined) return null;
      return this.items[this.selectionIndex];
    }
  }, {
    key: 'selectPrevious',
    value: function selectPrevious() {
      if (this.selectionIndex === undefined) return this.selectLast();
      return this.selectIndex(this.selectionIndex - 1);
    }
  }, {
    key: 'selectNext',
    value: function selectNext() {
      if (this.selectionIndex === undefined) return this.selectFirst();
      return this.selectIndex(this.selectionIndex + 1);
    }
  }, {
    key: 'selectFirst',
    value: function selectFirst() {
      return this.selectIndex(0);
    }
  }, {
    key: 'selectLast',
    value: function selectLast() {
      return this.selectIndex(this.items.length - 1);
    }
  }, {
    key: 'selectNone',
    value: function selectNone() {
      return this.selectIndex(undefined);
    }
  }, {
    key: 'selectIndex',
    value: function selectIndex(index) {
      var updateComponent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (index >= this.items.length) {
        index = 0;
      } else if (index < 0) {
        index = this.items.length - 1;
      }

      this.selectionIndex = index;
      if (index !== undefined && this.props.didChangeSelection) {
        this.props.didChangeSelection(this.getSelectedItem());
      }

      if (updateComponent) {
        return etch.update(this);
      } else {
        return Promise.resolve();
      }
    }
  }, {
    key: 'selectItem',
    value: function selectItem(item) {
      var index = this.items.indexOf(item);
      if (index === -1) {
        throw new Error('Cannot select the specified item because it does not exist.');
      } else {
        return this.selectIndex(index);
      }
    }
  }, {
    key: 'confirmSelection',
    value: function confirmSelection() {
      var selectedItem = this.getSelectedItem();
      if (selectedItem != null) {
        if (this.props.didConfirmSelection) {
          this.props.didConfirmSelection(selectedItem);
        }
      } else {
        if (this.props.didConfirmEmptySelection) {
          this.props.didConfirmEmptySelection();
        }
      }
    }
  }, {
    key: 'cancelSelection',
    value: function cancelSelection() {
      if (this.props.didCancelSelection) {
        this.props.didCancelSelection();
      }
    }
  }]);

  return SelectListView;
}();

var ListItemView = function () {
  function ListItemView(props) {
    var _this3 = this;

    _classCallCheck(this, ListItemView);

    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.didClick = this.didClick.bind(this);
    this.selected = props.selected;
    this.onclick = props.onclick;
    this.element = props.element;
    this.element.addEventListener('mousedown', this.mouseDown);
    this.element.addEventListener('mouseup', this.mouseUp);
    this.element.addEventListener('click', this.didClick);
    if (this.selected) {
      this.element.classList.add('selected');
    }
    this.domEventsDisposable = new Disposable(function () {
      _this3.element.removeEventListener('mousedown', _this3.mouseDown);
      _this3.element.removeEventListener('mouseup', _this3.mouseUp);
      _this3.element.removeEventListener('click', _this3.didClick);
    });
    etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this));
  }

  _createClass(ListItemView, [{
    key: 'mouseDown',
    value: function mouseDown(event) {
      event.preventDefault();
    }
  }, {
    key: 'mouseUp',
    value: function mouseUp(event) {
      event.preventDefault();
    }
  }, {
    key: 'didClick',
    value: function didClick(event) {
      event.preventDefault();
      this.onclick();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.element.remove();
      this.domEventsDisposable.dispose();
    }
  }, {
    key: 'update',
    value: function update(props) {
      this.element.removeEventListener('mousedown', this.mouseDown);
      this.element.removeEventListener('mouseup', this.mouseUp);
      this.element.removeEventListener('click', this.didClick);

      this.element.parentNode.replaceChild(props.element, this.element);
      this.element = props.element;
      this.element.addEventListener('mousedown', this.mouseDown);
      this.element.addEventListener('mouseup', this.mouseUp);
      this.element.addEventListener('click', this.didClick);
      if (props.selected) {
        this.element.classList.add('selected');
      }

      this.selected = props.selected;
      this.onclick = props.onclick;
      etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this));
    }
  }, {
    key: 'scrollIntoViewIfNeeded',
    value: function scrollIntoViewIfNeeded() {
      if (this.selected) {
        this.element.scrollIntoViewIfNeeded();
      }
    }
  }]);

  return ListItemView;
}();