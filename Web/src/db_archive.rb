require 'rubygems'
require 'json/ext'
require_relative './mongo_singleton'

class ArchiveData

    def initialize
        conn = MongoSingleton::instance
        db = conn.db('retailers')
        @position = db['position']
		@archived = db['archived']
    end

	def archiveDataSince(y, m, d, timezone)
		ti = Time.new(y,m,d).to_i + timezone*60
		tf = Time.now.to_i

		archiveDataWithin(ti, tf)
	end

	def archiveDataWithin(ti, tf)
		(ti..tf).step(20).each { |t|
            entries = Hash.new
            @position.find({"time" => {"$gte" => Time.at(t), "$lt" => Time.at(t+20)}}).to_a.each{|e|
                if entries[e["wifi"]].nil? or entries[e["wifi"]].radius > e["radius"]
                    entries[e["wifi"]] = {
                        mac: e["wifi"],
                        x: e["x"],
                        y: e["y"],
                        radius: e["radius"]||10}
                end
            }
            @archived.insert({t: Time.at(t), data: entries.values})
        }

	end

end
