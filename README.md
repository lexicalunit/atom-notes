# Atom Notes
[![All Contributors](https://img.shields.io/badge/all_contributors-46-orange.svg?style=flat-square)](#contributors)

[![apm package][apm-ver-link]][releases]
[![travis-ci][travis-ci-badge]][travis-ci]
[![appveyor][appveyor-badge]][appveyor]
[![circle-ci][circle-ci-badge]][circle-ci]
[![david][david-badge]][david]
[![download][dl-badge]][apm-pkg-link]
[![mit][mit-badge]][mit]

This package is a fork and rewrite of the now unpublished package
[nvatom][nvatom]. The general idea behind this package is to provide an
embedded [Notational Velocity][nv]-like note-taking feature for Atom
users. This package is **NOT** affiliated with [Notational Velocity][nv].

![screencast][screencast]

## 🗒️ Features

[Notational Velocity][nv] is an application that stores and retrieves
notes. This package provides some similar features embedded directly in
your Atom editor.

- Modeless Operation
- Mouseless Interaction
- Incremental Search
- Interlinks

Embedding these features in Atom provides the following advantages.

- **Use Atom's Features** - Such as Syntax Highlighting and Tree View.
- **Use Other Packages** - Such as Markdown Preview and Minimap.
- **Multi-OS** - You can use it in macOS, Linux, and Windows.

With no new updates to [Notational Velocity][nv] in years, some users
are searching for alternatives with more features. For example Evernote.
We do not believe Evernote is a good alternative to
[Notational Velocity][nv]. Advantages over Evernote are:

- **Open Source**
- **No Rich Text** - Instead, you get to use [Markdown][md]!
- **Sync Wherever You Want** - You can save notes locally, in
  [Dropbox][dropbox], or in [Google Drive][drive].

Other solutions such as [nvALT][nvalt] are stand-alone applications which
don't have the same synergy with Atom as Atom Notes provides.

## ☁️ Synchronization / Cloud Storage

Most users prefer to have access to their notes from multiple computers.
This is not a feature of Atom Notes per se. Instead, please use your
favorite synchronization and/or cloud storage solution in conjunction
with Atom Notes. For example, if you store your notes in a directory
managed by [Dropbox][dropbox], then you will have all your notes
available to you on any machine you wish 🎉

## ⌨️ Keybindings

This package does not by default provide any keyboard command shortcuts.
There's no way to know what keyboard shortcuts are even available on
*your* machine. For example, on my machine I could map the Toggle command
to `shift-cmd-j`. However if *you* have the popular `atom-script` package
installed on your machine, then there would be a conflict because that
package also wants to use that same keyboard shortcut. However, all is
not lost!

Atom itself already provides you with everything you need to
[create your own custom keymaps][keymaps]. For example, the following
`keymap.cson` would add a shortcut for the `atom-notes` Toggle command:

```cson
'atom-text-editor':
  'shift-cmd-j': 'atom-notes:toggle'
```

### Provided Commands

Map any of the following commands to your own keyboard shortcuts as
described above.

- `atom-notes:toggle`: Toggle the search box.
- `atom-notes:interlink`: Jumps to referred note when the cursor is on
  an `[[interlink]]`.

## 🔮 Future Work

This package is in active development and I'm willing to review your pull
requests and triage any issues you're having. Please
[report your issues][issues]!

If you'd like to take a stab at improving this package, please check out
the following list of possible improvements.

- A better screencast animated gif.
- Refactor autocomplete to be less hacky -- add support to
  [`atom-select-list`][autocomplete]?
- Use async to ensure the notes directory in the background.
- Start loading documents in background at package activation time.
- Any improvements to package activation time are welcome.
- Write more spec tests!

## Contributors

Thanks goes to these wonderful people ([emoji key][emoji key]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars1.githubusercontent.com/u/948301?v=4" width="100px;"/><br /><sub>Seongjae Lee</sub>](http://bluebrown.net)<br />[💻](https://github.com/lexicalunit/atom-notes/commits?author=seongjaelee "Code") [📖](https://github.com/lexicalunit/atom-notes/commits?author=seongjaelee "Documentation") [🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aseongjaelee "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/1903876?v=4" width="100px;"/><br /><sub>Amy Troschinetz</sub>](http://lexicalunit.com)<br />[💻](https://github.com/lexicalunit/atom-notes/commits?author=lexicalunit "Code") [📖](https://github.com/lexicalunit/atom-notes/commits?author=lexicalunit "Documentation") [🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Alexicalunit "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/326587?v=4" width="100px;"/><br /><sub>Max Brunsfeld</sub>](https://github.com/maxbrunsfeld)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Amaxbrunsfeld "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/123837?v=4" width="100px;"/><br /><sub>Zachary Schneirov</sub>](http://notational.net/)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ascrod "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/98758?v=4" width="100px;"/><br /><sub>ChangZhuo Chen (陳昌倬)</sub>](http://czchen.info)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aczchen "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/1761899?v=4" width="100px;"/><br /><sub>MaxPower9</sub>](https://github.com/MaxPower9)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3AMaxPower9 "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/27955787?v=4" width="100px;"/><br /><sub>ashcomco</sub>](https://github.com/ashcomco)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aashcomco "Bug reports") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://avatars3.githubusercontent.com/u/761444?v=4" width="100px;"/><br /><sub>Tim Wisniewski</sub>](http://timwis.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Atimwis "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/684975?v=4" width="100px;"/><br /><sub>sseth</sub>](http://docs.flowr.space)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Asahilseth "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/17050866?v=4" width="100px;"/><br /><sub>johjeff</sub>](https://github.com/johjeff)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajohjeff "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/11411308?v=4" width="100px;"/><br /><sub>kafkapre</sub>](https://github.com/kafkapre)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Akafkapre "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/6908872?v=4" width="100px;"/><br /><sub>taw00</sub>](https://keybase.io/toddwarner)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ataw00 "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/14668027?v=4" width="100px;"/><br /><sub>Mason</sub>](http://lantay.github.io/myportfolio)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Alantay "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/9479788?v=4" width="100px;"/><br /><sub>lakonis</sub>](https://github.com/lakonis)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Alakonis "Bug reports") |
| [<img src="https://avatars0.githubusercontent.com/u/7547929?v=4" width="100px;"/><br /><sub>artyhedgehog</sub>](https://github.com/artyhedgehog)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aartyhedgehog "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/2319626?v=4" width="100px;"/><br /><sub>Nabil Kashyap</sub>](http://www.nabilk.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Abulbil "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/1843676?v=4" width="100px;"/><br /><sub>Jonathan Reeve</sub>](http://jonreeve.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3AJonathanReeve "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/10137?v=4" width="100px;"/><br /><sub>Deleted user</sub>](https://github.com/ghost)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aghost "Bug reports") [💻](https://github.com/lexicalunit/atom-notes/commits?author=ghost "Code") [📖](https://github.com/lexicalunit/atom-notes/commits?author=ghost "Documentation") | [<img src="https://avatars3.githubusercontent.com/u/59080?v=4" width="100px;"/><br /><sub>Christian Tietze</sub>](http://christiantietze.de)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3ADivineDominion "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/623?v=4" width="100px;"/><br /><sub>Jonathan Hoyt</sub>](http://theprogrammingbutler.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajonmagic "Bug reports") [💻](https://github.com/lexicalunit/atom-notes/commits?author=jonmagic "Code") | [<img src="https://avatars2.githubusercontent.com/u/3273868?v=4" width="100px;"/><br /><sub>benoitdepaire</sub>](https://github.com/benoitdepaire)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Abenoitdepaire "Bug reports") |
| [<img src="https://avatars0.githubusercontent.com/u/13486049?v=4" width="100px;"/><br /><sub>mo-tom</sub>](https://github.com/mo-tom)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Amo-tom "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/8367129?v=4" width="100px;"/><br /><sub>Jesse J. Anderson</sub>](https://github.com/jessejanderson)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajessejanderson "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/3911882?v=4" width="100px;"/><br /><sub>Denys Buzhor</sub>](https://github.com/geksilla)<br />[💻](https://github.com/lexicalunit/atom-notes/commits?author=geksilla "Code") | [<img src="https://avatars2.githubusercontent.com/u/4950036?v=4" width="100px;"/><br /><sub>Nikita Litvin</sub>](https://github.com/deltaidea)<br />[💻](https://github.com/lexicalunit/atom-notes/commits?author=deltaidea "Code") | [<img src="https://avatars2.githubusercontent.com/u/15906?v=4" width="100px;"/><br /><sub>Garth Kidd</sub>](https://github.com/garthk)<br />[📖](https://github.com/lexicalunit/atom-notes/commits?author=garthk "Documentation") | [<img src="https://avatars2.githubusercontent.com/u/6519351?v=4" width="100px;"/><br /><sub>PixelT</sub>](http://psdtohtml.ninja/)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3APixelT "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/4380600?v=4" width="100px;"/><br /><sub>Kris</sub>](https://github.com/kwouk)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Akwouk "Bug reports") |
| [<img src="https://avatars1.githubusercontent.com/u/165914?v=4" width="100px;"/><br /><sub>John Kamenik</sub>](http://jkamenik.github.io)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajkamenik "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/19962963?v=4" width="100px;"/><br /><sub>Rob</sub>](https://github.com/rsshel)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Arsshel "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/122398?v=4" width="100px;"/><br /><sub>Hendrik Buschmeier</sub>](https://purl.org/net/hbuschme)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ahbuschme "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/2706882?v=4" width="100px;"/><br /><sub>Alexandre Viau</sub>](http://www.alexandreviau.net/)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aaviau "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/6990297?v=4" width="100px;"/><br /><sub>brook shelley</sub>](http://brookshelley.github.io)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Abrookshelley "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/778457?v=4" width="100px;"/><br /><sub>Daniel Iwan</sub>](https://github.com/ivenhov)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aivenhov "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/4848043?v=4" width="100px;"/><br /><sub>Christopher Jones</sub>](http://onechrisjones.me)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aonechrisjones "Bug reports") |
| [<img src="https://avatars1.githubusercontent.com/u/1196745?v=4" width="100px;"/><br /><sub>Xiaoxing Hu</sub>](https://github.com/xiaoxinghu)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Axiaoxinghu "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/7566896?v=4" width="100px;"/><br /><sub>Aaron Strick</sub>](https://github.com/strickinato)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Astrickinato "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/16272380?v=4" width="100px;"/><br /><sub>OrcsBR</sub>](https://github.com/OrcsBR)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3AOrcsBR "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/42497?v=4" width="100px;"/><br /><sub>Zettt</sub>](http://www.macosxscreencasts.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3AZettt "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/2988?v=4" width="100px;"/><br /><sub>Jason Rudolph</sub>](http://jasonrudolph.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajasonrudolph "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/894119?v=4" width="100px;"/><br /><sub>Ben Guo</sub>](https://soundcloud.com/pastyou)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Abenzguo "Bug reports") | [<img src="https://avatars1.githubusercontent.com/u/13602288?v=4" width="100px;"/><br /><sub>zettler</sub>](https://github.com/zettler)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Azettler "Bug reports") |
| [<img src="https://avatars2.githubusercontent.com/u/695206?v=4" width="100px;"/><br /><sub>Richard Shaw</sub>](http://www.cita.utoronto.ca/~jrs65/)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Ajrs65 "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/174563?v=4" width="100px;"/><br /><sub>Aleksandar Kovač</sub>](https://github.com/alex-kovac)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Aalex-kovac "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/282759?v=4" width="100px;"/><br /><sub>Ben Balter</sub>](http://ben.balter.com)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Abenbalter "Bug reports") | [<img src="https://avatars3.githubusercontent.com/u/8494040?v=4" width="100px;"/><br /><sub>marek95</sub>](https://github.com/marek95)<br />[🐛](https://github.com/lexicalunit/atom-notes/issues?q=author%3Amarek95 "Bug reports") |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors]
specification. Contributions of any kind welcome!

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
[emoji-key]:        https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors

[nvatom]:           https://github.com/seongjaelee/nvatom
[nv]:               http://notational.net/
[md]:               http://daringfireball.net/projects/markdown/
[keymaps]:          http://flight-manual.atom.io/using-atom/sections/basic-customization/#customizing-keybindings
[screencast]:       https://user-images.githubusercontent.com/1903876/28757512-67bb005c-754a-11e7-99bd-5babb98ac056.gif
[autocomplete]:     https://github.com/atom/atom-select-list/issues/12
[nvalt]:            http://brettterpstra.com/projects/nvalt/
[dropbox]:          https://www.dropbox.com
[drive]:            https://www.google.com/drive/
