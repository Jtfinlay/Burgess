
require './utils'

class Position
    attr_accessor :x, :y, :bluetooth, :wifi, :time

    def initialize(bluetooth, wifi, x, y, time)
        @bluetooth = bluetooth
        @wifi = wifi
        @x = x
        @y = y
        @time = time
    end

end

class PositionBlock
    attr_accessor :data

    def initialize(ti, tf, object)
        @ti = Utils.StandardizeTime_s(ti)
        @tf = Utils.StandardizeTime_s(tf)
        @data = object.map{|pos| Position.new(pos['bluetooth'], pos['wifi'], pos['x'], pos['y'], pos['time'])}
    end

    def queryWithinInterval(ti, tf)
        ti = Utils.StandardizeTime_s(ti)
        tf = Utils.StandardizeTime_s(tf)

        @data.select{ |d| d.time.to_i > ti and d.time.to_i < tf }
    end

    def queryMostRecent(ti, tf)
        ti = Utils.StandardizeTime_s(ti)
        tf = Utils.StandardizeTime_s(tf)

        puts ti
        puts tf

        queryWithinInterval(ti,tf).sort{|a,b| b.time <=> a.time}.uniq{|d| d.wifi}
    end

    def queryCustomersHourly
        result = []
        (@ti..@tf-3600).step(3600) {|ts|
            result.push({
                "x" => ts*1000,
                "y" => queryWithinInterval(ts, ts+3600).uniq{|d| d.wifi}.count
        })}
        return result
    end

end
