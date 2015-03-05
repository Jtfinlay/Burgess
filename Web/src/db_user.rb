require 'rubygems'
require 'json/ext'
require_relative './models/user'
require_relative './models/employee'
require_relative './mongo_singleton'

include Mongo

class UserData

    def initialize
        conn = MongoSingleton::instance
        db = conn.db('retailers')
        @userData = db['userData']
		@employeeData = db['employees']
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
        return User.new.fromDatabase(@userData.find({'username' => username}).limit(1).to_a[0])
    end
    
    def storeUser(user)
        @userData.insert(user.toObject())
    end

	def getEmployees(id)
		return @employeeData.find({'retailer' => id}).to_a
	end	

	def updateEmployees(retail_id, data)
		data.each do |e|
			employee = e.toObject
			employee['retailer'] ||= retail_id
			@employeeData.update(
				{:retailer => retail_id, :_id => e.id},
				employee,
				{:upsert => true}
			)
		end
	end

	def removeEmployees(retail_id, data)
		data.each do |e|
			employee = e.toObject
			employee['retailer'] ||= retail_id
			@employeeData.remove({:retailer => retail_id, :_id => e.id})
		end
		return
	end

end
