'use strict'


// https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
const xhrForbiddenHeaders = [
  "Accept-Charset",
  "Accept-Encoding",
  "Access-Control-Request-Headers",
  "Access-Control-Request-Method",
  "Connection",
  "Content-Length",
  "Cookie",
  "Cookie2",
  "Date",
  "DNT",
  "Expect",
  "Host",
  "Keep-Alive",
  "Origin",
  /^Proxy-/i,
  /^Sec-/i,
  "Referer",
  "TE",
  "Trailer",
  "Transfer-Encoding",
  "Upgrade",
  "Via"
]

function javascript_escape(value, quote='"') {
  return value.replace(new RegExp('([' + quote + '\\\\])', 'g'), '\\$1')
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t')
              .replace(/\r/g, '\\r')
              .replace(/[^ -~]+/g, function (match) {
                var hex = new Buffer(match).toString('hex')
                return hex.replace(/(..)/g, '\\x$1')
              })
}

function generateJavascriptXHR(request, logger=console) {
  // Emit the preamble
  var code = []
  code.push('var xhr = new XMLHttpRequest()')
  
  // Parse the URI
  var parsedURI = new URL(request.uri)

  // Remove the username and password from the URL
  var username = parsedURI.username
  var password = parsedURI.password
  parsedURI.username = parsedURI.password = ''

  // Output the open() method
  var open = `xhr.open("${request.method}", "${parsedURI.href}"`
  open += ", false" // asynchronous
  if (!!username && !!password) {
    open += `, "${username}", "${password}"`
  } else if (!!username && !password) {
    open += `, "${username}"`
  } else if (!username && !!password) {
    open += `, "", "${password}"`
  }
  open += ')'
  code.push(open)

  // Emit code for the headers
  if (Object.keys(request.headers).length > 0) {
    for (const name in request.headers) {
      // Scan the list of forbidden headers
      var verboten = false
      for (const pattern of xhrForbiddenHeaders) {
        console.log(pattern)
        if (typeof pattern === 'string') {
          if (name.toLowerCase() === pattern.toLowerCase()) {
            verboten = true
            break
          }
        } else if (name.match(pattern)) {
          verboten = true
          break
        }
      }

      if (verboten) {
        logger.error(`Omitting forbidden ${name} header`)
        continue
      }

      const value = request.headers[name]
      code.push(`xhr.setRequestHeader("${name}", "${value}")`)
    }
  }

  // Add some placeholders for handlers
  code.push('xhr.onload = function (e) { /* ... */ }')
  code.push('xhr.onerror = function (e) { /* ... */ }')

  // Add the send command
  if (request.jsonData !== undefined) {
    var json = JSON.stringify(request.jsonData, null, 2)
    code.push(`xhr.send(JSON.stringify(${json}))`)
  } else if (typeof request.body === 'string' && request.body != '') {
    code.push(`xhr.send("${javascript_escape(request.body)}")`)
  } else {
    code.push(`xhr.send(null)`)
  }
  

  return code.join('\n')
}


export const name = 'JavaScript (XMLHttpRequest)'
export const generate = generateJavascriptXHR
export const highlighter = 'javascript'

export default {
  name,
  generate,
  highlighter,
}
