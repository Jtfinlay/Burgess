require 'rubygems'
require 'json/ext'
require 'ruby-progressbar'
require_relative './mongo_singleton'

class ArchiveData

    def initialize
        conn = MongoSingleton::instance
        db = conn.db('retailers')
        @position = db['position']
		@archived = db['archived_fake']
    end

    #
    # Transfer data since given date from position db to archived db
    # Quite slow.
    #
	def archiveDataSince(y, m, d, timezone)
		ti = Time.new(y,m,d).to_i + timezone*60
		tf = Time.now.to_i

		archiveDataWithin(ti, tf)
	end

	#
	# Transfer data within times (sec) from position db to archived db
    # Quite slow.
	#
	def archiveDataWithin(ti, tf)
		p = ProgressBar.create(:total => (tf - ti)/5+1)
		(ti..tf).step(5).each { |t|
            entries = Hash.new
            @position.find({"time" => {"$gte" => Time.at(t), "$lt" => Time.at(t+20)}}).to_a.each{|e|
                if entries[e["wifi"]].nil? or entries[e["wifi"]][:radius] > e["radius"]
                    entries[e["wifi"]] = {
                        mac: e["wifi"],
                        x: e["x"],
                        y: e["y"],
						priority: e["priority"],
                        radius: e["radius"]||10}
                end
            }
            @archived.insert({t: Time.at(t), data: entries.values}) if not entries.empty?
			p.increment
        }

	end

    #
    # Query data since given time (sec)
    #
    def getPositionsSince(ti)
        result = @archived.find({"t" => {"$gt" => Time.at(ti)}}).to_a
		result.each_index{|i| result[i]['t'] = result[i]['t'].to_i*1000}
        return result
    end

	#
	# Query archived data for given day
	#
	def getPositionsOverDay(y, m, d, timezone)
		ti = Time.new(y,m,d).to_i + timezone*60
		tf = ti + (3600*24)

		result = @archived.find({"t" => {"$gt" => Time.at(ti), "$lte" => Time.at(tf)}}).to_a
		result.each_index{|i| result[i]['t'] = result[i]['t'].to_i*1000}
		return result
	end

end
