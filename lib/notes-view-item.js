/** @babel */
/** @jsx etch.dom */

import etch from 'etch'

export default class NotesViewItem {
  constructor (props, children) {
    this.item = props.item
    etch.initialize(this)
  }

  render () {
    return (
      <li class='two-lines'>
        <div class='primary-line'>
          <span>{this.item.title}</span>
          <div class='metadata'>{this.item.modifiedAt.toLocaleDateString()}</div>
        </div>
        <div class='secondary-line'>
          {this.item.body.slice(0, 100)}
        </div>
      </li>
    )
  }

  update (props, children) {
    return etch.update(this)
  }
}
