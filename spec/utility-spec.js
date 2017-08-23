/** @babel */

import fs from 'fs-plus'
import path from 'path'
import temp from 'temp'

import * as Utility from '../lib/utility'

temp.track()

describe('Utility', () => {
  let defaultDirectory = atom.config.get('atom-notes.directory')
  let defaultNoteExtensions = atom.config.get('atom-notes.extensions')

  afterEach(() => {
    atom.config.set('atom-notes.directory', defaultDirectory)
    atom.config.set('atom-notes.extensions', defaultNoteExtensions)
  })

  describe('getPrimaryNoteExtension', () => {
    it('test suite', () => {
      atom.config.set('atom-notes.extensions', ['.md', '.markdown'])
      expect(Utility.getPrimaryNoteExtension()).toBe('.md')
      atom.config.set('atom-notes.extensions', ['.markdown'])
      expect(Utility.getPrimaryNoteExtension()).toBe('.markdown')
      atom.config.set('atom-notes.extensions', [])
      expect(Utility.getPrimaryNoteExtension()).toBe('.md')
    })
  })

  describe('isNote', () => {
    it('handles symlinks correctly', () => {
      atom.config.set('atom-notes.extensions', ['.md', '.markdown'])

      let tempDirectoryPath = path.join(temp.mkdirSync())
      let notesDirectoryPath = path.join(temp.mkdirSync())
      let notesDirectoryPathSymlink = path.join(tempDirectoryPath, 'note book')
      let notePath = path.join(notesDirectoryPath, 'note.md')
      let notePathSymlink = path.join(notesDirectoryPathSymlink, 'note symlink.md')

      fs.writeFileSync(notePath, 'dummy')
      fs.symlinkSync(notesDirectoryPath, notesDirectoryPathSymlink)
      fs.symlinkSync(notePath, notePathSymlink)

      expect(fs.existsSync(notePath)).toBe(true)
      expect(fs.existsSync(fs.normalize(notePath))).toBe(true)

      atom.config.set('atom-notes.directory', notesDirectoryPath)
      expect(Utility.isNote(notePath)).toBe(true)
      expect(Utility.isNote(notePathSymlink)).toBe(true)

      atom.config.set('atom-notes.directory', notesDirectoryPathSymlink)
      expect(Utility.isNote(notePath)).toBe(true)
      expect(Utility.isNote(notePathSymlink)).toBe(true)
    })
  })
})
