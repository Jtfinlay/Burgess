require 'mongo'
include Mongo

MAX_PEOPLE = 50; # No new people will be added to simulation once this limit is reached
NEW_PEOPLE_PROB = 0.05; # % chance of a person entering the store each second
SLEEP_DURATION = 30; # Number of seconds to sleep for
SLEEP_PROB = 0.15; # % chance of sleeping upon reaching a target
CLOSE_ENOUGH = 0.1 # distance between 2 things that is sufficient for them to be treated as the same point
STORAGE_INTERVAL = 100 # number of simulation steps to be done before snapshots are stored in the DB

class Vector
  attr_reader :x, :y

  def initialize(x, y)
    @x = x;
    @y = y;
  end

  def magnitude
    return Math.sqrt(@x * @x + @y * @y);
  end

  def +(v)
    return Vector.new(@x + v.x, @y + v.y)
  end

  def *(dist)
    return Vector.new(@x * dist, @y * dist);
  end

  def /(dist)
    return self * (1.0 / dist);
  end

  def -(v)
    return self + (v * -1.0);
  end

  def normalize
    return self / self.magnitude;
  end
end

class Connection
  attr_reader :controlPoint, :weight;

  def initialize(controlPoint, weight)
    @controlPoint = controlPoint;
    @weight = weight;
  end
end

class ControlPoint
  attr_reader :position;
  attr_accessor :connections;

  def initialize(x, y)
    @position = Vector.new(x, y);
    @connections = [];
    @rand = Random.new
  end

  # get the next connection, chosen with a weighted random selection
  def getNextControlPoint
    totalWeight = @connections.inject(0) do |res, element|
      res += element.weight
    end

    result = @connections.inject(nil) do |res, element|
      res = element if res == nil and element.weight > @rand.rand(totalWeight)
    end
    result = @connections.sample if result == nil # just in case none were selected default to an un-weighted random select
    return result.controlPoint
  end
end

class Person
  attr_accessor :position, :mac, :speed, :target;

  def initialize(mac, startControlPoint, speed)
    @rand = Random.new;
    @position = startControlPoint.position;
    @mac = mac;
    @speed = speed * (0.8 + @rand.rand(0.4)); # m/s, vary it by +- 20% to keep things interesting
    @target = startControlPoint;
    @sleepDuration = 0.0;
  end

  def advance(delta)
    @sleepDuration -= 1 if @sleepDuration > 0;
    return if @sleepDuration > 0;
    moveVec = @target.position - position;

    if moveVec.magnitude <= CLOSE_ENOUGH # if within a half a meter of the target consider the target to have been reache
      if SLEEP_PROB > @rand.rand(1.0)
        @sleepDuration = SLEEP_DURATION;
      else
        @target = @target.getNextControlPoint
      end
    elsif moveVec.magnitude < @speed # target is within 1 second of movement, just jump to target, this is to prevent overshooting target
      @position = @target.position;
    else # will not reach target this second, just advance position towards it
      @position = @position + moveVec.normalize * @speed;
    end
  end
end

class StoreSimulator
  def initialize
    @people = [];
    @rand = Random.new;
    @snapshotData = [];
  end

  def createControlPoints
    @entrance = ControlPoint.new(11, 12);
    p1 = ControlPoint.new(11, 9);
    p2 = ControlPoint.new(11, 4);
    p3 = ControlPoint.new(7, 4);
    p4 = ControlPoint.new(2, 4);
    p5 = ControlPoint.new(7, 9);
    p6 = ControlPoint.new(2, 9);
    p7 = ControlPoint.new(4, 6);
    @exit = ControlPoint.new(2, 12);

    @entrance.connections = [
      Connection.new(p1, 1)
      ];
    p1.connections = [
      Connection.new(p2, 2),
      Connection.new(p5, 1)
    ]
    p2.connections = [
      Connection.new(p1, 1),
      Connection.new(p3, 1)
    ]
    p3.connections = [
      Connection.new(p2, 1),
      Connection.new(p4, 1),
      Connection.new(p7, 0.5)
    ]
    p4.connections = [
      Connection.new(p3, 3),
      Connection.new(p6, 1)
    ]
    p5.connections = [
      Connection.new(p1, 0.5),
      Connection.new(p6, 2),
      Connection.new(p7, 0.5)
    ]
    p6.connections = [
      Connection.new(p4, 1),
      Connection.new(p5, 1),
      Connection.new(@exit, 2)
    ]
    p7.connections = [
      Connection.new(p6, 2),
      Connection.new(p5, 1),
      Connection.new(p3, 1)
    ]
    @exit.connections = [
      Connection.new(@entrance, 1) # just in case
    ]
  end

  def clearDB(from, to)
    startTime = Time.at(from)
    endTime = Time.at(to)
    @posCollection.remove( { '$and' => [ '&gte' => startTime, '&lte' => endTime ]} );
  end

  def generateRandomMac
    l = ('A'..'F').to_a.concat((0..9).to_a);
    result = (0..16).map do |val|
      res = ':' if (val - 2) % 3 == 0
      res = l.sample if res == nil
      res
    end
    result.join
  end

  def createPeople
    return unless @people.length < MAX_PEOPLE
    return unless NEW_PEOPLE_PROB > @rand.rand(1.0)
    newPerson = Person.new(self.generateRandomMac, @entrance, 0.8);
    @people.push(newPerson)
  end

  def step(deltaTime)
    # first create new people
    self.createPeople
    # now move each person
    @people.each do |person|
      person.advance(deltaTime)
    end

    # remove anyone near the exit
    # basically just make a new array that contains people who are too far
    # from the exit to be considered at the exit
    @people = @people.select do |person|
      (person.position - @exit.position).magnitude > CLOSE_ENOUGH
    end

  end

  def createSnapshot time
    @people.each do |person|
      doc =
      {
        "bluetooth" => nil,
        "wifi" => person.mac,
        "x" => person.position.x,
        "y" => person.position.y,
        "time" => Time.at(time),
        "radius" => 1.0
      }
      @snapshotData.push(doc);
    end

  end

  def storeSnapshots
    begin
      writeOp = @posCollection.initialize_unordered_bulk_op

      @snapshotData.each do |data|
        writeOp.insert(data)
      end

      writeOp.execute
    rescue => ex
      puts "Failed to insert data to DB. #{ex}"
    end

    @snapshotData = []
  end

  def draw
    system "clear" or system "cls"

    # fixed because no point in overdoing this
    width = 13;
    height = 12;

    # I know this isn't very efficient but drawing is not required,
    # just doing quick and dirty code so I can see what is going on.
    output = (0..height).map do |row|
      (0..width).map do |col|
        person = @people.select do |p|
          p.position.x.round == col && p.position.y.round == row
        end
        res = '|' if col == 0 || col == width
        res = '-' if row == 0 || row == height
        res = '+' if person.length > 0
        res = ' ' if res == nil
        res
      end
    end
    puts "Customers : #{@people.length}"
    output.each do |line|
      puts line.join
    end
  end

  # duration in seconds, end-time is seconds
  def run(showOutput, duration, endTime = Time.now.to_i)
    self.createControlPoints

    startTime = endTime - duration;
    currentTime = startTime;
    counter = 0;

    @client = MongoClient.new
    @db = @client.db("retailers");
    @posCollection = @db["position"]
    self.clearDB(startTime, endTime);

    while (currentTime < endTime) do
      step(1)
      self.createSnapshot(currentTime)
      if STORAGE_INTERVAL <= counter
        self.storeSnapshots
        counter = 0
      end
      self.draw if showOutput
      currentTime += 1;
      counter = [counter + 1, STORAGE_INTERVAL].min
    end

    #make sure all data is saved
    self.storeSnapshots
  end
end

sim = StoreSimulator.new()
sim.run(true, 100);