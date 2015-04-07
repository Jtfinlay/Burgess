#Tier 3 - Web Portal

You will require rvm, ruby, sinatra, bundler

Download and run:

	git clone https://github.com/Jtfinlay/Burgess.git

	cd Burgess/Web
	gem install bundler
	bundle install --deployment		# To install gems
	rvmsudo rackup					# To run portal

### Testing:

Javascript testing uses QUnit. Visit the following html files in the browser to perform tests:

 - Burgess/Web/public/js/testing/test_models.html
 - Burgess/Web/public/js/testing/test_livefeed.html
 - Burgess/Web/public/js/testing/test_analytics.html


Ruby tests can be run from the console. These tests can be run in the directory:

... /Burgess/Web/src/tests