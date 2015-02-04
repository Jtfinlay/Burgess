require 'rubygems'
require 'mongo'
require 'json/ext'

include Mongo

class UserData

    def initialize
    end

    def test
        conn = MongoClient.new("localhost", 27017)
        set :mongo_connection, conn
        set :mongo_db, conn.db('retailers')
    end

end
