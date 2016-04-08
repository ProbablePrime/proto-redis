# proto-redis
A redis protocol parser/encoder written in node.

Parser exists in src/Parser.js

TODO:
* [x] Strings
* [x] Ints
* [x] Errors
* [x] Bulk strings
* [x] single dimensional arrays
* [ ] Multi dimensional arrays
* [ ] buffer concating? server sends a large array in line segments concat and parse

Notes:

Semi concered about state management on the buffer. When we get a buffer we need to workout if it makes sense as a logical set of instructions. If it doesn't we need to wait for more data. Not sure this can happen but need to read the spec more.

