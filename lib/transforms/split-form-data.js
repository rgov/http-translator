'use strict'

const querystring = require('querystring')


// Regular expression for matching a `token`, from RFC 2616
const tokenRegex = /[^()<>@,;:\\"/\[\]?={} \t]+/
const mediaTypeRegex = new RegExp(
  '^(' + tokenRegex.source + ')/(' + tokenRegex.source + ')'
)


function splitFormData(request, logger=console) {
  if (!request.hasHeader('Content-Type')) { return }
  
  // Extract the type/subtype from the Content-Type header
  var match = request.headers['Content-Type'].match(mediaTypeRegex)
  if (!match) {
    logger.log('I can\'t parse this Content-Type:',
      request.headers['Content-Type'])
    return
  }
  
  // Stop if not application/x-www-form-urlencoded
  if (match[1] !== 'application' || match[2] !== 'x-www-form-urlencoded') { 
    return
  }
  
  // If there's a trailer afterwards, for instance the charset, we ignore it
  if (match[0].length != request.headers['Content-Type'].length) {
    let trailer = request.headers['Content-Type'].substring(match[0].length)
    logger.log('Ignoring trailer after Content-Type:', trailer)
  }
  
  request.formData = querystring.parse(request.body || '')
  // delete request.body
}


exports.name = 'Split x-www-form-urlencoded content'
exports.transform = splitFormData
