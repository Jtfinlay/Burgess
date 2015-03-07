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
func PullRecentData(tf time.Time) *[]Position {
	var result []Position

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
func AggregateData(data *[]Position) *map[string]*Position {
	hash := make(map[string]*Position)
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

	c_pos = session.DB("retailers").C("position")
	c_arch = session.DB("retailers").C("archived")
	c_employ = session.DB("retailers").C("employees")

	for {
		// t := time.Now()
		t := time.Unix(0, 1425452375000 * int64(time.Millisecond))
		data := AggregateData(PullRecentData(t))

		UpdatePriorities(data)

		// StoreArchived(t, data)

		// PushData(t, AggregateData(PullRecentData(time.Unix(0, 1425452375000 * int64(time.Millisecond)))))
		time.Sleep(sleepDuration)
	}
}
