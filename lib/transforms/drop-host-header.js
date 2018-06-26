'use strict'

const url = require('url');


function dropHost(request, log=console.log) {
  if (!request.hasHeader('Host')) { return }
  
  let parsedURI = new URL(request.uri)
  var uselessHosts = []
  if (parsedURI.port === '') {
    uselessHosts.push(parsedURI.hostname)
    if (parsedURI.protocol === 'http:') { uselessHosts.push(`${parsedURI.hostname}:80`) }
    else if (parsedURI.protocol === 'https:') { uselessHosts.push(`${parsedURI.hostname}:443`) }
  }
    
  if (uselessHosts.includes(request.headers['Host'])) {
    log(`The Host header "${request.headers['Host']}" is redundant, so I dropped it`)
    delete request.headers['Host']
  }
}


exports.name = 'Drop unnecessary Host header'
exports.transform = dropHost
