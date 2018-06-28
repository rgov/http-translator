'use strict'

const http = require('../http-request')


function parseJSON(input) {
  return Object.assign(new http.Request, JSON.parse(input))
}


module.exports.name = 'JSON'
module.exports.parse = parseJSON
module.exports.highlighter = { name: 'javascript', json: true }
