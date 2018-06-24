'use strict'

function python_escape(value, quote='\"') {
  var re = new RegExp('([' + quote + '\\\\])', 'g')
  return value.replace(re, '\\$1')
}

function generatePythonRequests(request) {
  var code = []
  code.push('import requests')
  code.push('')
  code.push('request.get(\'' + python_escape(request.uri) + '\')')
  return code.join('\n')
}


exports.name = 'Python Requests'
exports.generate = generatePythonRequests
exports.highlighter = 'python'
