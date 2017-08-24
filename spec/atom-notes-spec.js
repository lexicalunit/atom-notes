/** @babel */

import path from 'path'
import temp from 'temp'

temp.track()

describe('atom-notes', () => {
  const dir = atom.config.get('atom-notes.directory')
  let wsview = null

  beforeEach(() => {
    wsview = atom.views.getView(atom.workspace)
  })

  afterEach(() => {
    atom.config.set('atom-notes.directory', dir)
  })

  describe('when the toggle event is triggered', () => {
    it('attaches and then detaches the view', () => {
      const noteDirectory = path.join(temp.mkdirSync())
      atom.config.set('atom-notes.directory', noteDirectory)

      waitsForPromise(() => atom.packages.activatePackage('atom-notes'))

      runs(() => {
        expect(wsview.querySelector('.atom-notes')).not.toExist()

        atom.commands.dispatch(wsview, 'atom-notes:toggle')
        expect(wsview.querySelector('.atom-notes')).toExist()
        expect(wsview.querySelector('.atom-notes').parentNode.style.display).not.toBe('none')

        atom.commands.dispatch(wsview, 'atom-notes:toggle')
        expect(wsview.querySelector('.atom-notes').parentNode.style.display).toBe('none')
      })
    })
  })

  // TOOD: Add a spec test for ensureNotesDirectory()?
})
