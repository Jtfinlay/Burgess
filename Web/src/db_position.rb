require 'rubygems'
require 'json/ext'
require_relative './mongo_singleton'

class PositionData
    attr_accessor :position

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
        result = @position.find({"time" => 
            {"$gte" => Time.at(ti), "$lte" => Time.at(tf)}}).to_a
		result.each_index{|i| result[i]['time'] = result[i]['time'].to_i}
		return result
    end

    #r
    # Pull Customers/hour between the given times (sec)
    #
    def getCustomersHourly(ti, tf)
        # Round down to nearest hour
        ti = ti - (ti % 60*60)
        tf = tf - (tf % 60*60)

        result = Hash.new
        (ti..tf-1).step(60*60).each do |t|
            result[t*1000] = @position.distinct("wifi",
            {
                "time" => {"$gte" => Time.at(t), "$lt" => Time.at(t+3600)}
            }).count
        end
        return result
    end

end
