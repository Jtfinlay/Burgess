require 'test/unit'
require_relative '../db_analytics'

class AnalyticsTest < Test::Unit::TestCase
    class << self

        # Runs at start
        def startup
            @coll = MongoSingleton::instance.db('fake')['interactions']
            @empl = MongoSingleton::instance.db('fake')['employees']
            @empl.insert([
                {"retailer"=>"test","mac"=>"a","name"=>"Abe"},
                {"retailer"=>"test","mac"=>"b","name"=>"Brad"},
                {"retailer"=>"test","mac"=>"c","name"=>"Carl"}
            ])
            @anal = AnalyticsData.new
            @anal.interactions = @coll
        end

        # Runs at end
        def shutdown
            MongoSingleton::instance.drop('fake')
        end

        def suite
            mysuite = super
            def mysuite.run(*args)
                AnalyticsTest.startup()
                super
                AnalyticsTest.shutdown()
            end
    end

    # Runs before each test
    def startup
    end

    # Runs after each test
    def teardown
        @coll.remove({})
    end

    def test_getWaitTimes
        ti = Time.at(2014,1,1,2,0,0).to_i
        @coll.insert([
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti),
             "endTime"=>Time.at(ti+20), "elapsedTime"=>30*1000},
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti+60),
             "endTime"=>Time.at(ti+60+40), "elapsedTime"=>40*1000},
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti+1200),
             "endTime"=>Time.at(ti+1200+20), "elapsedTime"=>20*100}
        ])
        result = @anal.getWaitTimes(ti,ti+60*60*24)
        assert_equal 30*1000, result.inject(0.0){ |sum, el| sum + el } / result.size
    end

    def test_getEmployeeHelpCount
        ti = Time.at(2014,1,1,2,0,0).to_i
        es = @empl.find({},{:fields=>["_id"]}).to_a
        e = es[0]
        @coll.insert([
            {"employee"=>e._id, "startTime"=>Time.at(ti),
             "endTime"=>Time.at(ti+20), "customer" => "mac"},
            {"employee"=>e._id, "startTime"=>Time.at(ti+60),
             "endTime"=>Time.at(ti+60+40), "customer" => "jason"},
            {"employee"=>e._id, "startTime"=>Time.at(ti+1200),
             "endTime"=>Time.at(ti+1200+20), "customer" => "frank"}
        ])
        result = @anal.getEmployeeHelpCount(ti,ti+60*60*24,es)
        assert_equal result[e._id].count, 3
    end

    def test_getEmployeeHelpTime
        ti = Time.at(2014,1,1,2,0,0).to_i
        es = @empl.find({},{:fields=>["_id"]}).to_a
        e = es[0]
        @coll.insert([
            {"employee"=>e._id, "startTime"=>Time.at(ti),
             "endTime"=>Time.at(ti+20), "customer" => "mac"},
            {"employee"=>e._id, "startTime"=>Time.at(ti+60),
             "endTime"=>Time.at(ti+60+40), "customer" => "jason"},
            {"employee"=>e._id, "startTime"=>Time.at(ti+1200),
             "endTime"=>Time.at(ti+1200+20), "customer" => "frank"}
        ])
        result = @anal.getEmployeeHelpTime(ti,ti+60*60*24,es)
        assert_equal result[e._id].inject(0.0){|sum,el| sum + el}, 20+40+20
    end

end
