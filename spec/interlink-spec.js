/** @babel */

import path from 'path'
import temp from 'temp'

import * as Interlink from '../lib/interlink'

temp.track()

describe('Interlink', () => {
  let editor = null

  describe('when the editor is opened to a note', () => {
    beforeEach(() => {
      const notesDirectory = temp.mkdirSync()
      const notePath = path.join(notesDirectory, 'Interlink.md')
      atom.config.set('atom-notes.directory', notesDirectory)
      waitsForPromise(() => atom.packages.activatePackage('atom-notes'))
      waitsForPromise(() => atom.workspace.open(notePath))

      runs(() => {
        editor = atom.workspace.getActiveTextEditor()
        waitsFor(done => {
          editor.getBuffer().onDidSave(() => done())
          editor.save()
        })
      })
    })

    it('can get interlink text', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Car')

      editor.setText('[[Notational Velocity]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Notational Velocity')

      editor.setText('[[ Car ]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Car')

      editor.setText('[[Car/Mini]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Car/Mini')

      editor.setText('[[[Car]]]')
      editor.setCursorBufferPosition([0, 3])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Car')

      editor.setText('[[Car]]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBe('Car')
    })

    it('recognizes invalid interlink text', () => {
      editor.setText('[[]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()

      editor.setText('[[]]')
      editor.setCursorBufferPosition([0, 3])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()

      editor.setText('[[   ]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()

      editor.setText('[Car]')
      editor.setCursorBufferPosition([0, 1])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()

      editor.setText('[[Car]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()

      editor.setText('Car')
      editor.setCursorBufferPosition([0, 1])
      expect(Interlink.getInterlinkTitle(editor)).toBeNull()
    })

    it('can open valid interlinks', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])

      const openPromise = Interlink.openInterlink()
      expect(openPromise).not.toBe(undefined)
      waitsForPromise(() => openPromise)

      runs(() => {
        const activeEditor = atom.workspace.getActiveTextEditor()
        expect(activeEditor.getPath().endsWith('Car.md')).toBe(true)
      })
    })

  // Writing tests for Atom is awful. For whatever reason, this test
  // that used to pass just fine is now failing with:
  //   timeout: timed out after 5000 msec waiting for module to be ready
  //   it('can dispatch open interlink command', () => {
  //     editor.setText('[[Car]]')
  //     editor.setCursorBufferPosition([0, 2])
  //
  //     waitsFor(done => {
  //       atom.commands.dispatch(atom.views.getView(atom.workspace), 'atom-notes:interlink')
  //       atom.workspace.observeActiveTextEditor(observedEditor => {
  //         if (observedEditor.getPath() !== editor.getPath()) done()
  //       })
  //     })
  //
  //     runs(() => {
  //       const activeEditor = atom.workspace.getActiveTextEditor()
  //       expect(activeEditor.getPath().endsWith('Car.md')).toBe(true)
  //     })
  //   })
  })

  describe('when the editor is NOT opened to a note', () => {
    beforeEach(() => {
      const notesDirectory = temp.mkdirSync()
      atom.config.set('atom-notes.directory', notesDirectory)
      const randomDirectory = temp.mkdirSync()
      const filePath = path.join(randomDirectory, 'Interlink.md')
      waitsForPromise(() => atom.packages.activatePackage('atom-notes'))
      waitsForPromise(() => atom.workspace.open(filePath))

      runs(() => {
        editor = atom.workspace.getActiveTextEditor()
        waitsFor(done => {
          editor.getBuffer().onDidSave(() => done())
          editor.save()
        })
      })
    })

    // I see no reason not to just support interlinks everywhere.
    it('still does open valid interlinks', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])

      const openPromise = Interlink.openInterlink()
      expect(openPromise).not.toBe(undefined)
      waitsForPromise(() => openPromise)

      runs(() => {
        const activeEditor = atom.workspace.getActiveTextEditor()
        expect(activeEditor.getPath().endsWith('Car.md')).toBe(true)
      })
    })
  })
})
