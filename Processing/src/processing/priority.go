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
)

var (
    Customers = make(map[string]*Customer, 0)        // active Customers
    Employees = make(map[string]*Employee, 0)        // active Employees
    c_employ *mgo.Collection

    EmployeesAll = make(map[string]*Employee, 0)     // all Employees
    EmployeePullTime time.Time

    expireDuration = time.Minute
)

/*
 * Pull employee data into 'EmployeesAll'
 */
func pullEmployeeData() {
    var result []Employee
    err := c_employ.Find(nil).All(&result)
    if err != nil { panic(err) }

    for _,value := range result {
        EmployeesAll[value.MAC] = &value
    }
}

/*
 * Find employee by MAC address
 */
func findEmployee(MAC string) *Employee {
    if Employees[MAC] != nil {
        return Employees[MAC]
    }
    if EmployeesAll[MAC] != nil {
        Employees[MAC] = EmployeesAll[MAC]
        Employees[MAC].FirstSeen = time.Now()
        return Employees[MAC]
    }
    return nil
}

/*
 * Super function for updating priorities. This also helps track analytics-
 * based data.
 */
func UpdatePriorities(data *map[string]*Position) {
    // TODO - Filter by retailer

    // If it's been a while, update our EmployeeAll data
    if time.Since(EmployeePullTime) > time.Hour {
        pullEmployeeData()
        EmployeePullTime = time.Now()
    }

    // Update customers / employees
    for _,value := range *data {

        // Employee?
        employee := findEmployee(value.Wifi)
        if employee != nil {
            employee.LastSeen = time.Now()
            employee.Position = *value
        } else if Customers[value.Wifi] != nil {
            Customers[value.Wifi].LastSeen = time.Now()
            Customers[value.Wifi].Position = *value
        } else {
            Customers[value.Wifi] = &Customer{value.Wifi, time.Now(),
                time.Now(), *value, nil}
        }
    }

    // Remove expired data
    for key,value := range Employees {
        if time.Since(value.LastSeen) > expireDuration {
            delete(Employees, key)
        }
    }
    for key,value := range Customers {
        if time.Since(value.LastSeen) > expireDuration {
            delete(Customers, key)
        }
    }

    // Perform Priority stuff
    for key,value := range Customers {
        fmt.Println(key, value)
    }
}
