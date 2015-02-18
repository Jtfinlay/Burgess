require 'rubygems'
require 'mongo'
require 'json/ext'

include Mongo

class UserData

    def initialize
        conn = MongoClient.new("localhost", 27017)
        @mongo_db = conn.db('retailers')
    end

    # 
    # Authenticate user from given username and password
    #
    # Return: Boolean representing success.
    def authenticate(username, password)
	# TODO Record login time
	@mongo_db['userData'].find({
            "username" => username,
            "password" => password
        }).count.to_json.to_i == 0
    end

    #
    # Query number of customers over 24 hours, at hourly 
    # intervals.
    #
    # TODO - Filter by retailer as well. This function won't be necessary later.
    #
    def getCustomersOverDay
        tf = Time.now.to_i
        return getCustomersOverPeriod(tf - (3600*24), tf)
    end

    def getCustomersForDay(y, m, d)
        ti = Time.new(y,m,d).to_i
        return getCustomersOverPeriod(ti, ti + (3600*24))
    end

    #
    # Query number of customers over given period, at hourly
    # intervals.
    #
    # TODO - Filter by retailer as well
    #
    def getCustomersOverPeriod(ti, tf)
        result = []
        (ti...tf).step(3600) { |ts|
             result.push({
                 "x" => ts*1000,
                 "y" => @mongo_db['position'].distinct("wifi", "time" => {
                        "$gte" => Time.at(ts), "$lt" => (Time.at(ts)+3600)
                 }).count
             })
         }
        return result.to_json
    end

    def getCustomerStartDate(username)
        (@mongo_db['userData'].find({
            "username" => username
        }).to_a[0]["joined"].to_f*1000.0).to_i
    end

    def getLatestPositionsWithinInterval(ti, tf)
	result = []
	@mongo_db['position'].distinct('wifi', {time: {"$gt" => Time.at(ti), "$lte" => Time.at(tf)}}).each{|u|
            result.push(@mongo_db['position'].find({
                "time" => {"$gt" => Time.at(ti), "$lte" => Time.at(tf)}, 
                "wifi" => u
            }).sort(:time => :desc).limit(1).to_a[0])
        }
        return result
    end
    

end
