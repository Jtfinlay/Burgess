# Archiver

This program takes recent pushes to the position dB and aggregates it for easier interfacing, analytics, and priority.
```
export GOPATH=~/repos/Burgess/Processing (or wherever you cloned to, just ensure GOPATH is set properly)
go get gopkg.in/mgo.v2
go install processing
./bin/processing
```

And to run the tests, just run the following from the same directory:
```
go test priority -v
```

'Livefeed' contains a script that pushes make archived data to test the livefeed of the website.
It acts as a separate program, so run the above with the following changes:
```
go install livefeed
./bin/livefeed
```
