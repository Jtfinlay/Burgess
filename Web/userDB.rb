require 'rubygems'
require 'mongo'
require 'json/ext'

include Mongo

class UserData

    def initialize
        conn = MongoClient.new("localhost", 27017)
        @mongo_db = conn.db('retailers')
    end

    def authenticate(username, password)
	# TODO Record login time
	@mongo_db['userData'].find({
            "username" => username,
            "password" => password
        }).count.to_json.to_i == 0
    end

end
