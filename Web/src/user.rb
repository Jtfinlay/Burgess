require 'bcrypt'

class User

    def nil?
        return (@username.nil? or @password_hash.nil?)
    end

    def fromObject(user)
        return nil if user.nil?
        @username = user['username']
        @company = user['company']
        @storeID = user['storeID']
        @joined = user['joined']
        @password_hash = user['password']
        @password_salt = user['salt']
		@width = user['width'] || 600
		@height = user['height'] || 400
		@store_img = user['store_img'] || '/images/store_layout.png'
    end

    def createUser(username, password, company, storeID)
        @username = username
        @company = company
        @storeID = storeID
        @password_salt = BCrypt::Engine.generate_salt
        @password_hash = BCrypt::Engine.hash_secret(password, @password_salt)
        @joined = Time.now
    end

    def validatePassword(password)
        return @password_hash == BCrypt::Engine.hash_secret(password, @password_salt)
    end

	def getMapDetails
		return {"width": @width, "height": @height, "store_img": @store_img}
	end

    def toObject
        return {'username'  => @username,
                'company'   => @company,
                'storeID'   => @storeID,
                'joined'    => @joined,
                'password'  => @password_hash,
                'salt'      => @password_salt,
				'width'	    => @width,
				'height'    => @height,
				'store_img' => @store_img }
    end
end
