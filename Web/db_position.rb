require 'rubygems'
require 'mongo'
require 'json/ext'

require './position_block'

include Mongo

class PositionData

    def initialize
        conn = MongoClient.new("localhost", 27017)
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
        return PositionBlock.new(ti, tf,
            @position.find({"time" => {"$gt" => Time.at(ti), "$lte" => Time.at(tf)}}).to_a)
    end

end
