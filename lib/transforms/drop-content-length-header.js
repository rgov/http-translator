'use strict'

function dropContentLength(request, log=console.log) {
  if (!request.hasHeader('Content-Length')) { return }
  
  const contentLength = parseInt(request.headers['Content-Length'])
  if (typeof request.body === 'string' && request.body.length === contentLength) {
    log(`The Content-Length header seemed unnecessary, so I dropped it`)
    delete request.headers['Content-Length']
  }
}


exports.name = 'Drop unnecessary Content-Length header'
exports.transform = dropContentLength
