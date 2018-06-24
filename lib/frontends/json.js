'use strict'

const http = require('../http-request')


function parseJSON(input, log=console.log) {
  return Object.assign(new http.Request, JSON.parse(input))
}


module.exports.name = 'JSON'
module.exports.parse = parseJSON
module.exports.highlighter = 'javascript'
