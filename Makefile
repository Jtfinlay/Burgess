ROOT_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
GOPATH := $(ROOT_DIR)/Processing

make:
	go install processing

web_portal:
	rvmsudo rackup Web/config.ru

preprocessing:
	// TODO::JT

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
