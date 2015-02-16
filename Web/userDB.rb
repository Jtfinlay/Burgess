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
    # Query number of customers over given period, at hourly 
    # intervals.
    #
    # TODO - Filter by retailer as well
    #
    def getCustomersOverPeriod(ti, tf)
        result = []
        (ti.to_i...tf.to_i).step(3600) { |ts|
             result.push({
                 "x" => (Time.at(ts).to_f*1000.0).to_i,
                 "y" => @mongo_db['position'].find("time" => {
                        "$gte" => Time.at(ts), "$lt" => (Time.at(ts)+3600)
                 }).count.to_json.to_i
             })
         }
        return result
    end

end
