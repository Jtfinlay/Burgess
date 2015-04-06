/*
 *	This program takes updates between the given times, aggregates the data over period
 *	(default 5sec) and places it in the archived database
 *
 *	Author: James Finlay
 *	Date: March 31st, 2015
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

	loc,err := time.LoadLocation("Local")
	if err != nil { panic(err) }

	models.SleepDuration = 10 * time.Second

	for i := 0; i <= 60*60*10; i += 10 {
		models.TimeNow = time.Date(2015,03,31,14,0,i,0,loc)

		if i % (60*60) == 0 { fmt.Println(models.TimeNow) }

		data := aggregateData(models.PullRecentData(models.TimeNow,(10*1000000000 - offset)))
		priority.UpdatePriorities(data)

		customers := priority.GetCustomers()
		employees := priority.GetEmployees()

		models.StoreArchived(models.TimeNow, customers, employees)
	}
}
