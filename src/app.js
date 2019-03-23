'use strict'

const util = require('util')

const React = require('react')
const ReactDOM = require('react-dom')

const CodeMirror = require('react-codemirror2')
const CodeMirrorJS = require('codemirror')


// This tells webpack to pull in these syntax highlighters. We cannot do this
// dynamically, so make sure to update this if new frontends or backends are
// added.
require('codemirror/mode/http/http')
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/python/python')
require('codemirror/mode/shell/shell')


class Logger extends React.Component {
  constructor() {
    super()
    this.state = {
      messages: []
    }
    
    this.log = this.log.bind(this)
    this.error = this.error.bind(this)
  }
  
  clear() {
    this.setState({ messages: [] })
  }

  addSection(name) {
    this._appendLog('section', [ name ])
  }
  
  log() {
    this._appendLog('log', Array.from(arguments))
  }
  
  error() {
    console.error.apply(console, Array.from(arguments))
    this._appendLog('error', Array.from(arguments))
  }
  
  hasError() {
    for (let message of this.state.messages) {
      if (message.type === 'error')
        return true;
    }
    return false;
  }
  
  _appendLog(type, message) {
    let strmsg = '';
    for (let part of message) {
      if (typeof part === 'string') {
        strmsg += `${part} `
      } else {
        strmsg += util.inspect(part)
      }
    }

    this.setState({ messages: [
      ...this.state.messages,
      { type: type, content: strmsg }
    ]})
  }
  
  render() {
    return (
      <div class="logger">
        <ul>
          {this.state.messages.map((message, i) =>
            <li class={message.type}>{message.content}</li>
          )}
        </ul>
      </div>
    )
  }
}


class App extends React.Component {
  constructor() {
    super()
    this.state = {}
    
    // List the frontends, transforms, and backends we want to load
    this.state.frontends = [
      require('../lib/frontends/curl'),
      require('../lib/frontends/http'),
      require('../lib/frontends/json')
    ]
    this.state.transforms = [
      require('../lib/transforms/drop-content-length-header'),
      require('../lib/transforms/drop-host-header'),
      require('../lib/transforms/parse-json-data'),
      require('../lib/transforms/split-form-data'),
    ]
    this.state.backends = [
      require('../lib/backends/python-requests'),
      require('../lib/backends/json')
    ]
    
    // Choose the default frontends
    this.state.frontend = this.state.frontends[0]
    this.state.backend  = this.state.backends[0]
    
    // Set the default input and clear output
    this.state.input = this.state.frontend.example
    this.state.output = ''
    
    // Set the tab we want to show
    this.state.showLogTab = false
    
    // Bind `this` so that handlers for JavaScript events work
    this.handleFrontendChange = this.handleFrontendChange.bind(this)
    this.handleBackendChange  = this.handleBackendChange.bind(this)
    
    // These will store our code editor instances, after they've mounted
    this.inputEditor = null
    this.outputEditor = null
  }
  
  componentDidMount() {
    // Wire up the renderLine handler on both of them
    for (let editor of [this.inputEditor, this.outputEditor]) {
      editor.on('renderLine', (cm, line, elt) => {
        let charWidth = editor.defaultCharWidth()
        let hangingIndent = charWidth * 2
        var off = CodeMirrorJS.countColumn(line.text, null, cm.getOption('tabSize')) * charWidth
        elt.style.textIndent = `-${hangingIndent + off}px`
        elt.style.paddingLeft = `${hangingIndent + off}px`
      })
      editor.refresh()
    }
    
    // Kick off the initial generation
    this.handleCodeChange()
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    // Re-generate if any of the input parameters changed 
    if ((this.state.input !== prevState.input ||
        this.state.frontend !== prevState.frontend ||
        this.state.backend !== prevState.backend) &&
        this.state.output === prevState.output) {
          
      this.handleCodeChange()
    }
  }
  
  handleCodeChange() {
    this.logger.clear()
    var p = Promise.resolve(this.state.input)
    p.then((input) => {
      this.logger.addSection(`Frontend: ${this.state.frontend.name}`)
      return this.state.frontend.parse(input, this.logger)
    }).then((request) => {
      for (let transform of this.state.transforms) {
        this.logger.addSection(`Transform: ${transform.name}`)
        transform.transform(request, this.logger)
      }
      return request
    }).then((request) => {
      this.logger.addSection(`Backend: ${this.state.backend.name}`)
      return this.state.backend.generate(request, this.logger)
    }).then((output) => {
      this.setState({ output: output })
    }).catch((error) => {
      this.logger.error(error)
    })
  }
  
  handleFrontendChange(event) {
    for (var frontend of this.state.frontends) {
      if (frontend.name === event.target.value) {
        this.setState({ frontend: frontend })
        return
      }
    }
  }
  
  handleBackendChange(event) {
    for (var backend of this.state.backends) {
      if (backend.name === event.target.value) {
        this.setState({ backend: backend })
        return
      }
    }
  }
  
  render() {
    return (      
      <div class="parent">
        <div class="child">
          <div class="nav">
            <ul class="nav-tabs">
              <li class="nav-item"><span class="nav-link active">Input</span></li>
            </ul>
            <ul class="nav-tabs controls">
              <li class="nav-item">
                <button
                  onClick={() => {
                    this.setState({ input: this.state.frontend.example })
                  }}
                  disabled={this.state.frontend.example === undefined}
                >Load Example</button>
              </li>
              <li class="nav-item">
                <select value={this.state.frontend.name} onChange={this.handleFrontendChange}>
                  {this.state.frontends.map(function(frontend, i) {
                    return <option key={frontend.name} value={frontend.name}>{frontend.name}</option>
                  })}
                </select>
              </li>
            </ul>
          </div>
          <div>
            <CodeMirror.Controlled
              value={this.state.input}
              options={{
                mode: this.state.frontend.highlighter,
                lineNumbers: true,
                lineWrapping: true,
                viewportMargin: Infinity
              }}
              onBeforeChange={(editor, data, value) => {
                this.setState({ input: value })
              }}
              editorDidMount={(editor) => { this.inputEditor = editor }}
            />
          </div>
        </div>
          
        <div class="child">
          <div class="nav">
            <ul class="nav-tabs">
              <li class="nav-item">
                <a class={"nav-link" + (this.state.showLogTab ? "" : " active")}
                  onClick={(e) => {
                    this.setState({ showLogTab: false })
                    e.preventDefault()
                  }}
                  href="#">Output</a>
              </li>
              <li class="nav-item">
                <a class={"nav-link" + (this.state.showLogTab ? " active" : "") + (this.logger && this.logger.hasError() ? " error" : "")} 
                  onClick={(e) => {
                    this.setState({ showLogTab: true })
                    e.preventDefault()
                  }}
                  href="#">Log</a>
              </li>
            </ul>
            <ul class="nav-tabs controls">
              <li class="nav-item">
                <select value={this.state.backend.name} onChange={this.handleBackendChange}>
                  {this.state.backends.map(function(backend, i) {
                    return <option key={backend.name} value={backend.name}>{backend.name}</option>
                  })}
                </select>
              </li>
            </ul>
          </div>
          <div>
            <div class={this.state.showLogTab ? "" : "hide"}>
              <Logger ref={(c) => this.logger = c} />
            </div>
            <div class={this.state.showLogTab ? "hide" : ""}>
              <CodeMirror.Controlled
                value={this.state.output}
                options={{
                  mode: this.state.backend.highlighter,
                  lineNumbers: true,
                  lineWrapping: true,
                  viewportMargin: Infinity,
                  readOnly: true
                }}
                editorDidMount={(editor) => { this.outputEditor = editor }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
