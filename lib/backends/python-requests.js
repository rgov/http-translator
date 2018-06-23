'use strict'


function generatePythonRequests(request) {
  var code = []
  code.push('import requests')
  code.push('')
  code.push('request.get("https://ryan.govost.es/")')
  return code.join('\n')
}


exports.name = 'Python Requests'
exports.generate = generatePythonRequests
exports.highlighter = 'python'
