/*
 *	Pull & Store to database
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package models

import (
 	"time"
  	"gopkg.in/mgo.v2"
 	"gopkg.in/mgo.v2/bson"
)

var (
	DEBUG bool
	c_archived *mgo.Collection
	c_position *mgo.Collection
	c_employee *mgo.Collection
	c_interact *mgo.Collection
)

func Init(session *mgo.Session) {
    c_archived = session.DB("retailers").C("archived")
    c_position = session.DB("retailers").C("position")
    c_employee = session.DB("retailers").C("employees")
    c_interact = session.DB("retailers").C("analytics")
}

/*
 *	Push completed interaction to the db
 *
 *	i: Interaction to insert
 */
func StoreInteraction(i *Interaction) {
	if DEBUG { return }

	err := c_interact.Insert(
		bson.M{
			"retailer": nil,
			"employee": i.Employee.Id,
			"customer": i.Customer.MAC,
			"startTime": i.StartTime,
			"endTime": i.LastTime,
			"elapsedTime": (i.LastTime.UnixNano()-i.StartTime.UnixNano())/1000000,
			"priorityBefore": i.PriorityAtStart,
			"position": i.Employee.Position.Id,
	})
	if err != nil { panic(err) }
}

/*
 *	Pull employee data
 *
 *	return: list of employees in db
 */
func PullEmployeeData() *[]Employee {
	var result []Employee
	if DEBUG { return &result }


    err := c_employee.Find(nil).All(&result)
    if err != nil { panic(err) }
    return &result
}

/*
 *	Pull data from recent period from position database
 *
 *	tf: Pull data up to this time
 *	offset: Pull data starting at tf-offset
 *
 *	return: list of position data within period
 */
func PullRecentData(tf time.Time, offset int64) *[]Position {
	var result []Position
	if DEBUG { return &result }

	ti := time.Unix(0, tf.UnixNano() - offset)

	err := c_position.Find(
		bson.M{
			"time": bson.M{
				"$gte" : ti,
				"$lt" : tf,
			},
		}).All(&result)
	if err != nil { panic(err) }

	return &result
}

/*
 *	Push aggregated data to the archive database
 *
 *	now: time to store data at
 *	customers: map of Customers to store
 *	employees: map of Employees to store
 */
func StoreArchived(now time.Time, customers *map[string]*Customer, employees *map[string]*Employee) {
    if DEBUG { return }

    data := append(*custToArchived(customers), *emplToArchived(employees)...)
    if (len(data) == 0) { return }
    err := c_archived.Insert(
    	bson.M{
    		"t": now,
    		"data": data,
    	})
    if err != nil { panic(err) }
}
