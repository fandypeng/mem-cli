# mem-cli

  A memcache client

## Installation

    $ npm install -g mem-cli

 For now clone and:

    $ npm install
    $ ./bin/mem-cli

## About

  This is a simple memcache client write by node.js
  just a few common functions.

## Features

  Small set of features so far:

  - get
  - set
  - keys

### Built-ins

  Currently the following built-ins are available:

  - `keys *` -- show all memcache keys

### Sourcing

  You may source files much like you do with `require()` in node,
  support you have "test.js", you may load it with either of
  the following:

```
▸ . test.js
▸ . test
```

## Debugging

```js

```

Usage:

```shell
▸ get key
"value"
▸ set key new_value
STORED
▸ keys *
"key"
"key1"
"key2"
"key3"
"key4"
```


## License

```(The MIT License)

Copyright (c) 2016 Fandy Peng &lt;fandypeng@163.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.```