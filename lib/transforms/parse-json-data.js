'use strict'


// Regular expression for matching a `token`, from RFC 2616
const tokenRegex = /[^()<>@,;:\\"/\[\]?={} \t]+/
const mediaTypeRegex = new RegExp(
  '^(' + tokenRegex.source + ')/(' + tokenRegex.source + ')'
)


function parseJsonData(request, logger=console) {
  if (!request.hasHeader('Content-Type')) { return }
  
  // Extract the type/subtype from the Content-Type header
  var match = request.headers['Content-Type'].match(mediaTypeRegex)
  if (!match) {
    logger.log('I can\'t parse this Content-Type:',
      request.headers['Content-Type'])
    return
  }
  
  // Stop if not application/json
  if (match[1] !== 'application' || match[2] !== 'json') {
    return
  }
  
  // If there's a trailer afterwards, for instance the charset, we ignore it
  if (match[0].length != request.headers['Content-Type'].length) {
    let trailer = request.headers['Content-Type'].substring(match[0].length)
    logger.log('Ignoring trailer after Content-Type:', trailer)
  }
  
  // Try to parse
  try {
    request.jsonData = JSON.parse(request.body || '')
  } catch (err) {
    logger.log(err.message)
    return
  }
  
  // If successful, drop the Content-Type header
  delete request.headers['Content-Type']
}


exports.name = 'Parse JSON content'
exports.transform = parseJsonData
