require 'rubygems'
require 'json/ext'
require_relative './mongo_singleton'

class AnalyticsData
    attr_accessor :interactions

    def initialize
        conn = MongoSingleton::instance
        db = conn.db('retailers')
        @interactions = db['interactions']
    end

    #
    # Pull Customer wait time statistics before helped by employees between the
    # given times (sec)
    #
    # Returns employee IDs & elapsedTime
    #
    def getWaitTimes(ti, tf)
        return @interactions.find(
        {
            "startTime" => {"$gte" => Time.at(ti)},
            "endTime" => {"$lte" => Time.at(tf)}
        },
        {
            :fields => ["employee", "elapsedTime"]
        })
    end

    #
    # Pull number of Customers helped by each Employee between the given times
    # (sec) where the interaction is greater than minLength (sec).
    #
    def getEmployeeHelpCount(ti, tf, minLength, employees)
        result = Hash.new
        employees.each{|v|
            result[v] = @interactions.find(
            {
                "startTime" => {"$gte" => Time.at(ti)},
                "endTime" => {"$lte" => Time.at(tf)},
                "elapseTime" => {"$gte" => minLength*1000}
            }).count()
        }
        return result
    end

    #
    # Pull length of interactions for each employee between the given times
    # (sec)
    #
    def getEmployeeHelpTime(ti, tf, employees)
        result = Hash.new
        employees.each{|v|
            result[v] = @interactions.find(
            {
                "startTime" => {"$gte" => Time.at(ti)},
                "endTime" => {"$lte" => Time.at(tf)}
            },
            {
                :fields => ["elapsedTime"]
            })
        }
    end


end
