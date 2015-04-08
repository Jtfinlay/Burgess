require 'mongo'
require 'ruby-progressbar'
require 'time'
include Mongo

require 'pp'

SLEEP_DURATION = 60 # Number of seconds to sleep for
SLEEP_PROB = 0.15 # % chance of sleeping upon reaching a target
CLOSE_ENOUGH = 0.1 # distance between 2 things that is sufficient for them to be treated as the same point
STORAGE_INTERVAL = 360 # number of simulation steps to be done before snapshots are stored in the DB
STEP_SIZE = 5 # step at X second intervals
SECONDS_PER_HALF_HOUR = 1800
WALKING_SPEED = 0.5 # m/s

class Vector
  attr_reader :x, :y

  def initialize(x, y)
    @x = x
    @y = y
  end

  def magnitude
    return Math.sqrt(@x * @x + @y * @y)
  end

  def +(v)
    return Vector.new(@x + v.x, @y + v.y)
  end

  def *(dist)
    return Vector.new(@x * dist, @y * dist)
  end

  def /(dist)
    return self * (1.0 / dist)
  end

  def -(v)
    return self + (v * -1.0)
  end

  def normalize
    return self / self.magnitude
  end
end

class Connection
  attr_reader :controlPoint, :weight

  def initialize(controlPoint, weight)
    @controlPoint = controlPoint
    @weight = weight
  end
end

class ControlPoint
  attr_reader :position
  attr_accessor :connections

  def initialize(x, y)
    @position = Vector.new(x, y)
    @connections = []
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
  attr_accessor :position, :mac, :speed, :target

  def initialize(mac, startControlPoint, speed)
    @rand = Random.new
    @position = startControlPoint.position
    @mac = mac
    @speed = speed * (0.8 + @rand.rand(0.4)) # m/s, vary it by +- 20% to keep things interesting
    @target = startControlPoint
    @sleepDuration = 0.0
  end

  def advance(delta)
    @sleepDuration -= delta if @sleepDuration > 0
    return if @sleepDuration > 0
    moveVec = @target.position - position
    distanceCanMove = moveVec.normalize * @speed * delta

    if moveVec.magnitude <= CLOSE_ENOUGH # if within a half a meter of the target consider the target to have been reached
      if SLEEP_PROB > @rand.rand(1.0)
        @sleepDuration = SLEEP_DURATION
      else
        @target = @target.getNextControlPoint
      end
    elsif moveVec.magnitude < distanceCanMove.magnitude # target is within 1 second of movement, just jump to target, this is to prevent overshooting target
      @position = @target.position
    else # will not reach target this second, just advance position towards it
      @position = @position + distanceCanMove
    end
  end
end

class StoreSimulator
  def initialize
    @people = []
    @rand = Random.new
    @snapshotData = []
    @maxPeople = 0
    @newPeopleProb = 0.0
    @timePoints = []
    @activeEmployees = {}
  end

  def createTimePoints(curDate)
    morningEarly =   {'startTime' =>  "#{curDate} 08:00", 'maxPeople' => 02, 'newPeopleProb' => 0.03, 'staff' => ['left']}                 # not many people early morning, partial coverage
    morningLate =    {'startTime' =>  "#{curDate} 10:00", 'maxPeople' => 05, 'newPeopleProb' => 0.12, 'staff' => ['left', 'right']}          # a few people late morning, good coverage
    lunch =          {'startTime' =>  "#{curDate} 12:00", 'maxPeople' => 20, 'newPeopleProb' => 0.80, 'staff' => ['right', 'all']}         # very busy at lunch time, disproportionate coverage
    afternoonEarly = {'startTime' =>  "#{curDate} 13:00", 'maxPeople' => 10, 'newPeopleProb' => 0.18, 'staff' => ['all']}                  # things die off after lunch, broad coverage
    afternoonLate =  {'startTime' =>  "#{curDate} 16:30", 'maxPeople' => 15, 'newPeopleProb' => 0.64, 'staff' => ['right']}                # late afternoon gets busy again, understaffed
    eveningEarly =   {'startTime' =>  "#{curDate} 18:00", 'maxPeople' => 07, 'newPeopleProb' => 0.15, 'staff' => ['right', 'left']}        # supper time hits and things slow down, good coverage
    eveningLate =    {'startTime' =>  "#{curDate} 20:00", 'maxPeople' => 02, 'newPeopleProb' => 0.02, 'staff' => ['right', 'all', 'left']} # almost no one before closing time, overstaffed

    @timePoints.push(morningEarly)
    @timePoints.push(morningLate)
    @timePoints.push(lunch)
    @timePoints.push(afternoonEarly)
    @timePoints.push(afternoonLate)
    @timePoints.push(eveningEarly)
    @timePoints.push(eveningLate)
  end

  def updateActiveTimePoint(currentTime)
    #find a time point that is before the currentTime (or same as) and is closest to that time
    beforeNow = @timePoints.select do |timePoint|
      Time.parse(timePoint['startTime']).to_i <= currentTime
    end
    # find the latest time before the current time
    curTimePoint = beforeNow.inject do |v, tp|
      res = tp if v == nil
      if res == nil
        res = [v, tp].max do |a, b|
          Time.parse(a['startTime']) <=> Time.parse(b['startTime'])
        end
      end
      res
    end

    if curTimePoint != nil
      @maxPeople = curTimePoint['maxPeople']
      @newPeopleProb = curTimePoint['newPeopleProb']

      # get the routes that should be active
      newRoutes = Array.new(curTimePoint['staff'])
      # strip out any that are already active
      @activeEmployees.each do |name, employee|
        newRoutes.delete(name)
      end

      # start new ones up
      newRoutes.each do |routeName|
        route = @routes[routeName]
        employee = self.getAvailableEmployee(route)
        @activeEmployees[routeName] = employee
        @people.push(employee)
      end

      # stop any that are not active
      deadRoutes = @activeEmployees.select do |rName, employee|
        !curTimePoint['staff'].any? do |name| rName == name end
      end
      deadRoutes.each do |name, employee|
        @people.delete(employee)
        @activeEmployees.delete(name)
      end
    end
  end

  def getAvailableEmployee(startPoint)
    # get an employee who is not on the floor
    available = @employees.select do |employee|
      mac = employee['mac']
      !@people.any? do |person|
        person.mac == mac
      end
    end

    freeEmployee = available.sample
    Person.new(freeEmployee['mac'], startPoint, WALKING_SPEED)
  end

  def createControlPoints
    @entrance = ControlPoint.new(0.5, 0.5)
    p1 = ControlPoint.new(3, 2)
    p2 = ControlPoint.new(5.5, 3)
    p3 = ControlPoint.new(7.5, 2)
    p4 = ControlPoint.new(3, 7)
    p5 = ControlPoint.new(5, 8)
    p6 = ControlPoint.new(8, 8)
    p7 = ControlPoint.new(6, 6)
    @exit = ControlPoint.new(9.5, 1)

    @entrance.connections = [
      Connection.new(p1, 1)
      ]
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

  def createLeftRoute
    leftEntrace = ControlPoint.new(0.5, 0.5)
    p3 = ControlPoint.new(1, 1)
    p4 = ControlPoint.new(5, 2)
    p5 = ControlPoint.new(5, 7.5)
    p6 = ControlPoint.new(2, 6)

    # numbers bias employee to patrol in a clockwise circle, but not perfectly as it is partially random
    leftEntrace.connections = [
      Connection.new(p4, 1),
    ]
    p3.connections = [
      Connection.new(p4, 1),
      Connection.new(p5, 3),
    ]
    p4.connections = [
      Connection.new(p3, 3),
      Connection.new(p6, 1),
    ]
    p5.connections = [
      Connection.new(p3, 1),
      Connection.new(p6, 3),
    ]
    p6.connections = [
      Connection.new(p4, 3),
      Connection.new(p5, 1),
    ]

    leftEntrace
  end

  def createRightRoute
    rightEntrance = ControlPoint.new(0.5, 0.5)
    p1 = ControlPoint.new(5, 2)
    p2 = ControlPoint.new(5, 7)
    p3 = ControlPoint.new(8, 7)
    p5 = ControlPoint.new(8, 3)

    # numbers bias employee to hang out near top right of store
    rightEntrance.connections = [
      Connection.new(p5, 1),
    ]
    p1.connections = [
      Connection.new(p2, 3),
      Connection.new(p5, 1),
    ]
    p2.connections = [
      Connection.new(p3, 1),
      Connection.new(p2, 3),
      Connection.new(p1, 1),
    ]
    p3.connections = [
      Connection.new(p2, 3),
      Connection.new(p5, 1),
    ]
    p5.connections = [
      Connection.new(p3, 1),
      Connection.new(p2, 3),
      Connection.new(p5, 1),
    ]
    rightEntrance
  end

  def createAllRoute
    centralEntrance = ControlPoint.new(0.5, 0.5)

    p1 = ControlPoint.new(1, 1)
    p2 = ControlPoint.new(2, 1)
    p3 = ControlPoint.new(8, 2)
    p4 = ControlPoint.new(1, 5)
    p5 = ControlPoint.new(2, 5)
    p6 = ControlPoint.new(8, 5)
    p7 = ControlPoint.new(1, 7)
    p8 = ControlPoint.new(3, 8)
    p9 = ControlPoint.new(7, 8)

    centralEntrance.connections = [
      Connection.new(p8, 1)
    ]

    points = [p1, p2, p3, p4, p5, p6, p7, p8, p9]
    points.each do |p|
      p.connections = []
      points.each do |other|
        p.connections.push(Connection.new(other, 1)) if other != p
      end
    end
    centralEntrance
  end

  def createEmployeeControlPoints
    # There are 3 employee routes, a full store, a left side and a right side.
    # otherwise they behave exactly like customers in terms of movement patterns

    # Employees enter from the top left and follow 1 of the three routes
    # left route goes between points 3, 4, 5, 6 but does not allow diagonal movement between 5, 4 and 6, 3. This is the left route
    # right route goes between 1, 2, 3, 5 and allows for movement between all points at any point in time
    # all route goes between almost all points. Some are out of customer range and are 'slack off' points. Movement is unrestricted.

    @routes =
    {
      'left' => self.createLeftRoute,
      'right' => self.createRightRoute,
      'all' => self.createAllRoute
    }

  end

  def clearDB(from, to)
    startTime = Time.at(from)
    endTime = Time.at(to)
    @posCollection.remove( { '$and' => [ {'time' => {'$gte' => startTime}}, {'time' => {'$lte' => endTime}} ]} )
  end

  def generateRandomMac
    l = ('A'..'F').to_a.concat((0..9).to_a)
    result = (0..16).map do |val|
      res = ':' if (val - 2) % 3 == 0
      res = l.sample if res == nil
      res
    end
    result.join
  end

  def createPeople
    return unless @people.length < @maxPeople
    return unless @newPeopleProb > @rand.rand(1.0)
    newPerson = Person.new(self.generateRandomMac, @entrance, WALKING_SPEED)
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
      @snapshotData.push(doc)
    end

  end

  def storeSnapshots
    return if @snapshotData.length == 0
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

  def draw(currentTime)
    system "clear" or system "cls"

    # fixed because no point in overdoing this
    width = 13
    height = 12

    # I know this isn't very efficient but drawing is not required,
    # just doing quick and dirty code so I can see what is going on.
    output = (0..height).map do |row|
      (0..width).map do |col|
        persons = @people.select do |p|
          p.position.x.round == col && p.position.y.round == row
        end
        isEmployee = persons.any? do |p|
          @activeEmployees.any? do |route, employee| p == employee end
        end
        res = '|' if col == 0 || col == width
        res = '-' if row == 0 || row == height
        res = '+' if persons.length > 0
        res = '*' if isEmployee
        res = ' ' if res == nil
        res
      end
    end
    puts "Customers and Employees : #{@people.length}"
    puts "Time : #{Time.at(currentTime).to_s}"
    output.each do |line|
      puts line.join
    end
  end

  # duration in seconds, end-time is seconds
  def run(showOutput, startTime, endTime, curDate)
    self.createControlPoints
    self.createEmployeeControlPoints
    self.createTimePoints(curDate)

    duration = endTime - startTime
    currentTime = startTime
    nextTransitionTime = currentTime + SECONDS_PER_HALF_HOUR
    counter = 0

    @client = MongoClient.new
    @db = @client.db("retailers")
    @posCollection = @db["position"]
    @employeeCollection = @db["employees"]
    self.clearDB(startTime, endTime)

    @employees = @employeeCollection.find().to_a

    p = ProgressBar.create(:total => duration)

    updateActiveTimePoint(currentTime)

    while (currentTime < endTime) do
      step(STEP_SIZE)
      self.createSnapshot(currentTime)
      if currentTime > nextTransitionTime
        nextTransitionTime = currentTime + SECONDS_PER_HALF_HOUR
        updateActiveTimePoint(currentTime)
      end
      if STORAGE_INTERVAL <= counter
        self.storeSnapshots
        counter = 0
        self.draw(currentTime) if showOutput # drawing on storage so drawing doesn't occur every frame
      end
      p.progress += STEP_SIZE
      currentTime += STEP_SIZE
      counter = [counter + 1, STORAGE_INTERVAL].min
    end

    #make sure all data is saved
    self.storeSnapshots
  end
end

showOutput = false
showOutput = true if ARGV.length == 2 and ["true", "t", "yes", "showoutput"].any? do |val| val == ARGV[1].downcase end
sim = StoreSimulator.new()

dateToPopulate = Time.now.strftime("%d/%m/%Y")

if ARGV.length >= 1
  dateToPopulate = ARGV[0]
end

puts "date : #{dateToPopulate}"

# sim runs from 8AM to 10 PM of the current day
startTime = Time.parse("#{dateToPopulate} 08:00 -0600").to_i
endTime = Time.parse("#{dateToPopulate} 22:00 -0600").to_i
sim.run(showOutput, startTime, endTime, dateToPopulate)
