# Atom Notes

[![apm package][apm-ver-link]][releases]
[![travis-ci][travis-ci-badge]][travis-ci]
[![appveyor][appveyor-badge]][appveyor]
[![circle-ci][circle-ci-badge]][circle-ci]
[![david][david-badge]][david]
[![download][dl-badge]][apm-pkg-link]
[![mit][mit-badge]][mit]

This package is a fork and rewrite of the now unpublished package [nvatom][nvatom]. The general
idea behind this package is to provide an embedded [Notational Velocity][nv]-like feature for Atom
users. This package is **NOT** affiliated with Notational Velocity.

![screencast][screencast]

# Notational Velocity for Atom

[Notational Velocity][nv] is an application that stores and retrieves notes. This package provides
some similar features embedded directly in your Atom editor.

- Modeless operation
- Mouseless interaction
- Incremental Search
- Interlinks

Embedding these features in Atom provides the following advantages.

- **Use Atom's Features** - Such as Syntax Highlighting and Tree View.
- **Use Other Packages** - Such as Markdown Preview and Minimap.
- **Multi-OS** - You can use it in macOS, Linux, and Windows.

We do not believe Evernote is a good successor to Notational Velocity. Advantages over Evernote are:

- **Open Source**
- **No Rich Text** - Instead, you get to use [Markdown][md]!
- **Sync Whereever You Want** - You can save notes locally, in Dropbox, or in Google Drive.

# Keybindings

This package does not by default provide any keyboard command shortcuts. There's no way to know what
keyboard shortcuts are even available on *your* machine. For example, on my machine I could map the
`toggle` command to `shift-cmd-j`. However if *you* have the popular `atom-script` package
installed on your machine, then there would be a conflict because that package also wants to use
that same keyboard shortcut. However, all is not lost!

Atom itself already provides you with everything you need to
[create your own custom keymaps][keymaps]. For example, the following `keymap.cson` would add a
shortcut for the `atom-notes` Toggle command:

```cson
'atom-text-editor':
  'shift-cmd-j': 'atom-notes:toggle'
```

## List of Commands Provided by Pretty JSON

Map any of the following commands to your own keyboard shortcuts as described above.

- `atom-notes:toggle`: Toggle the search box.
- `atom-notes:interlink`: Jumps to referred note when the cursor is on an `[[interlink]]`.

# Future Work

This package is in active development and I'm willing to review your pull requests and triage any
issues you're having. Please [report your issues][issues]!

If you'd like to take a stab at improving this package, please check out the following list of
improvements.

- A better screencast animated gif. I can't figure out how to make one that looks good.
- Refactor autocomplete to be less hacky -- add support to [`atom-select-list`][atom-select-list]?
- Use async to ensure the notes directory in then background.
- Use async to start loading documents in background at package activation time.
- Any improvements to package activation time are welcome.

---

[MIT][mit] © [lexicalunit][lexicalunit], [seongjaelee][seongjaelee] et [al][contributors]

[mit]:              http://opensource.org/licenses/MIT
[lexicalunit]:      http://github.com/lexicalunit
[seongjaelee]:      http://github.com/seongjaelee
[contributors]:     https://github.com/lexicalunit/atom-notes/graphs/contributors
[releases]:         https://github.com/lexicalunit/atom-notes/releases
[mit-badge]:        https://img.shields.io/apm/l/atom-notes.svg
[apm-pkg-link]:     https://atom.io/packages/atom-notes
[apm-ver-link]:     https://img.shields.io/apm/v/atom-notes.svg
[dl-badge]:         http://img.shields.io/apm/dm/atom-notes.svg
[travis-ci-badge]:  https://travis-ci.org/lexicalunit/atom-notes.svg?branch=master
[travis-ci]:        https://travis-ci.org/lexicalunit/atom-notes
[appveyor]:         https://ci.appveyor.com/project/lexicalunit/atom-notes?branch=master
[appveyor-badge]:   https://ci.appveyor.com/api/projects/status/a4fcn60mhewef9r0/branch/master?svg=true
[circle-ci]:        https://circleci.com/gh/lexicalunit/atom-notes/tree/master
[circle-ci-badge]:  https://circleci.com/gh/lexicalunit/atom-notes/tree/master.svg?style=shield
[david-badge]:      https://david-dm.org/lexicalunit/atom-notes.svg
[david]:            https://david-dm.org/lexicalunit/atom-notes
[issues]:           https://github.com/lexicalunit/atom-notes/issues

[nvatom]:           https://github.com/seongjaelee/nvatom
[nv]:               http://notational.net/
[md]:               http://daringfireball.net/projects/markdown/
[keymaps]:          http://flight-manual.atom.io/using-atom/sections/basic-customization/#customizing-keybindings
[screencast]:       https://user-images.githubusercontent.com/1903876/28757512-67bb005c-754a-11e7-99bd-5babb98ac056.gif
[atom-select-list]: https://github.com/atom/atom-select-list
