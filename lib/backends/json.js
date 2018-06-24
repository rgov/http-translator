'use strict'

function generateJSON(request) {
  return JSON.stringify(request)
}


module.exports.name = 'JSON'
module.exports.generate = generateJSON
module.exports.highlighter = 'javascript'
