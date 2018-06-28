'use strict'

const http = require('../http-request')

// This is a JavaScript reimplementation of Node's HTTP parser
const HTTPParser = require('http-parser-js').HTTPParser


function parseHTTP(input, logger=console) {
  // Since it may be hard to get CRLFs into the text area, we can try to be
  // smart about adding them back in.
  if (!input.includes('\r\n')) {
    let i = input.indexOf('\n\n')
    if (i !== -1) {
      let before = input.substring(0, i+2)
      let after = input.substring(i+2)
      input = before.replace(/\n/g, '\r\n') + after
    }
  }
  
  return new Promise((resolve, reject) => {
    var parser = new HTTPParser(HTTPParser.REQUEST)
    var request = new http.Request()
    
    parser[HTTPParser.kOnHeadersComplete] = (info) => {
      request.uri = info.url
      request.method = HTTPParser.methods[info.method]
      for (let i = 0; i < info.headers.length; i += 2) {
        request.headers[info.headers[i]] = info.headers[i+1]
      }
    }
    
    parser[HTTPParser.kOnBody] = (b, start, len) => {
      request.body = b.toString('utf8', start, start + len)
    }
    
    parser[HTTPParser.kOnMessageComplete] = () => {
      // If there is a Host header, we need to patch up the URL
      if (request.hasHeader('Host')) {
        request.uri = `http://${request.headers['Host']}${request.uri}`
      } else {
        request.uri = `http://localhost${request.uri}`
      }
      resolve(request)
    }
    
    // Execute the parser
    let buffer = Buffer.from(input)
    parser.execute(buffer, 0, buffer.length)
    parser.finish()
  })
}


module.exports.name = 'HTTP'
module.exports.parse = parseHTTP
module.exports.highlighter = 'http'

module.exports.example = `
POST / HTTP/1.1
Host: example.com
User-Agent: curl/7.54.0
Accept: */*
Content-Length: 11
Content-Type: application/x-www-form-urlencoded

hello=world
`.trim()
