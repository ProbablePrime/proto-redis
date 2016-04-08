# proto-redis
A redis protocol parser/encoder written in node.

Parser exists in src/Parser.js
Encoder exists in src/Encoder.js

TODO:
* [x] Strings
* [x] Ints
* [x] Errors
* [x] Bulk strings
* [x] single dimensional arrays
* [x] Multi dimensional arrays
* [x] null arrays
* [x] buffer concating? server sends a large array in line segments concat and parse
* [x] encoder
* [ ] encoding null arrays and null values to be -1

Further Improvement: 
* Hook it up to a STDIN,STDOUT script to form a basic redis CLI to talk to a real server for some integration testing
* Test super long numbers parseInt is apparently slow for those
* adjust parser errors to better reflect what's wrong
* Test more parser errors
* Look into pipelining. This should probably be handled by a client node module but we need to ensure the module doesn't preclude a user from using pipelining

