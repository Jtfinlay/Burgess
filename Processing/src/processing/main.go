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
)

var (
	offset = int64(1 * time.Second)			// offset in case aggregation is slow
	host = "ua-bws.cloudapp.net"
)

/*
 *	Aggregate position data to remove duplicate users
 *
 *	data: list of position data
 *
 *	return: map of position data, with duplicate users removed
 */
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

/*
 *	Main function for the application. Opens db connection & manages loop.
 */
func main() {
	fmt.Println("Connecting...")
	session, err := mgo.Dial(host)
	if err != nil {
		panic(err)
	}
	fmt.Println("Connection Established!")
	defer session.Close()

	models.Init(session)

	for {
		t := time.Now()
		data := aggregateData(models.PullRecentData(t,(int64(models.SleepDuration) - offset)))

		priority.UpdatePriorities(data)

		customers := priority.GetCustomers()
		employees := priority.GetEmployees()

		models.StoreArchived(t, customers, employees)

		time.Sleep(models.SleepDuration)
	}
}
