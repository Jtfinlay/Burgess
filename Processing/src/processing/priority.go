/*
 * This program performs the priority determination of customers.
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
    Customers = make(map[string]*Customer, 0)               // active Customers
    Employees = make(map[string]*Employee, 0)        // active Employees
    c_employ *mgo.Collection

    EmployeesAll = make(map[bson.ObjectId]*Employee, 0)     // all Employees
    EmployeePullTime time.Time
)

/*
 * Pull employee data into 'EmployeesAll'
 */
func PullEmployeeData() {
    var result []Employee
    err := c_employ.Find(nil).All(&result)
    if err != nil { panic(err) }

    for _,value := range result {
        EmployeesAll[value.Id] = &value
    }
}

/*
 * Find employee by MAC address
 */

/*
 * Super function for updating priorities. This also helps track analytics-
 * based data. Need to keep this organized :O .
 */
func UpdatePriorities(t time.Time, data *map[string]*Position) {
    // TODO - Filter by retailer

    // If it's been a while, update our EmployeeAll data
    if t.UnixNano() - EmployeePullTime.UnixNano() > int64(time.Hour) {
        PullEmployeeData()
        EmployeePullTime = t
    }

    for key,value := range *data {
        fmt.Println(key, value)

        // Active Employee?


        // Check whether employee or customer

        // Update LastSeen & Position
    }

    // Perform Priority stuff
}
