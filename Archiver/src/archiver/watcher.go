/*
 *	This program watches for updates to the position database, aggregates the data over period
 *	(default 5sec) and places it in the archived database.
 *
 *	Author: James Finlay
 *	Date: March 5th, 2015
 */

package main

import (
		"fmt"
		"time"
		"gopkg.in/mgo.v2"
		"gopkg.in/mgo.v2/bson"
)

/** Matches db 'position' **/
type Position struct {
	Bluetooth string
	Wifi string
	X float32
	Y float32
	Radius float32
	Priority float32
	Time time.Time
}

/** Matches db 'archived' **/
type Archived struct {
	Mac string
	X float32
	Y float32
	Radius float32
	Priority float32
}

var (
	c_pos, c_arch *mgo.Collection					// db connections
	sleep_time time.Duration = 5 * time.Second		// period to aggregate data over
	offset int64 = int64(1 * time.Second)			// offset in case aggregation is slow
)

/*
 * Pull data from recent period from position database
 *
 * tf: Upper limit for query
 */
func PullRecentData(tf time.Time) *[]Position {
	var result []Position

	ti := time.Unix(0, tf.UnixNano() - int64(sleep_time) - offset)
	err := c_pos.Find(
		bson.M{
			"time": bson.M{
				"$gte" : ti, 
				"$lt" : tf,
			},
		}).All(&result)
	if err != nil {
		fmt.Println(err)
	}
	return &result
}

//  Aggregate position data to archived format.
func AggregateData(data *[]Position) *[]Archived {
	hash := make(map[string]*Position)
	result := make([]Archived, 0)
	for i := range *data {
		element := (*data)[i]
		if hash[element.Wifi] == nil || hash[element.Wifi].Radius > element.Radius {
			hash[element.Wifi] = &element
		}
	}
	for _, value := range hash {
		result = append(result, Archived{value.Wifi, value.X, value.Y, value.Radius, value.Priority})
	}
	return &result
}

// Push aggregated data to the archive database
func PushData(now time.Time, data *[]Archived) {
	if (len(*data) == 0) { return }
	err := c_arch.Insert(
		bson.M{
			"t": now,
			"data": *data,
		})
	if err != nil {
		fmt.Println(err)
	}
}

// Connect to databases, then begin aggregation cycle
func main() {
	session, err := mgo.Dial("localhost")
	if err != nil {
		panic(err)
	}
	defer session.Close()

	c_pos = session.DB("retailers").C("position")
	c_arch = session.DB("retailers").C("archived")

	for {
		t := time.Now()
	//	PushData(t, AggregateData(PullRecentData(time.Unix(0, 1425452375000 * int64(time.Millisecond)))))
		PushData(t, AggregateData(PullRecentData(t)))
		time.Sleep(sleep_time)
	}
}
