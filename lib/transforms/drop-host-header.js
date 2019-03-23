'use strict'

const url = require('url')


function dropHost(request, logger=console) {
  if (!request.hasHeader('Host')) { return }
  
  let parsedURI = new URL(request.uri)
  var uselessHosts = []
  if (parsedURI.port === '') {
    uselessHosts.push(parsedURI.hostname)
    if (parsedURI.protocol === 'http:') { uselessHosts.push(`${parsedURI.hostname}:80`) }
    else if (parsedURI.protocol === 'https:') { uselessHosts.push(`${parsedURI.hostname}:443`) }
  } else {
    uselessHosts.push(parsedURI.hostname + ':' + parsedURI.port)
  }
  
  if (uselessHosts.includes(request.headers['Host'])) {
    logger.log(`The Host header "${request.headers['Host']}" is implied by the URL, so I dropped it`)
    delete request.headers['Host']
  }
}


exports.name = 'Drop unnecessary Host header'
exports.transform = dropHost
