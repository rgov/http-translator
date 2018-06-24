'use strict'

const url = require('url');


function python_escape(value, quote='\"') {
  var re = new RegExp('([' + quote + '\\\\])', 'g')
  return value.replace(re, '\\$1')
}

function emit_dict_of_values(dict) {
  
}


function generatePythonRequests(request, log=console.log) {
  // Emit the preamble
  var code = []
  code.push('import requests')
  code.push('')
  
  // Map the HTTP method to the function
  const methods = {
    DELETE:  'requests.delete',
    GET:     'requests.get',
    HEAD:    'requests.head',
    OPTIONS: 'requests.options',
    POST:    'requests.post',
    PUT:     'requests.put',
  }
  var func = methods[request.method] || 'requests.request'
  var isCustomMethod = !methods.hasOwnProperty(request.method)
  
  // Parse the URI
  var parsedURI = new URL(request.uri)
  
  // Try to break out URL parameters from the query string, if we can
  var emitQueryParams = (parsedURI.search !== '')
  if (emitQueryParams) {
    // Modify the URI we'll eventually emit so that it doesn't include the
    // query string
    request.uri = `${parsedURI.origin}${parsedURI.pathname}`
  }
  
  // Emit the function call, URL, and method
  code.push(`${func}(`)
  code.push(`  '${python_escape(request.uri)}',`)
  if (isCustomMethod) { code.push(`  method='${python_escape(request.method)}',`) }
  
  // Emit the URL params
  if (emitQueryParams) {
    // FIXME: We don't handle multiple parameters with the same name correctly
    code.push('  params={')
    for (const [name, value] of parsedURI.searchParams) {
      code.push(`    '${python_escape(name)}': '${python_escape(value)}',`)
    }
    code.push('  },')
  }
  
  // Drop the Host: header if it is not necessary
  // TODO: This should be a transform
  if (request.hasHeader('Host')) {
    var uselessHosts = []
    if (parsedURI.port === '') {
      uselessHosts.push(parsedURI.hostname)
      if (parsedURI.protocol === 'http:') { uselessHosts.push(`${parsedURI.hostname}:80`) }
      else if (parsedURI.protocol === 'https:') { uselessHosts.push(`${parsedURI.hostname}:443`) }
    }
      
    if (uselessHosts.includes(request.headers['Host'])) {
      log(`The Host header "${request.headers['Host']}" is redundant, so I dropped it`)
      delete request.headers['Host']
    }
  }
  
  // Drop the Content-Length header if it is redundant
  // TODO: This should be a transform
  if (request.hasHeader('Content-Length')) {
    const contentLength = parseInt(request.headers['Content-Length'])
    if (typeof request.body === 'string' && request.body.length === contentLength) {
      log(`The Content-Length header seemed redundant, so I dropped it`)
      delete request.headers['Content-Length']
    }
  }
  
  // Emit code for the headers
  code.push('  headers={')
  for (const name in request.headers) {
    const value = request.headers[name]
    code.push(`    '${python_escape(name)}': '${python_escape(value)}',`)
  }
  code.push('  },')
  
  // Finish the code and return it
  code.push(')')
  return code.join('\n')
}


exports.name = 'Python Requests'
exports.generate = generatePythonRequests
exports.highlighter = 'python'
