# HTTP Request Translator

This tool can be used for translating HTTP requests from one format to another. Currently, that means translating from a curl command-line invocation or raw HTTP request into Python Requests code.

Thee tool is not complete; it doesn’t know about some basic things right now (such as cookies) or less common curl options such as `--proxy-header`. Contributions are welcome.

**Hint:** You can generate curl commands in the Safari Web Inspector by right-clicking on a resource in the Network or Resources tab and selecting "Copy as cURL".

## Building from Source

    npm install && npx webpack

Build results will be put in `/dist`. You can also run a development webserver with `npm run-script start:dev`.

## Implementation

This project is written in React. Please keep in mind this was an exercise in learning React, so the code may not be the best.

**Frontends** (in `lib/frontends`) parse the input and populate a Request object (in `lib/http-request.js`).

**Transforms** (in `lib/transforms`) perform some modification to the Request object, such as breaking up `application/x-www-form-urlencoded` content.

**Backends** (in `lib/backends`) consume the Request and generate the output.
