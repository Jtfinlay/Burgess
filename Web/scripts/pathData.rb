require 'rubygems'
require 'ruby-progressbar'
require 'mongo'
include Mongo

class PathScript

	def run
		mongo_client = Mongo::MongoClient.new("localhost", 27017)
		db = mongo_client.db('retailers')

		id = "aaaaaaaa"
		width = 13.26
		height = 12.24
		step_size = 0.01

		xi = 0
		yi = 0
		ti = Time.new(2015, 03, 3)
		tf = Time.new(2015,03,4).to_i
		priority = 0

		p = ProgressBar.create(:total => (tf.to_i - ti.to_i)/5+1)

		(ti.to_i..tf.to_i).step(5) { |t|
			xi = [0, [width, xi + step_size/2.0 - rand(10*step_size)/10 ].min].max
			yi = [0, [width, yi + step_size/2.0 - rand(10*step_size)/10 ].min].max
			priority += 0.005
			if (priority >= 1.3) 
				priority = 0
			end
			doc = {
				"bluetooth" => nil,
				"wifi" => id,
				"x" => xi,
				"y" => yi,
				"time" => Time.at(t),
				"radius" => 1,
				"priority" => [1, priority].min
			}
#			db["position"].insert(doc)
			p.increment
		}
	end
end
