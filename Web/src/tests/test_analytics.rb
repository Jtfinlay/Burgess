require 'test/unit'
require_relative '../db_analytics'

class AnalyticsTest < Test::Unit::TestCase
    class << self

        # Runs at start
        def startup
            @@coll = MongoSingleton::instance.db('fake')['interactions']
            @@empl = MongoSingleton::instance.db('fake')['employees']
            @@empl.insert([
                {"retailer"=>"test","mac"=>"a","name"=>"Abe"},
                {"retailer"=>"test","mac"=>"b","name"=>"Brad"},
                {"retailer"=>"test","mac"=>"c","name"=>"Carl"}
            ])
            @@anal = AnalyticsData.new
            @@anal.interactions = @@coll
        end

        # Runs at end
        def shutdown
			@@coll.drop
			@@empl.drop
        end

        def suite
            mysuite = super
            def mysuite.run(*args)
                AnalyticsTest.startup()
                super
                AnalyticsTest.shutdown()
            end
			mysuite
		end
    end

    # Runs before each test
    def startup
    end

    # Runs after each test
    def teardown
        @@coll.remove({})
    end

    def test_getWaitTimes
        ti = Time.new(2014,1,1,2,0,0).to_i
        @@coll.insert([
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti),
             "endTime"=>Time.at(ti+20), "elapsedTime"=>30*1000},
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti+60),
             "endTime"=>Time.at(ti+60+40), "elapsedTime"=>40*1000},
            {"employee"=>BSON::ObjectId.new, "startTime"=>Time.at(ti+1200),
             "endTime"=>Time.at(ti+1200+20), "elapsedTime"=>20*1000}
        ])
        result = @@anal.getWaitTimes(ti,ti+60*60*24).to_a
        assert_equal 30*1000, result.inject(0.0){|sum, el| sum+el["elapsedTime"]} / result.size
    end

    def test_getEmployeeHelpCount
        ti = Time.new(2014,1,1,2,0,0).to_i
        es = @@empl.find({},{:fields=>["_id"]}).to_a
        @@coll.insert([
            {"employee"=>es[0], "startTime"=>Time.at(ti),"elapsedTime"=>1,
             "endTime"=>Time.at(ti+20), "customer" => "mac"},
            {"employee"=>es[0], "startTime"=>Time.at(ti+60),"elapsedTime"=>1,
             "endTime"=>Time.at(ti+60+40), "customer" => "jason"},
            {"employee"=>es[0], "startTime"=>Time.at(ti+1200),"elapsedTime"=>1,
             "endTime"=>Time.at(ti+1200+20), "customer" => "frank"},
			{"employee"=>es[1], "startTime"=>Time.at(ti+40), "elapsedTime"=>1,
			 "endTime"=>Time.at(ti+40+3), "customer" => "spook"}
        ])
        es.map!{|v| v["_id"]}
        result = @@anal.getEmployeeHelpCount(ti,ti+60*60*24,0,es)
        
        assert_equal 3, result[es[0]]
		assert_equal 1, result[es[1]]
		assert_equal 0, result[es[2]]
    end

    def test_getEmployeeHelpTime
        ti = Time.new(2014,1,1,2,0,0,0).to_i
        es = @@empl.find({},{:fields=>["_id"]}).to_a
        @@coll.insert([
            {"employee"=>es[0], "startTime"=>Time.at(ti),
             "endTime"=>Time.at(ti+20), "elapsedTime"=>20*1000},
            {"employee"=>es[0], "startTime"=>Time.at(ti+60),
             "endTime"=>Time.at(ti+60+40), "elapsedTime"=>40*1000},
            {"employee"=>es[0], "startTime"=>Time.at(ti+1200),
             "endTime"=>Time.at(ti+1200+20), "elapsedTime"=>20*1000},
			{"employee"=>es[1], "startTime"=>Time.at(ti+10),
			 "endTime"=>Time.at(ti+10+13), "elapsedTime"=>13*1000}
        ])
        es.map!{|v| v["_id"]}
        result = @@anal.getEmployeeHelpTime(ti,ti+60*60*24,es)

        assert_equal 1000*(20+40+20), result[es[0]].inject(0.0){|sum,el|sum+el}
		assert_equal 1000*13, result[es[1]].inject(0.0){|sum,el|sum+el}
		assert_equal 0, result[es[2]].inject(0.0){|sum,el|sum+el}
    end
	
end
