/*
 *	This program watches for updates to the position database, aggregates the data over period
 *	(default 5sec) and places it in the archived database.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package main

import (
	"fmt"
	"time"
	"gopkg.in/mgo.v2"
	"models"
	"priority"
	"gopkg.in/mgo.v2/bson"
)

var (
	c_pos *mgo.Collection					// db connection
	sleepDuration = 5 * time.Second			// period to aggregate data over
	offset = int64(1 * time.Second)			// offset in case aggregation is slow
	host = "ua-bws.cloudapp.net"
)

/*
 * Pull data from recent period from position database
 *
 * tf: Upper limit for query
 */
func pullRecentData(tf time.Time) *[]models.Position {
	var result []models.Position

	ti := time.Unix(0, tf.UnixNano() - int64(sleepDuration) - offset)
	err := c_pos.Find(
		bson.M{
			"time": bson.M{
				"$gte" : ti,
				"$lt" : tf,
			},
		}).All(&result)
	if err != nil { panic(err) }

	return &result
}

//  Aggregate position data to remove duplicate users
func aggregateData(data *[]models.Position) *map[string]*models.Position {
	hash := make(map[string]*models.Position)
	for i := range *data {
		element := (*data)[i]
		if hash[element.Wifi] == nil || hash[element.Wifi].Radius > element.Radius {
			hash[element.Wifi] = &element
		}
	}
	return &hash
}

// Connect to databases, then begin aggregation cycle
func main() {
	fmt.Println("Connecting...")
	session, err := mgo.Dial(host)
	if err != nil {
		panic(err)
	}
	fmt.Println("Connection Established!")
	defer session.Close()

	priority.Init(session, sleepDuration)


	for {
		t := time.Now()
		// t := time.Unix(0, 1425452375000 * int64(time.Millisecond))
		data := aggregateData(pullRecentData(t))
		priorityData := priority.UpdatePriorities(data)

		priority.StoreArchived(t, priorityData)

		time.Sleep(sleepDuration)
	}
}
