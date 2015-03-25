ROOT_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
GOPATH := $(ROOT_DIR)/Processing

make:
	go install processing

web_portal:
	rvmsudo rackup Web/config.ru

preprocessing:
	tsc --module commonjs --outDir ./PositionSystem/PositionSystem/js-bin --sourceMap --removeComments -t ES5 ./PositionSystem/PositionSystem/server.ts
	nodejs ./PositionSystem/PositionSystem/js-bin/server.js

postprocessing: make
	./Processing/bin/processing
test_go: make
	go test processing -v
	go test priority -v
	go test models -v

test_ruby:
	ruby Web/src/tests/test_analytics.rb
	ruby Web/src/tests/test_processing.rb

test: test_go test_ruby
