require 'rubygems'
require 'mongo'
include Mongo

mongo_client = Mongo::MongoClient.new("localhost", 27017)
db = mongo_client.db('retailers')

id = "aaaaaaaa"
width = 600
height = 400
step_size = 20

xi = 0
yi = 0
ti = Time.new(2015, 02, 10)
tf = Time.at(Time.new(2015,02,11).to_i-1)

(ti.to_i..tf.to_i).step(20) { |t|
	xi = [0, [width, xi + step_size/2 - rand(step_size) ].min].max
	yi = [0, [width, yi + step_size/2 - rand(step_size) ].min].max
	doc = {
		"bluetooth" => nil,
		"wifi" => id,
		"x" => xi,
		"y" => yi,
		"time" => Time.at(t)
	}
	db["position"].insert(doc)
}
