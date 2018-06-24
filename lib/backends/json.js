'use strict'

function generateJSON(request) {
  return JSON.stringify(request, null, 2)
}


module.exports.name = 'JSON'
module.exports.generate = generateJSON
module.exports.highlighter = 'javascript'
