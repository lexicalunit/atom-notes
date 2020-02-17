path = require('path')

module.exports =
  config:
    directory:
      order: 1
      title: 'Notes Directory'
      description: 'The directory to archive notes.'
      type: 'string'
      default: path.join(process.env.ATOM_HOME, 'atom-notes')
    ignorePaths:
      order: 2
      title: 'Ingore Paths'
      description: 'Ignore any files or directories with these names.'
      type: 'array'
      default: ['.git', '.DS_Store']
      items: { type: 'string' }
    extensions:
      order: 3
      title: 'Extensions'
      description: 'The first extension will be used for newly created notes.'
      type: 'array'
      default: ['.md', '.markdown', '.adoc', '.txt']
      items: { type: 'string' }
    enableAutosave:
      order: 4
      title: 'Enable Autosave'
      description: '''
        Enable saving the document automatically whenever the user leaves the
        window or change the tab.
      '''
      type: 'boolean'
      default: true
    useLunrPipeline:
      order: 5
      title: 'Use Lunr Pipeline'
      description: '''
        Lunr pipeline preprocesses query to make searching faster. However,
        it will skip searching common stop words such as "an" or "be".
      '''
      type: 'boolean',
      default: true
    orderByFuzzyFileNameMatch:
      order: 6
      title: 'Order by Fuzzy File Name Match'
      description: '''
        After search results are found from the document index, use
        fuzzaldrin-plus to order them.
      '''
      type: 'boolean'
      default: false
