require 'rubygems'
require 'json/ext'
require_relative './mongo_singleton'

class PositionData

    def initialize
        conn = MongoSingleton::instance
        db = conn.db('retailers')
        @position = db['position']
    end

    #
    # Generate 'PositionBlock' object containing data over period.
    #
    # y: year as int
    # m: month as int
    # d: day as int
    # timezone: timezone offset, in minutes
    def getPositionsOverDay(y, m, d, timezone)
        ti = Time.new(y,m,d).to_i + timezone*60
        tf = ti + (3600*24)
        result = @position.find({"time" => {"$gt" => Time.at(ti), "$lte" => Time.at(tf)}}).to_a
		result.each_index{|i| result[i]['time'] = result[i]['time'].to_i}
		return result
    end

	#
	# This is very slow.
	#
	def getPositionsForLapse_REDUCE(y, m, d, timezone)
		ti = Time.new(y,m,d).to_i + timezone*60
		tf = ti + (3600*24)
		result = []

		map = "function() {emit(this.wifi, {'data' : {'x':this.x, 'y':this.y, 'radius':this.radius}}); }"
		reduce = "function(id, data) { return data[0]; }"

		(ti..tf).step(20).each do |t|
			opts = {:out => {:inline=>1}, :raw=>true, query: {"time" => {"$gt" => Time.at(t), "$lte" => Time.at(t+20)}}}
			result << @position.map_reduce(map, reduce, opts)["results"]
		end
	end

	def getPositionsForLapse(y, m, d, timezone)
		ti = Time.new(y,m,d).to_i + timezone*60
        tf = ti + (3600*24)
        result = []

        (ti..tf).step(20).each do |t|
			@position.find({"time" => {"$gt" => Time.at(t), "$lte" => Time.at(t+20)}}).to_a.each{|e|
				result << e
			}
		end

	end

end
