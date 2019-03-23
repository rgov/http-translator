'use strict'

const url = require('url')


function python_escape(value, quote='\'') {
  return value.replace(new RegExp('([' + quote + '\\\\])', 'g'), '\\$1')
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t')
              .replace(/\r/g, '\\r')
              .replace(/[^ -~]+/g, function (match) {
                var hex = new Buffer(match).toString('hex')
                return hex.replace(/(..)/g, '\\x$1')
              })
}

function pythonize(obj) {
  // This flag tracks whether a failure occurred at some depth
  let fail = false
  
  function _pythonize(obj) {
    // TODO: Pretty printing
    if (typeof obj === 'string') {
      return '\'' + python_escape(obj) + '\''
    } else if (typeof obj === 'number') {
      return obj
    } else if (typeof obj === 'boolean') {
      return obj ? 'True' : 'False'
    } else if (obj === null || obj === undefined) {
      return 'None'
    } else if (Array.isArray(obj)) {
      return '[ ' + obj.map(_pythonize).join(', ') + ' ]'
    } else if (obj.constructor === Object) {
      var rows = []
      for (let k in obj) {
        rows.push(_pythonize(k) + ': ' + _pythonize(obj[k]))
      }
      return '{ ' + rows.join(', ') + ' }'
    } else {
      fail = true
      return undefined
    }
  }
  
  // Return undefined if there was a failure at any depth
  let result = _pythonize(obj)
  if (fail)
    return undefined
  return result
}



function generatePythonRequests(request, logger=console) {
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
  code.push(`  ${pythonize(request.uri)},`)
  if (isCustomMethod) { code.push(`  method=${pythonize(request.method)},`) }
  
  // Emit the URL params
  if (emitQueryParams) {
    // FIXME: We don't handle multiple parameters with the same name correctly
    code.push('  params={')
    for (const [name, value] of parsedURI.searchParams) {
      code.push(`    ${pythonize(name)}: ${pythonize(value)},`)
    }
    code.push('  },')
  }
  
  // Emit code for the headers
  if (Object.keys(request.headers).length > 0) {
    code.push('  headers={')
    for (const name in request.headers) {
      const value = request.headers[name]
      code.push(`    ${pythonize(name)}: ${pythonize(value)},`)
    }
    code.push('  },')
  }
  
  // Try to convert JSON to a Python object
  let json = undefined
  if (request.jsonData !== undefined) {
    json = pythonize(request.jsonData)
    if (json === undefined)
      logger.log('Failed to convert JSON payload to Python')
  }
  
  // Emit code for the data
  if (json) {
    code.push(`  json=${json},`)
  } else if (request.formData !== undefined && Object.keys(request.formData).length > 0) {
    code.push('  data={')
    for (const name in request.formData) {
      const value = request.formData[name]
      code.push(`    ${pythonize(name)}: ${pythonize(value)},`)
    }
    code.push('  },')
  } else if (typeof request.body === 'string' && request.body != '') {
    code.push(`  data=${pythonize(request.body)},`)
  }
  
  // Finish the code and return it
  code.push(')')
  return code.join('\n')
}


exports.name = 'Python Requests'
exports.generate = generatePythonRequests
exports.highlighter = 'python'
