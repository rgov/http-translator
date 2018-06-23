#!/usr/bin/env node
'use strict'

const curlFrontend = require('./frontends/curl')
const pyreqBackend = require('./backends/python-requests')


var example = `curl 'http://seethroughny.net/tools/required/reports/payroll?action=get' \
-XPOST \
-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
-H 'Origin: http://seethroughny.net' \
-H 'Host: seethroughny.net' \
-H 'Accept: application/json, text/javascript, */*; q=0.01' \
-H 'Connection: keep-alive' \
-H 'Accept-Language: en-us' \
-H 'Accept-Encoding: gzip, deflate' \
-H 'Cookie: CONCRETE5=291419e390a3b67a3946e0854cc9e33e' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15' \
-H 'Referer: http://seethroughny.net/payrolls' \
-H 'Content-Length: 137' \
-H 'X-Requested-With: XMLHttpRequest' \
--data 'PayYear%5B%5D=2017&SortBy=YTDPay+DESC&current_page=0&result_id=0&url=%2Ftools%2Frequired%2Freports%2Fpayroll%3Faction%3Dget&nav_request=0'`

var req = curlFrontend.parse(example)
var out = pyreqBackend.generate(req)
console.log(out)
