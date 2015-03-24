make:
	export GOPATH=`pwd`/Processing
	go install processing

web_portal:
	rvmsudo rackup Web/config.ru

preprocessing:
	// TODO::JT

postprocessing: make
	./Processing/bin/processing
	
test_go: make
	go test processing
	go test priority
	go test models

test_ruby:
	ruby Web/src/tests/test_analytics.rb
	ruby Web/src/tests/test_processing.rb

test: test_go test_ruby
