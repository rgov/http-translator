'use strict'

function dropContentLength(request, logger=console) {
  if (!request.hasHeader('Content-Length')) { return }
  
  const contentLength = parseInt(request.headers['Content-Length'])
  if (typeof request.body === 'string' && request.body.length === contentLength) {
    logger.log(`The Content-Length header seemed unnecessary, so I dropped it`)
    delete request.headers['Content-Length']
  }
}


exports.name = 'Drop unnecessary Content-Length header'
exports.transform = dropContentLength
