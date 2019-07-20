'use strict'

const shlex = require('shlex')
const argparse = require('argparse')

const http = require('../http-request')


// Patch argparse.ArgumentParser to log messages, rather than die
argparse.ArgumentParser.prototype._printMessage = function (message) {
  this.logger.log(message.replace(/\s+$/, ''))
}

argparse.ArgumentParser.prototype.exit = function (status, message) {
  if (message !== undefined) {
    (status ? this.logger.error : this.logger.log)(message.replace(/\s+$/, ''))
  }
  this.logger.log('The argument parser exited with status', status)
  this.exit_status = status
}


function parseCurlCommandLine(command, logger=console) {
  var argv = shlex.split(command)
  argv.shift()  // consume the leading `curl`

  var parser = new argparse.ArgumentParser({ prog: 'curl' })
  parser.logger = logger  // allow _printMessage patch to use our logger
  parser.addArgument(['url'])
  parser.addArgument(['--request', '-X'], { dest: 'method' })
  parser.addArgument(['--header', '-H'], { dest: 'headers', action: 'append'})
  parser.addArgument(['--referer', '-e'])
  parser.addArgument(['--user-agent', '-A'])
  parser.addArgument(['--data', '--data-ascii', '--data-binary', '--data-raw',
                      /*'--data-urlencode',*/ '-d'], { action: 'append'})
  var [args, extra] = (parser.parseKnownArgs(argv) || [])
  
  // If the parser died, don't continue
  if (parser.exit_status !== undefined) { return }
  
  // We don't parse all arguments. Be transparent about it.
  if (extra.length > 0) {
    logger.log('I skipped these unsupported arguments:', extra)
  }
  
  var req = new http.Request()
  req.uri = args.url
  
  for (const header of (args.headers || [])) {
    var match
    if (match = header.match(/^\s*([^:]+);\s*$/)) {
      req.headers[match[1]] = ''
    } else if (match = header.match(/^\s*([^:]+):\s*(.*?)\s*$/)) {
      req.headers[match[1]] = match[2]
    } else if (match = header.match(/^\s*([^:]+):\s*$/)) {
      // Tricky case, this syntax will unset a default header, but otherwise
      // won't unset a 
      var name = match[1]
      logger.log('I don\'t support unsetting headers (like ' + name + ') yet.')
    } else {
      logger.log('I don\'t understand this header:', header)
    }
  }
  
  // TODO: curl supports many ways of specifying the body of the request. We
  // will need a custom argparse Action that keeps the data in order.
  //
  //   * --data, --data-ascii, --data-raw -- possibly strip whitespace
  //   * --data-binary -- do not strip whitespace
  //   * --data-urlencode -- URL encode the *value* but not the key (if present)
  if (args.data) {
    if (!('Content-Type' in req.headers)) {
      req.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    req.method = 'POST'
    req.body = args.data.join('&')
  }

  // Allow overriding the method, or fall back to GET
  if (args.method) {
    req.method = args.method
  } else if (req.method === null) {
    req.method = 'GET'
  }

  return req
}


module.exports.name = 'curl'
module.exports.parse = parseCurlCommandLine
module.exports.highlighter = 'shell'

module.exports.example = `
curl 'http://seethroughny.net/tools/required/reports/payroll?action=get' \\
-XPOST \\
-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \\
-H 'Origin: http://seethroughny.net' \\
-H 'Host: seethroughny.net' \\
-H 'Accept: application/json, text/javascript, */*; q=0.01' \\
-H 'Connection: keep-alive' \\
-H 'Accept-Language: en-us' \\
-H 'Accept-Encoding: gzip, deflate' \\
-H 'Cookie: CONCRETE5=291419e390a3b67a3946e0854cc9e33e' \\
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15' \\
-H 'Referer: http://seethroughny.net/payrolls' \\
-H 'Content-Length: 137' \\
-H 'X-Requested-With: XMLHttpRequest' \\
--data 'PayYear%5B%5D=2017&SortBy=YTDPay+DESC&current_page=0&result_id=0&url=%2Ftools%2Frequired%2Freports%2Fpayroll%3Faction%3Dget&nav_request=0'
`.trim()
