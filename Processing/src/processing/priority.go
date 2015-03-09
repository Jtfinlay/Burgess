/*
 * This program performs the priority determination of customers.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package main

import (
	// "fmt"
	"time"
	"gopkg.in/mgo.v2"
)

var (
    Customers = make(map[string]*Customer, 0)        // active Customers
    Employees = make(map[string]*Employee, 0)        // active Employees

	c_employ *mgo.Collection
    EmployeesAll = make(map[string]*Employee, 0)     // all Employees
    EmployeePullTime time.Time

    userExpiration = time.Minute				// Time until user considered dead
	interactionExpiration = 10 * time.Second 	// Time until interaction considered dead
	interactionDistance = float32(4)			// 4 metres, boundary box
)

/*
 *	Pull employee data into 'EmployeesAll'
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
 *	Find employee by MAC address.
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
 *	Update employees & customers with new positions and time
 */
func updateUsers(data *map[string]*Position) {

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

    // Kill expired users
    for key,value := range Employees {
        if time.Since(value.LastSeen) > userExpiration {
            delete(Employees, key)
        }
    }
    for key,value := range Customers {
        if time.Since(value.LastSeen) > userExpiration {
            delete(Customers, key)
        }
    }

	// Kill expired interactions
	// TODO::JF Should store these 'events' for analytics
	for _,employee := range Employees {
		for _,interaction := range employee.Interactions {
			if time.Since(interaction.LastTime) > interactionExpiration {
				interaction.active = false
			}
		}
	}
}

/*
 *	Update interactions between Customers and Employees
 */
func updateInteractions() {
	for _,employee := range Employees {
        for _,customer := range Customers {
			if employee.Position.X > customer.Position.X + interactionDistance {break}
			if employee.Position.Y > customer.Position.Y + interactionDistance {break}
			if employee.Position.X < customer.Position.X - interactionDistance {break}
			if employee.Position.Y < customer.Position.Y - interactionDistance {break}

			interaction := findByCustomer(employee.Interactions, customer)
			if interaction != nil {
				interaction.LastTime = time.Now()
			} else {
				interaction = &Interaction{employee, customer, time.Now(),
					time.Now(), true}
				customer.Interactions = append(customer.Interactions, interaction)
				employee.Interactions = append(employee.Interactions, interaction)
			}
		}
    }
}

/*
 *	Super function for updating priorities. This also helps track analytics-
 *	based data.
 */
func UpdatePriorities(data *map[string]*Position) {
    // TODO::JF - Filter by retailer

    // If it's been a while, update our EmployeeAll data
    if time.Since(EmployeePullTime) > time.Hour {
        pullEmployeeData()
        EmployeePullTime = time.Now()
    }

	updateUsers(data)
	updateInteractions()

    // Perform Priority stuff

}
