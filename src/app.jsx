'use strict'

// Removed Node's util.inspect; using JSON.stringify for browser-friendly logging

import React from 'react'
import ReactDOM from 'react-dom'

import CodeMirror from '@uiw/react-codemirror'
import { javascript as langJavaScript } from '@codemirror/lang-javascript'
import { json as langJson } from '@codemirror/lang-json'
import { python as langPython } from '@codemirror/lang-python'
import { EditorView, lineNumbers } from '@codemirror/view'

import frontendCurl from '../lib/frontends/curl'
import frontendHttp from '../lib/frontends/http'
import frontendJson from '../lib/frontends/json'

import transformDropContentLengthHeader from '../lib/transforms/drop-content-length-header'
import transformDropHostHeader from '../lib/transforms/drop-host-header'
import transformParseJsonData from '../lib/transforms/parse-json-data'
import transformSplitFormData from '../lib/transforms/split-form-data'

import backendJavascriptXhr from '../lib/backends/javascript-xhr'
import backendJson from '../lib/backends/json'
import backendPythonRequests from '../lib/backends/python-requests'


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
        strmsg += JSON.stringify(part, null, 2)
      }
    }

    this.setState({ messages: [
      ...this.state.messages,
      { type: type, content: strmsg }
    ]})
  }

  render() {
    return (
      <div className="logger">
        <ul>
          {this.state.messages.map((message, i) =>
            <li className={message.type}>{message.content}</li>
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
      frontendCurl,
      frontendHttp,
      frontendJson,
    ]
    this.state.transforms = [
      transformDropContentLengthHeader,
      transformDropHostHeader,
      transformParseJsonData,
      transformSplitFormData,
    ]
    this.state.backends = [
      backendJavascriptXhr,
      backendPythonRequests,
      backendJson,
    ]

    // Choose the default frontends
    this.state.frontend = this.state.frontends[0]
    this.state.backend  = this.state.backends[1]

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

  getLangHighlighter(highlighter) {
    switch (highlighter) {
      case 'javascript': return langJavaScript();
      case 'json': return langJson();
      case 'python': return langPython();
      // no http or shell highlighter
      default: return langJavaScript();
    }
  }

  render() {
    return (
      <div className="parent">
        <div className="child">
          <div className="nav">
            <ul className="nav-tabs">
              <li className="nav-item"><span className="nav-link active">Input</span></li>
            </ul>
            <ul className="nav-tabs controls">
              <li className="nav-item">
                <button
                  onClick={() => {
                    this.setState({ input: this.state.frontend.example })
                  }}
                  disabled={this.state.frontend.example === undefined}
                >Load Example</button>
              </li>
              <li className="nav-item">
                <select value={this.state.frontend.name} onChange={this.handleFrontendChange}>
                  {this.state.frontends.map(function(frontend, i) {
                    return <option key={frontend.name} value={frontend.name}>{frontend.name}</option>
                  })}
                </select>
              </li>
            </ul>
          </div>
          <div>
            <CodeMirror
              value={this.state.input}
              extensions={[
                lineNumbers(),
                this.getLangHighlighter(this.state.frontend.highlighter),
                EditorView.lineWrapping
              ]}
              onChange={(value) => { this.setState({ input: value }) }}
              onCreateEditor={(view) => { this.inputEditor = view }}
            />
          </div>
        </div>

        <div className="child">
          <div className="nav">
            <ul className="nav-tabs">
              <li className="nav-item">
                <a className={"nav-link" + (this.state.showLogTab ? "" : " active")}
                  onClick={(e) => {
                    this.setState({ showLogTab: false })
                    e.preventDefault()
                  }}
                  href="#">Output</a>
              </li>
              <li className="nav-item">
                <a className={"nav-link" + (this.state.showLogTab ? " active" : "") + (this.logger && this.logger.hasError() ? " error" : "")}
                  onClick={(e) => {
                    this.setState({ showLogTab: true })
                    e.preventDefault()
                  }}
                  href="#">Log</a>
              </li>
            </ul>
            <ul className="nav-tabs controls">
              <li className="nav-item">
                <select value={this.state.backend.name} onChange={this.handleBackendChange}>
                  {this.state.backends.map(function(backend, i) {
                    return <option key={backend.name} value={backend.name}>{backend.name}</option>
                  })}
                </select>
              </li>
            </ul>
          </div>
          <div>
            <div className={this.state.showLogTab ? "" : "hide"}>
              <Logger ref={(c) => this.logger = c} />
            </div>
            <div className={this.state.showLogTab ? "hide" : ""}>
              <CodeMirror
                value={this.state.output}
                extensions={[
                  lineNumbers(),
                  this.getLangHighlighter(this.state.backend.highlighter),
                  EditorView.lineWrapping
                ]}
                onCreateEditor={(view) => { this.outputEditor = view }}
                editable={false}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
