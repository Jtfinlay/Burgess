require 'mongo'
require 'singleton'

class MongoSingleton
	include Singleton

	attr_reader :client

	def initialize
		@client = Mongo::MongoClient.new('localhost')
	end

	def method_missing(method, *args)
		self.client.send(method, *args)
	end
end
