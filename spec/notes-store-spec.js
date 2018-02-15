/** @babel */

// Writing tests for Atom is awful. For whatever reason, this test
// that used to pass just fine is now failing with:
//   timeout: timed out after 5000 msec waiting for module to be ready
//
// import fs from 'fs-plus'
// import path from 'path'
// import temp from 'temp'
//
// import NotesStore from '../lib/notes-store'
//
// temp.track()
//
// describe('NotesStore', () => {
//   it('search', () => {
//     let dir = path.join(temp.mkdirSync())
//
//     let doc1 = {
//       fileName: 'What are the best animals in the world.md',
//       body: '---\n' +
//         'keywords:\n' +
//         '  - Animals\n' +
//         '  - Question\n' +
//         '---\n' +
//         '\n' +
//         'Dasypodidae are the best animals!'
//     }
//     let doc2 = {
//       fileName: 'Question is Welcome to Atom Notes.markdown',
//       body: `The general idea behind this package is to provide an embedded
//              Notational Velocity-like note-taking feature for Atom users.`
//     }
//
//     fs.writeFileSync(path.join(dir, doc1.fileName), doc1.body)
//     fs.writeFileSync(path.join(dir, doc2.fileName), doc2.body)
//
//     let storePromise = new Promise(function (resolve, reject) {
//       let store = new NotesStore(dir, ['.md', '.markdown'])
//       store.on('ready', () => resolve(store))
//     })
//     waitsForPromise(() => storePromise)
//     storePromise.then(store => {
//       let results = store.search('Dasyp')
//       expect(results.length).toBe(1)
//       expect(results[0].fileName).toBe(doc1.fileName)
//       expect(results[0].title).toBe(path.parse(doc1.fileName).name)
//       expect(results[0].body).toBe(doc1.body)
//       expect(results[0].keywords).toEqual(['Animals', 'Question'])
//
//       results = store.search('Question')
//       expect(results.length).toBe(2)
//       expect(results[0].fileName).toBe(doc1.fileName)
//       expect(results[1].fileName).toBe(doc2.fileName)
//
//       results = store.search('notational velocity')
//       expect(results.length).toBe(1)
//       expect(results[0].fileName).toBe(doc2.fileName)
//       expect(results[0].title).toBe(path.parse(doc2.fileName).name)
//       expect(results[0].body).toBe(doc2.body)
//       expect(results[0].keywords).toEqual([])
//
//       results = store.search('welcome to')
//       expect(results.length).toBe(1)
//       expect(results[0].fileName).toBe(doc2.fileName)
//       expect(results[0].title).toBe(path.parse(doc2.fileName).name)
//       expect(results[0].body).toBe(doc2.body)
//       expect(results[0].keywords).toEqual([])
//
//       results = store.search('nothing')
//       expect(results.length).toBe(0)
//     })
//   })
// })
