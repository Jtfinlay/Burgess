tsc --module commonjs --outDir ./js-bin --sourceMap --removeComments -t ES5 server.ts
nodejs ./js-bin/server.js
