require 'mongo'
require 'ruby-progressbar'
include Mongo

WIDTH = 13
HEIGHT = 12

class Monitor

  def getLatest(mac)
    cur = @posCollection.find({'wifi' => mac, 'time' => {'$gte' => @latestTime}})
    posEntries = cur.to_a.sort! do |a, b|
      a['time'] <=> b['time']
    end
    posEntries.last
  end
  
  def draw(posEntry, mac)
    system "clear" or system "cls"
    
    output = (0..HEIGHT*3).map do |row|
      (0..WIDTH*3).map do |col|
        res = '|' if col == 0 || col == WIDTH*3
        res = '-' if row == 0 || row == HEIGHT*3
        res = '+' if (posEntry['x']*3).round == col and (posEntry['y']*3).round == row
        res = ' ' if res == nil
        res
      end
    end
    
    puts "Mac : #{mac}"
    puts "Time : #{posEntry['time']}"
    puts "(#{posEntry['x']}, #{posEntry['y']})"
    
    output.each do |line|
      puts line.join
    end
  end

  def run(mac)
    @client = MongoClient.new
    @db = @client.db("retailers")
    @posCollection = @db["position"]
    
    @latestTime = Time.at(0)
    
    # monitor is continuous
    loop do
      entry = getLatest(mac)
      if entry != nil
        draw(entry, mac)
        @latestTime = entry['time']
      else
        puts "Failed to find #{mac}"
        break
      end
      
      sleep(1)
    end
  end

end

if ARGV.length == 1  
  monitor = Monitor.new
  monitor.run(ARGV[0])
else
  puts "Usage : ruby monitor.rb <mac:string"
end