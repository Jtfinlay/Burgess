require 'mongo'
require 'ruby-progressbar'
include Mongo

WIDTH = 13
HEIGHT = 12

class ConsolePlayback

  def getPositions(mac, oldestTime)
    client = MongoClient.new
    db = client.db("retailers")
    posCollection = db["position"]
    
    cur = posCollection.find({'wifi' => mac, 'time' => { '$gte' => oldestTime }})
    cur.to_a.sort do |a, b|
      a['time'] <=> b['time']
    end
  end
  
  def draw(posEntry, playbackRate, mac)
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
    puts "Time : #{posEntry['time']} \t Playback : x#{playbackRate}"
    puts "(#{posEntry['x']}, #{posEntry['y']})"
    
    output.each do |line|
      puts line.join
    end
  end

  def run(mac, lookbackTime, playbackRate)
    oldestTime = Time.at(Time.now.to_i - lookbackTime)
    oldestTime = Time.at(0) if lookbackTime == 0
    positions = self.getPositions(mac, oldestTime)
    positions.reverse!
    if positions.length > 0
      startTime = positions.last['time'].to_i
      endTime = positions.first['time'].to_i
      curTime = startTime
      
      while curTime <= endTime
        if positions.last['time'].to_i == curTime
          draw(positions.last, playbackRate, mac)
          positions.pop
        end
        
        sleep(1.0 / playbackRate)
        
        curTime += 1
      end
    else
      puts "Failed to find positions for #{mac}"
    end
  end
  
end

if ARGV.length == 3  
  playback = ConsolePlayback.new
  secondsToLookback = ARGV[1].to_i * 60 * 60 # hours to seconds
  playback.run(ARGV[0], secondsToLookback, ARGV[2].to_i)
else
  puts "Usage : ruby consolePlayback <mac:string> <lookback:int> <playbackRate:int>"
  puts "lookback is the number of hours from current time to look back, 0 means no limit"
  puts "playbackRate is the rate at which the data will be shown, 1 is realtime anything is faster than realtime"
end
