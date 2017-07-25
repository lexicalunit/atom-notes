/** @babel */

import path from 'path'
import temp from 'temp'

import * as Interlink from '../lib/interlink'
import * as Utility from '../lib/utility'

temp.track()

describe('Interlink', () => {
  let editor = null

  describe('when the editor is opened to a note', () => {
    beforeEach(() => {
      const notesDirectory = temp.mkdirSync()
      const notePath = path.join(notesDirectory, 'Interlink.md')
      atom.config.set(`${Utility.packageName}.directory`, notesDirectory)
      waitsForPromise(() => atom.packages.activatePackage(Utility.packageName))
      waitsForPromise(() => atom.workspace.open(notePath))

      return runs(() => {
        editor = atom.workspace.getActiveTextEditor()
        return waitsFor((done) => {
          editor.getBuffer().onDidSave(() => done())
          return editor.save()
        })
      })
    })

    it('can get interlink text', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBe('Car')

      editor.setText('[[Notational Velocity]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBe('Notational Velocity')

      editor.setText('[[ Car ]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBe('Car')

      editor.setText('[[Car/Mini]]')
      editor.setCursorBufferPosition([0, 2])
      return expect(Interlink.getInterlinkText(editor)).toBe('Car/Mini')
    })

    it('recognizes invalid interlink text', () => {
      editor.setText('[[]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[[]]')
      editor.setCursorBufferPosition([0, 3])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[[   ]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[Car]')
      editor.setCursorBufferPosition([0, 1])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[[[Car]]]')
      editor.setCursorBufferPosition([0, 3])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[[Car]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('[[Car]]]')
      editor.setCursorBufferPosition([0, 2])
      expect(Interlink.getInterlinkText(editor)).toBeNull()

      editor.setText('Car')
      editor.setCursorBufferPosition([0, 1])
      return expect(Interlink.getInterlinkText(editor)).toBeNull()
    })

    return it('can open valid interlinks', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])

      const openPromise = Interlink.openInterlink()
      expect(openPromise).not.toBe(undefined)
      waitsForPromise(() => openPromise)

      return runs(() => {
        const activeEditor = atom.workspace.getActiveTextEditor()
        return expect(activeEditor.getPath().endsWith('Car.md')).toBe(true)
      })
    })
  })

  return describe('when the editor is NOT opened to a note', () => {
    beforeEach(() => {
      const notesDirectory = temp.mkdirSync()
      atom.config.set(`${Utility.packageName}.directory`, notesDirectory)
      const randomDirectory = temp.mkdirSync()
      const filePath = path.join(randomDirectory, 'Interlink.md')
      waitsForPromise(() => atom.packages.activatePackage(Utility.packageName))
      waitsForPromise(() => atom.workspace.open(filePath))

      return runs(() => {
        editor = atom.workspace.getActiveTextEditor()
        return waitsFor((done) => {
          editor.getBuffer().onDidSave(() => done())
          return editor.save()
        })
      })
    })

    it('does not apply the grammar', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])
      return expect(Interlink.getInterlinkText(editor)).toBeNull()
    })

    return it('does NOT open valid interlinks', () => {
      editor.setText('[[Car]]')
      editor.setCursorBufferPosition([0, 2])

      const openPromise = Interlink.openInterlink()
      return expect(openPromise).toBeUndefined()
    })
  })
})
