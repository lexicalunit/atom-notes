'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _elasticlunr = require('elasticlunr');

var _elasticlunr2 = _interopRequireDefault(_elasticlunr);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _grayMatter = require('gray-matter');

var _grayMatter2 = _interopRequireDefault(_grayMatter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @babel */

var _require = require('events'),
    EventEmitter = _require.EventEmitter;
// const {watchPath} = require('atom')


var _require2 = require('@atom/watcher'),
    watchPath = _require2.watchPath;

/**
  * @typedef DocumentItem
  * @type {Object}
  * @property {string} title - Title of the note.
  * @property {string} fileName - Name of the file where note is stored.
  * @property {string} filePath - Path to the file where note is stored.
  * @property {string} body - Body of the note.
  * @property {Array} keywords - Keywords of the note.
  * @property {Array} abstract - Summary of the note.
  * @property {Date} modifiedAt - Date and time of last modification to the note.
  */

/**
 * Builds a document object to hold state about a note document.
 * @param  {String} filePath Full path to the document.
 * @return {DocumentItem}
 */


function createDocument(filePath) {
  var fileStats = _fsPlus2.default.statSync(filePath);
  var fileName = _path2.default.basename(filePath);
  var title = _path2.default.basename(fileName, _path2.default.extname(fileName));
  var body = _fsPlus2.default.readFileSync(filePath, { encoding: 'utf8' });
  var keywords = [];
  var abstract = null;

  var meta = void 0;
  try {
    meta = (0, _grayMatter2.default)(body).data;
  } catch (_) {
    // If YAML parsing fails, that's fine. We just won't have meta data.
  }

  if (meta !== undefined && meta.keywords !== undefined) {
    keywords = meta.keywords;
  }

  if (meta !== undefined && meta.abstract !== undefined) {
    abstract = meta.abstract;
  }

  return {
    filePath: filePath,
    fileName: fileName,
    title: title,
    modifiedAt: fileStats.mtime,
    body: body,
    keywords: keywords,
    abstract: abstract
  };
}

async function setupFileWatcher(directoryPath) {
  var _this = this;

  var watchedDirectory = _fsPlus2.default.normalize(directoryPath);
  _fsPlus2.default.listTreeSync(watchedDirectory).forEach(function (path) {
    if (!_fsPlus2.default.isDirectorySync(path)) {
      _this.addDocument(createDocument(path));
    }
  });
  return watchPath(watchedDirectory, {}, function (events) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = events[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var event = _step.value;

        if (event.action === 'created') {
          _this.addDocument(createDocument(event.path));
        } else if (event.action === 'modified') {
          _this.updateDocument(createDocument(event.path));
        } else if (event.action === 'deleted') {
          _this.removeDocument(_this._documents[event.path]);
        } else if (event.action === 'renamed') {
          _this.removeDocument(_this._documents[event.oldPath]);
          _this.addDocument(createDocument(event.path));
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
  });
}

var NotesStore = function (_EventEmitter) {
  _inherits(NotesStore, _EventEmitter);

  /**
   * Document storage for notes.
   * @param {String}   directoryPath Full path to where notes are stored.
   * @param {String[]} extensions    File extensions of notes.
   * @param {Object}   [index=null]  Serialized elasticlunr index to load.
   */
  function NotesStore(directoryPath, extensions) {
    var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, NotesStore);

    var _this2 = _possibleConstructorReturn(this, (NotesStore.__proto__ || Object.getPrototypeOf(NotesStore)).call(this));

    _this2.extensions = extensions;
    _this2._documents = {};

    if (index) {
      console.log('atom-notes: loading...');
      _this2.loaded = true;
      _this2.index = _elasticlunr2.default.Index.load(index);
    } else {
      console.log('atom-notes: indexing...');
      _this2.loaded = false;
      _this2.index = (0, _elasticlunr2.default)(function () {
        this.addField('title');
        this.addField('body');
        this.addField('keywords');
        this.addField('abstract');
      });
    }

    _this2.watcher = setupFileWatcher.bind(_this2)(directoryPath);
    _this2.emit('ready');
    return _this2;
  }

  /**
   * Adds the given document to our index.
   * @param {DocumentItem} doc
   */


  _createClass(NotesStore, [{
    key: 'addDocument',
    value: function addDocument(doc) {
      this._documents[doc.filePath] = doc;
      var data = {
        id: doc.filePath,
        title: doc.title,
        body: doc.body,
        abstract: doc.abstract
      };
      if (doc.keywords && Array.isArray(doc.keywords)) {
        data.keywords = doc.keywords.join(', ');
      }
      this.index.addDoc(data);
      this.emit('added', doc);
    }

    /**
     * Updates the given document, identified by filePath, in our index.
     * @param {DocumentItem} doc
     */

  }, {
    key: 'updateDocument',
    value: function updateDocument(doc) {
      this._documents[doc.filePath] = doc;
      var data = {
        id: doc.filePath,
        title: doc.title,
        body: doc.body,
        abstract: doc.abstract
      };
      if (doc.keywords && Array.isArray(doc.keywords)) {
        data.keywords = doc.keywords.join(', ');
      }
      this.index.updateDoc(data);
      this.emit('updated', doc);
    }

    /**
     * Removes the given document, identified by filePath, from our index.
     * @param {DocumentItem} doc
     */

  }, {
    key: 'removeDocument',
    value: function removeDocument(doc) {
      delete this._documents[doc.filePath];
      var data = {
        id: doc.filePath,
        title: doc.title,
        body: doc.body,
        abstract: doc.abstract
      };
      if (doc.keywords && Array.isArray(doc.keywords)) {
        data.keywords = doc.keywords.join(', ');
      }
      this.index.removeDoc(data);
      this.emit('removed', doc);
    }

    /**
     * Search for notes in our document store.
     * @param  {String} query Some text to use for matching indexed documents.
     * @return {DocumentItem[]}
     */

  }, {
    key: 'search',
    value: function search(query) {
      var _this3 = this;

      var config = {
        fields: {
          keywords: { boost: 20, bool: 'AND' },
          title: { boost: 10, bool: 'AND' },
          abstract: { boost: 5, bool: 'AND' },
          body: { boost: 1 }
        },
        bool: 'OR',
        expand: true
      };
      return this.index.search(query, config).map(function (result) {
        return _this3._documents[result.ref];
      });
    }

    /**
     * Fetch all documents in our index.
     * @return {DocumentItem[]}
     */

  }, {
    key: 'documents',
    get: function get() {
      var documents = [];
      for (var key in this._documents) {
        documents.push(this._documents[key]);
      }
      return documents.sort(function (a, b) {
        if (a.modifiedAt < b.modifiedAt) return 1;
        if (a.modifiedAt > b.modifiedAt) return -1;
        return 0;
      });
    }
  }]);

  return NotesStore;
}(EventEmitter);

module.exports = NotesStore;