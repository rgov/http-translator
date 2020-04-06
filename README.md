![Build](https://github.com/rgov/http-translator/workflows/Node.js%20CI/badge.svg)

# HTTP Request Translator

This tool translates HTTP requests from a curl command-line invocation or raw HTTP request into Python or JavaScript code.

You can generate curl commands from several tools:

* **[Burp Suite](https://portswigger.net/burp):** Right-click on a request and select "Copy as curl command".

* **[Charles](https://www.charlesproxy.com):** Right-click on a request and select "Copy cURL Request".

* **Safari Web Inspector:** Right-click on a resource in the Network or Resources tab and select "Copy as cURL".

Thee tool is not complete; it doesn’t know about some basic things right now (such as cookies) or less common curl options such as `--proxy-header`. Contributions are welcome.

See also Matt Holt's [curl-to-Go](https://mholt.github.io/curl-to-go/), if that fits your use case better.


## Building from Source

    npm install && npm run build

Build results will be put in `/dist`. You can also run a development webserver with `npm run-script start:dev`.


## Implementation

This project is written in React. Please keep in mind this was an exercise in learning React, so the code may not be the best.

**Frontends** (in `lib/frontends`) parse the input and populate a Request object (in `lib/http-request.js`).

**Transforms** (in `lib/transforms`) perform some modification to the Request object, such as breaking up `application/x-www-form-urlencoded` content.

**Backends** (in `lib/backends`) consume the Request and generate the output.
