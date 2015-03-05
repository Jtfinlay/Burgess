require 'bson'

class Employee
	attr_accessor :id

	def self.fromArray(datas)
		result = []
		datas.each do |e|
			result.push(Employee.new.fromObject(e))
		end
		return result	
	end
	
	def fromObject(data)
		return nil if data.nil?
		@id = data['_id'].nil? ? BSON::ObjectId.new : BSON::ObjectId(data['_id']['$oid'])
		@retailer = BSON::ObjectId(data['retailer']['$oid']) if not data['retailer'].nil?
		@name = data['name']
		@auth_code = data['auth_code']
		@mac = data['mac']
		return self
	end

	def toObject
		return {'_id'		=> @id,
				'retailer'	=> @retailer,
				'name'		=> @name,
				'auth_code'	=> @auth_code,
				'mac'		=> @mac }
	end

end
