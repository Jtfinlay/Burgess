require 'bcrypt'

class User
    #TODO - Email

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

    def toObject
        return {'username' => @username,
                'company'  => @company,
                'storeID'  => @storeID,
                'joined'   => @joined,
                'password' => @password_hash,
                'salt'     => @password_salt}
    end
end
