require 'test/unit'
require_relative '../db_position'

class PositionTest < Test::Unit::TestCase
	attr_accessor :pos, :empl, :coll
	class << self

		# Runs at start
		def startup
			@@coll = MongoSingleton::instance.db('fake')['position']
			@@empl = MongoSingleton::instance.db('fake')['employees']
			@@empl.insert([
				{"retailer"=>"test","mac"=>"a","name"=>"Abe"},
				{"retailer"=>"test","mac"=>"b","name"=>"Brad"},
				{"retailer"=>"test","mac"=>"c","name"=>"Carl"}
			])
			@@pos = PositionData.new
			@@pos.position = @@coll
		end

		# Runs at end
		def shutdown
			@@coll.drop
			@@empl.drop
		end

		def suite
			mysuite = super
			def mysuite.run(*args)
				PositionTest.startup()
				super
				PositionTest.shutdown()
			end
			mysuite
		end
	end

	# Runs before each test
	def startup
	end

	# Runs after each test
	def teardown
		@@coll.remove({})
	end

	def test_getPositionsOverDay
		y = 2014
		m = 1
		d = 1
		ti = Time.new(y,m,d).to_i
		@@coll.insert([
			{"wifi"=>"aaa", "x"=>10, "y"=>10, "radius"=>1, 
				"priority"=>0.7, "time"=>Time.at(ti-20)},
			{"wifi"=>"aaa", "x"=>10, "y"=>10, "radius"=>1, 
				"priority"=>0.7, "time"=>Time.at(ti)},				
			{"wifi"=>"aaa", "x"=>11, "y"=>9, "radius"=>1, 
				"priority"=>0.73, "time"=>Time.at(ti+20)},
			{"wifi"=>"bbb", "x"=>1, "y"=>1, "radius"=>1, 
				"priority"=>0.1, "time"=>Time.at(ti)},
		])
		result = @@pos.getPositionsOverDay(y,m,d,0)
		assert_equal 3, result.count
	end

	def test_getCustomersHourly
		ti = Time.new(2014,1,1).to_i
		tf = ti + 24*3600
		@@coll.insert([
			{"wifi"=>"aaa", "x"=>10, "y"=>10, "radius"=>1, 
				"priority"=>0.7, "time"=>Time.at(ti)},
			{"wifi"=>"aaa", "x"=>10, "y"=>10, "radius"=>1, 
				"priority"=>0.7, "time"=>Time.at(ti+3700)},				
			{"wifi"=>"aaa", "x"=>11, "y"=>9, "radius"=>1, 
				"priority"=>0.73, "time"=>Time.at(ti+48*3600)},
			{"wifi"=>"bbb", "x"=>10, "y"=>10, "radius"=>1, 
				"priority"=>0.7, "time"=>Time.at(ti+3700)},				
			{"wifi"=>"ccc", "x"=>1, "y"=>1, "radius"=>1, 
				"priority"=>0.1, "time"=>Time.at(ti+48*3600)},
		])
		result = @@pos.getCustomersHourly(ti,tf)
		
		assert_equal 24, result.count
		assert_equal 2, result.select{|k,v| !v.empty?}.count
		assert_equal 2, result[1000*(ti+60*60)].count
	end

end