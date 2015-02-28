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

end
