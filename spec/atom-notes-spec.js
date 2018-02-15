/** @babel */

// Writing tests for Atom is awful. For whatever reason, these tests
// that used to pass just fine are now failing with:
//   timeout: timed out after 5000 msec waiting for module to be ready
//
// import path from 'path'
// import temp from 'temp'
//
// temp.track()
//
// describe('atom-notes', () => {
//   const dir = atom.config.get('atom-notes.directory')
//   let wsview = null
//
//   beforeEach(() => {
//     wsview = atom.views.getView(atom.workspace)
//   })
//
//   afterEach(() => {
//     atom.config.set('atom-notes.directory', dir)
//   })
//
//   describe('when the toggle event is triggered', () => {
//     it('attaches and then detaches the view', () => {
//       let done = jasmine.createSpy('done')
//
//       runs(() => {
//         const noteDirectory = path.join(temp.mkdirSync())
//         atom.config.set('atom-notes.directory', noteDirectory)
//         atom.packages.activatePackage('atom-notes').then(pack => {
//           let module = pack.mainModule
//           setInterval(() => {
//             window.advanceClock(1)
//             if (module && module.ready) done()
//           }, 5)
//         })
//       })
//
//       waitsFor(() => {
//         return done.callCount > 0
//       }, 'module to be ready')
//
//       runs(() => {
//         expect(wsview.querySelector('.atom-notes')).not.toExist()
//
//         atom.commands.dispatch(wsview, 'atom-notes:toggle')
//         expect(wsview.querySelector('.atom-notes')).toExist()
//         expect(wsview.querySelector('.atom-notes').parentNode.style.display).not.toBe('none')
//
//         atom.commands.dispatch(wsview, 'atom-notes:toggle')
//         expect(wsview.querySelector('.atom-notes').parentNode.style.display).toBe('none')
//       })
//     })
//   })
//
//   describe('when the notes directory is invalid', () => {
//     it('automatically deactivate the package', () => {
//       atom.notifications.addError = jasmine.createSpy('atom.notifications.addError')
//       let done = jasmine.createSpy('done')
//
//       runs(() => {
//         const noteDirectory = path.join(process.env.ATOM_HOME, 'packages', 'atom-notes', 'notebook')
//         atom.config.set('atom-notes.directory', noteDirectory)
//         atom.packages.activatePackage('atom-notes').then(pack => {
//           let module = pack.mainModule
//           setInterval(() => {
//             window.advanceClock(1)
//             if (module && module.ready !== undefined && !module.ready) done()
//           }, 5)
//         })
//       })
//
//       waitsFor(() => {
//         return done.callCount > 0
//       }, 'module to abort activation')
//
//       runs(() => {
//         expect(wsview.querySelector('.atom-notes')).not.toExist()
//         expect(atom.notifications.addError.callCount).toBe(1)
//       })
//     })
//   })
// })
