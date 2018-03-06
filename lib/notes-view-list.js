'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /** @babel */

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var fp = _interopRequireWildcard(_fuzzaldrinPlus);

var _timsort = require('timsort');

var TimSort = _interopRequireWildcard(_timsort);

var _notesFs = require('./notes-fs');

var NotesFs = _interopRequireWildcard(_notesFs);

var _selectListView = require('./select-list-view');

var _selectListView2 = _interopRequireDefault(_selectListView);

var _grayMatter = require('gray-matter');

var _grayMatter2 = _interopRequireDefault(_grayMatter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var autocompleteTimeout = void 0;

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

var NotesViewList = function () {
  /** Builds a new notes query and list interface element.
    *
    * @param {Promise.<NotesStore>} storePromise - The document storage for notes.
    * @param {Options} [options] - Behaviour and configuration settings.
    */
  function NotesViewList(storePromise) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, NotesViewList);

    storePromise.then(function (store) {
      _this.store = store;
      var reload = function reload() {
        if (!_this.isLoaded()) return;
        _this.selectListView.update({ items: _this.store.documents });
      };
      var makeReady = function makeReady() {
        _this.store.loaded = true;
        _this.selectListView.update({ loadingMessage: null });
        reload();
        _this.store.on('added', function (_) {
          return reload();
        });
        _this.store.on('updated', function (_) {
          return reload();
        });
        _this.store.on('removed', function (_) {
          return reload();
        });
      };
      if (_this.store.loaded) makeReady();else _this.store.on('ready', function () {
        return makeReady();
      });
    });
    if (options.hasOwnProperty('didHide')) {
      this.didHide = options.didHide;
    }
    this.filteredItems = [];
    this.selectListView = new _selectListView2.default({
      items: [],
      loadingMessage: 'Loading notes...',
      emptyMessage: 'No matching notes',
      initialSelectionIndex: undefined,
      elementForItem: function elementForItem(item) {
        return _this.elementForItem(item);
      },
      filter: function filter(items, query) {
        return _this.filter(items, query);
      },
      filterQuery: function filterQuery(query) {
        return _this.filterQuery(query);
      },
      didChangeQuery: function didChangeQuery(query) {
        return _this.didChangeQuery(query);
      },
      didConfirmSelection: function didConfirmSelection(item) {
        return _this.didConfirmSelection(item);
      },
      didConfirmEmptySelection: function didConfirmEmptySelection() {
        return _this.didConfirmEmptySelection();
      },
      didCancelSelection: function didCancelSelection() {
        return _this.didCancelSelection();
      }
    });
    this.selectListView.element.classList.add('atom-notes');
  }

  /**
   * Returns true iff the document storage has finished loading notes.
   * @return {Boolean}
   */


  _createClass(NotesViewList, [{
    key: 'isLoaded',
    value: function isLoaded() {
      return this.store !== undefined && this.store.loaded;
    }

    /**
     * Returns HTMLElement object that should represent a single document item in this view.
     * @param  {DocumentItem} item The document item to display in our list.
     * @return {HTMLElement}
     */

  }, {
    key: 'elementForItem',
    value: function elementForItem(item) {
      var query = this.selectListView.getFilterQuery();
      var matches = fp.match(item.title, query);

      var primary = document.createElement('div');
      primary.classList.add('primary-line');
      primary.appendChild(highlight(item.title, matches));

      var metadata = document.createElement('div');
      metadata.classList.add('metadata');
      metadata.textContent = item.modifiedAt.toLocaleDateString();
      primary.appendChild(metadata);

      var secondary = document.createElement('div');
      secondary.classList.add('secondary-line');

      if (item.abstract != null) {
        secondary.textContent = item.abstract.slice(0, 100);
      } else {
        secondary.textContent = (0, _grayMatter2.default)(item.body).content.slice(0, 100);
      }

      if (item.keywords && Array.isArray(item.keywords) && item.keywords.length > 0) {
        var keywords = document.createElement('div');
        keywords.classList.add('keywords');
        keywords.innerHTML = '<span class="highlight-info">' + item.keywords.join('</span><span class="highlight-info">') + '</span>';
        secondary.appendChild(keywords);
      }

      var element = document.createElement('li');
      element.classList.add('two-lines');
      element.appendChild(primary);
      element.appendChild(secondary);
      return element;
    }

    /**
     * Renders completion for query; if not supplied, re-render existing completion.
     * @param {String} [query=undefined] The current search query to build autocomplete off of.
     */

  }, {
    key: 'autocomplete',
    value: function autocomplete() {
      var _this2 = this;

      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (!this.lastAutocompleteQuery) this.lastAutocompleteQuery = '';
      if (!this.isLoaded()) {
        this.lastAutocompleteQuery = '';
        return;
      }
      __guard__(autocompleteTimeout, function (x) {
        clearTimeout(x);
        autocompleteTimeout = null;
      });
      if (query) {
        this.filteredItems = fp.filter(this.store.documents, query, { key: 'title' });
      } else {
        this.lastAutocompleteQuery = '';
        this.selectListView.refs.queryEditor.selectAll();
        return;
      }
      if (this.filteredItems.length <= 0) {
        this.lastAutocompleteQuery = '';
        return;
      }
      autocompleteTimeout = setTimeout(function () {
        if (_this2.filteredItems.length <= 0) {
          _this2.lastAutocompleteQuery = '';
          return;
        }
        var best = _this2.filteredItems[0];
        var q = _this2.selectListView.getFilterQuery();
        var complete = q !== undefined && q.length > 0 && best.title.toLowerCase().startsWith(q.toLowerCase());
        if (complete) {
          var newQuery = q + best.title.slice(q.length);
          _this2.selectListView.setQuery(newQuery, { doDidChangeQuery: false });
          _this2.selectListView.refs.queryEditor.selectLeft(newQuery.length - q.length);
          _this2.lastAutocompleteQuery = q;
        } else {
          _this2.lastAutocompleteQuery = '';
        }
      }, 300);
    }

    /**
     * Our override for our SelectListView's filter() callback.
     * @param  {String} query The users current search query.
     * @return {DocumentItem[]}
     */

  }, {
    key: 'filter',
    value: function filter(_, query) {
      var items = [];
      if (!this.isLoaded()) return items;
      if (query === undefined || query.length <= 0) {
        items = this.store.documents;
        TimSort.sort(items, function (lhs, rhs) {
          if (lhs.modifiedAt > rhs.modifiedAt) return -1;else if (lhs.modifiedAt < rhs.modifiedAt) return 1;
          return 0;
        });
      } else {
        items = this.store.search(query).filter(function (item) {
          return item !== undefined;
        });

        if (atom.config.get('atom-notes.orderByFuzzyFileNameMatch')) {
          TimSort.sort(items, function (lhs, rhs) {
            if (query.length > 0) {
              var li = fp.score(lhs.title, query);
              var ri = fp.score(rhs.title, query);
              if (li > ri) return -1;else if (li < ri) return 1;
              return 0;
            }
          });
        }
      }
      // docsearch returned nothing, fallback to fuzzy finder
      if (items.length <= 0) {
        return this.filteredItems;
      }
      return items;
    }

    /**
     * Our override for our SelectListView's filterQuery() callback.
     * @param  {String} query The users current search query.
     * @return {String}       Sanitized version of user's query.
     */

  }, {
    key: 'filterQuery',
    value: function filterQuery(query) {
      return __guard__(query, function (x) {
        var t = x.trim();
        return x.length > 0 && x.endsWith(' ') ? t + ' ' : t;
      });
    }

    /**
     * Our override for our SelectListView's didChangeQuery() callback.
     * @param {String} query The users current search query.
     */

  }, {
    key: 'didChangeQuery',
    value: function didChangeQuery(query) {
      if (query.toLowerCase() !== this.lastAutocompleteQuery.toLowerCase()) {
        this.autocomplete(query);
      }
    }

    /**
     * Our override for our SelectListView's didConfirmSelection() callback.
     * @param {DocumentItem} item The user's selected document item.
     */

  }, {
    key: 'didConfirmSelection',
    value: function didConfirmSelection(item) {
      this.didHide();
      atom.workspace.open(item.filePath);
    }

    /**
     * Our override for our SelectListView's didConfirmEmptySelection() callback.
     */

  }, {
    key: 'didConfirmEmptySelection',
    value: function didConfirmEmptySelection() {
      var title = this.selectListView.getFilterQuery();
      if (title.length <= 0) return;
      this.didHide();
      NotesFs.openNote(title);
    }

    /**
     * Our override for our SelectListView's didCancelSelection() callback.
     */

  }, {
    key: 'didCancelSelection',
    value: function didCancelSelection() {
      __guard__(autocompleteTimeout, function (x) {
        clearTimeout(x);
        autocompleteTimeout = null;
      });

      // focus leaving atom-notes unselects any selected item and dismisses modal
      if (!this.selectListView.element.contains(document.activeElement)) {
        this.selectListView.selectNone();
        this.didHide();
        return;
      }

      // cancel with a selected item unselects the item
      if (this.selectListView.getSelectedItem()) {
        this.selectListView.selectNone();
        return;
      }

      // cancel with selected text unselects the text
      var selectedText = this.selectListView.refs.queryEditor.getSelectedText();
      if (selectedText !== '') {
        var query = this.selectListView.getQuery();
        query = query.slice(0, query.length - selectedText.length);
        this.selectListView.setQuery(query, { doDidChangeQuery: false });
        return;
      }

      // cancel with no selected item and no selected text dismisses the modal
      __guard__(this.previousFocus, function (x) {
        return x.focus();
      });
      this.didHide();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      __guard__(autocompleteTimeout, function (x) {
        clearTimeout(x);
        autocompleteTimeout = null;
      });
    }
  }]);

  return NotesViewList;
}();

/**
 * Highlights the fuzzy-finder matching text in our search results.
 * @see    {@link https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.js#L304}
 * @param  {string}   path            The text to be highlighted.
 * @param  {Number[]} matches         Positions of matching characters.
 * @param  {Number}   [offsetIndex=0] Offset into path to begin hilighting.
 * @return {HTMLElement}              Returns a span element with highlight annotations.
 */


exports.default = NotesViewList;
function highlight(path, matches) {
  var offsetIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  // guard against case where there's nothing to highlight
  if (!path || path.length <= 0) return document.createTextNode(path);
  if (!matches || matches.length <= 0) return document.createTextNode(path);

  var lastIndex = 0;
  var matchedChars = [];
  var fragment = document.createDocumentFragment();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = matches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var matchIndex = _step.value;

      matchIndex -= offsetIndex;
      // If marking up the basename, omit path matches
      if (matchIndex < 0) {
        continue;
      }
      var unmatched = path.substring(lastIndex, matchIndex);
      if (unmatched) {
        if (matchedChars.length > 0) {
          var _span = document.createElement('span');
          _span.classList.add('character-match');
          _span.textContent = matchedChars.join('');
          fragment.appendChild(_span);
          matchedChars = [];
        }

        fragment.appendChild(document.createTextNode(unmatched));
      }

      matchedChars.push(path[matchIndex]);
      lastIndex = matchIndex + 1;
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

  if (matchedChars.length > 0) {
    var span = document.createElement('span');
    span.classList.add('character-match');
    span.textContent = matchedChars.join('');
    fragment.appendChild(span);
  }

  // Remaining characters are plain text
  fragment.appendChild(document.createTextNode(path.substring(lastIndex)));
  return fragment;
}

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}