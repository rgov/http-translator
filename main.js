'use strict'

const React = require('react')
const ReactDOM = require('react-dom')
const CodeMirror = require('react-codemirror2')

const curlFrontend = require('./lib/frontends/curl')
const pyreqBackend = require('./lib/backends/python-requests')


// This tells Browserify to pull in these syntax highlighters. We cannot do this
// dynamically, so make sure to update this if new frontends or backends are
// added.
require('codemirror/mode/http/http')
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/python/python')
require('codemirror/mode/shell/shell')


class App extends React.Component {
  constructor() {
    super()
    this.state = {}
    
    // List the frontends, transforms, and backends we want to load
    this.state.frontends = [
      require('./lib/frontends/curl'),
      require('./lib/frontends/http'),
      require('./lib/frontends/json')
    ]
    this.state.transforms = [
      require('./lib/transforms/drop-host-header'),
      require('./lib/transforms/drop-content-length-header'),
      require('./lib/transforms/split-form-data'),
    ]
    this.state.backends = [
      require('./lib/backends/python-requests'),
      require('./lib/backends/json')
    ]
    
    // Choose the default frontends
    this.state.frontend = this.state.frontends[0]
    this.state.backend  = this.state.backends[0]
    
    // Set the default input and clear output
    this.state.input = this.state.frontend.example
    this.state.output = ''
    
    // Bind `this` so that handlers for JavaScript events work
    this.handleFrontendChange = this.handleFrontendChange.bind(this)
    this.handleBackendChange  = this.handleBackendChange.bind(this)
  }
  
  componentDidMount() {
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
    var p = Promise.resolve(this.state.input)
    p.then((input) => {
      return this.state.frontend.parse(input)
    }).then((request) => {
      for (let transform of this.state.transforms) {
        console.log('I will apply this transform:', transform.name)
        transform.transform(request)
      }
      return request
    }).then((request) => {
      return this.state.backend.generate(request)
    }).then((output) => {
      this.setState({ output: output })
    }).catch((error) => {
      // TODO: Present the error message to the user somehow
      console.log('I caught an error:', error)
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
      <div>
        <h2>Input</h2>
        <select value={this.state.frontend.name} onChange={this.handleFrontendChange}>
          {this.state.frontends.map(function(frontend, i) {
            return <option key={frontend.name} value={frontend.name}>{frontend.name}</option>
          })}
        </select>
        <button
          onClick={() => {
            this.setState({ input: this.state.frontend.example })
          }}
          disabled={this.state.frontend.example === undefined}
        >Load Example</button>
        <div>
          <CodeMirror.Controlled
            value={this.state.input}
            options={{
              mode: this.state.frontend.highlighter,
              theme: 'material',
              lineNumbers: true
            }}
            onBeforeChange={(editor, data, value) => {
              this.setState({ input: value })
            }}
          />
        </div>
          
        <h2>Output</h2>
        <select value={this.state.backend.name} onChange={this.handleBackendChange}>
          {this.state.backends.map(function(backend, i) {
            return <option key={backend.name} value={backend.name}>{backend.name}</option>
          })}
        </select>
        <div>
          <CodeMirror.Controlled
            value={this.state.output}
            options={{
              mode: this.state.backend.highlighter,
              theme: 'material',
              lineNumbers: true,
              readOnly: true
            }}
          />
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
