/** @babel */

import path from 'path'
import temp from 'temp'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { packageName } from '../lib/utility'

chai.use(chaiAsPromised)
chai.should()

temp.track()

describe(`${packageName}`, () => {
  const dir = atom.config.get(`${packageName}.directory`)
  let wsview = null

  beforeEach(() => {
    wsview = atom.views.getView(atom.workspace)
  })

  afterEach(() => {
    atom.config.set(`${packageName}.directory`, dir)
  })

  describe('when the toggle event is triggered', () => {
    it('attaches and then detaches the view', () => {
      const noteDirectory = path.join(temp.mkdirSync())
      atom.config.set(`${packageName}.directory`, noteDirectory)

      waitsForPromise(() => atom.packages.activatePackage(packageName))

      runs(() => {
        expect(wsview.querySelector(`.${packageName}`)).not.toExist()

        atom.commands.dispatch(wsview, `${packageName}:toggle`)
        expect(wsview.querySelector(`.${packageName}`)).toExist()
        expect(wsview.querySelector(`.${packageName}`).parentNode.style.display).not.toBe('none')

        atom.commands.dispatch(wsview, `${packageName}:toggle`)
        expect(wsview.querySelector(`.${packageName}`).parentNode.style.display).toBe('none')
      })
    })

    it('ensures that configured directory can not be within packages directory', () => {
      const noteDirectory = path.join(process.env.ATOM_HOME, 'packages', packageName, 'notebook')
      atom.config.set(`${packageName}.directory`, noteDirectory)

      runs(() => atom.packages.activatePackage(packageName).should.be.rejectedWith(Error))
    })
  })
})
