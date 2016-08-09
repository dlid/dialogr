# Dialogr

https://docs.dlid.se/dialogr

> I wanted a easy to use, no-fuzz stand-alone dialog library that I could just drop into any project and start using

Dialogr is a small self-dependant dialog library to easily open Iframe dialogs and communicating with the opening window.

Dialogr features:
  - "Snap responsivness" - the dialog will go fullscreen at configurable breakpoints
  - Promises and Web Communicate API to communicate between opener and dialog

### Version
0.0.8

### Tech

The following external modules are included and subject to its own license.

* [deferred-js] - A light standalone implementation of promises
* [Gulp] - The streaming build system

### Installation

Make sure to download and extract the [latest pre-built release](https://github.com/dlid/dialogr/releases). If you do not download a tagged release you may get code that is not yet fully tested.

Install the devDependencies and start the server.

```sh
$ cd dialogr
$ npm install gulp -g
$ npm install -d
```

### Todos

 - Ensure snap breakpoint works (height and width)
 - Ensure buttons can be created/replaced from Dialog Context
 - Utilize Gulp better
 - Split code into more managable modules
 - Documentation

License
----

MIT

   [deferred-js]: <https://github.com/warpdesign/deferred-js>
   [Gulp]: <http://gulpjs.com>
