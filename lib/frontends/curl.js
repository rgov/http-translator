'use strict'

import * as argparse from 'argparse'
import * as shlex from 'shlex'
import BrowserStdout from 'browser-stdout'
import { Request } from '../http-request'


// Patch process.stdout to use browser-stdout
process.stdout = BrowserStdout()


// Patch argparse.ArgumentParser to log messages, rather than die
class ArgumentParser extends argparse.ArgumentParser {
  _printMessage (message) {
    this.logger.log(message.replace(/\s+$/, ''))
  }

  exit (status, message) {
    if (message !== undefined) {
      (status ? this.logger.error : this.logger.log)(message.replace(/\s+$/, ''))
    }
    this.logger.log('The argument parser exited with status', status)
    this.exit_status = status
  }
}


function parseCurlCommandLine(command, logger=console) {
  var argv = shlex.split(command)
  argv.shift()  // consume the leading `curl`

  var parser = new ArgumentParser({ prog: 'curl' })
  parser.logger = logger  // allow _printMessage patch to use our logger
  parser.add_argument('url')
  parser.add_argument('--request', '-X', { dest: 'method' })
  parser.add_argument('--header', '-H', { dest: 'headers', action: 'append'})
  parser.add_argument('--referer', '-e')
  parser.add_argument('--user-agent', '-A')
  parser.add_argument('--data', '--data-ascii', '--data-binary', '--data-raw',
                      /*'--data-urlencode',*/ '-d', { action: 'append'})
  var [args, extra] = (parser.parse_known_args(argv) || [])
  
  // If the parser died, don't continue
  if (parser.exit_status !== undefined) { return }
  
  // We don't parse all arguments. Be transparent about it.
  if (extra.length > 0) {
    logger.log('I skipped these unsupported arguments:', extra)
  }
  
  var req = new Request()
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


export const name = 'curl'
export const parse = parseCurlCommandLine
export const highlighter = 'shell'

export const example = `
curl 'http://example.com/api/v2/defragment' \\
  -H 'Host: example.com' \\
  -H 'Content-Length: 19' \\
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \\
  -H 'Cookie: session=291419e390a3b67a3946e0854cc9e33e' \\
  -H 'Referer: http://example.com/' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15' \\
  -H 'X-Requested-With: XMLHttpRequest' \\
  --data 'drive=C&confirm=yes'
`.trim()

export default {
  name,
  parse,
  highlighter,
  example,
}
