require 'rubygems'
require 'mongo'
require 'json/ext'
require './user'

include Mongo

class UserData

    def initialize
        conn = MongoClient.new("localhost", 27017)
        db = conn.db('retailers')
        @userData = db['userData']
    end

    # 
    # Authenticate user from given username and password
    #
    # Return: Boolean representing success.
    def authenticate(username, password)
        username.downcase!
	@userData.find({
            "username" => username,
            "password" => password
        }).count.to_json.to_i == 0
    end

    def getUser(username)
        username.downcase!
        (u = User.new).fromObject(@userData.find({'username' => username}).limit(1).to_a[0])
        return u
    end
    
    def storeUser(user)
        @userData.insert(user.toObject())
    end

end
