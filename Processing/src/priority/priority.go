/*
 * This program performs the priority calculation for customer help.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package priority

import (
	"models"
	"time"
	"push_notification"
)

var (
    Customers = make(map[string]*models.Customer, 0)        // active Customers
    Employees = make(map[string]*models.Employee, 0)        // active Employees
    EmployeesAll = make(map[string]*models.Employee, 0)     // all Employees
    EmployeePullTime time.Time 								// time since grabbing all Employees
)

/*
 *	Pull employee data into 'EmployeesAll'
 */
func PullEmployeeData() {
    for _,value := range *models.PullEmployeeData() {
    	temp := value
        EmployeesAll[value.MAC] = &temp
    }
}

/*
 *	Find employee by MAC address.
 *
 *	MAC: the MAC address of the employee
 *
 *	return: found Employee, or nil
 */
func FindEmployee(MAC string) *models.Employee {
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
 *
 *	data: incoming position map
 */
func UpdateUsers(data *map[string]*models.Position) {

    for _,value := range *data {

        // Employee?
        employee := FindEmployee(value.Wifi)
        if employee != nil {
            employee.LastSeen = time.Now()
            employee.Position = *value
        } else if Customers[value.Wifi] != nil {
            Customers[value.Wifi].LastSeen = time.Now()
            Customers[value.Wifi].Position = *value
        } else {
            Customers[value.Wifi] = &models.Customer{value.Wifi, time.Now(),
                time.Now(), *value, time.Unix(0, time.Now().UnixNano() + models.InitialWait), 0, nil}
        }
    }

    // Kill expired users
    for key,value := range Employees {
        if time.Since(value.LastSeen) > models.UserExpiration {
            delete(Employees, key)
        }
    }
    for key,value := range Customers {
        if time.Since(value.LastSeen) > models.UserExpiration {
            delete(Customers, key)
        }
    }

	// Kill expired interactions
	for _,employee := range Employees {
		for i := len(employee.Interactions)-1; i >= 0; i-- {
			interaction := employee.Interactions[i]
			if time.Since(interaction.LastTime) > models.InteractionExpiration {

				// Store event
				models.StoreInteraction(interaction)

				// Set expiry time
				eTime := interaction.GetPriorityTime()
				if eTime.UnixNano() > interaction.Customer.ExpiryTime.UnixNano() {
					interaction.Customer.ExpiryTime = eTime
				}
				// kill the interaction
				interaction.Customer.RemoveInteraction(interaction)
				employee.Interactions = append(employee.Interactions[:i], employee.Interactions[i+1:]...)
			}
		}
	}
}

/*
 *	Update interactions between Customers and Employees
 */
func UpdateInteractions() {
	for _,customer := range Customers {
		for _,employee := range Employees {
			if employee.Position.X > customer.Position.X + models.InteractionDistance {continue}
			if employee.Position.Y > customer.Position.Y + models.InteractionDistance {continue}
			if employee.Position.X < customer.Position.X - models.InteractionDistance {continue}
			if employee.Position.Y < customer.Position.Y - models.InteractionDistance {continue}

			interaction := models.FindByCustomer(employee.Interactions, customer)
			if interaction != nil {
				interaction.LastTime = time.Now()
			} else {
				interaction = &models.Interaction{employee, customer,
					time.Now(), time.Now(), customer.Priority}
				customer.Interactions = append(customer.Interactions, interaction)
				employee.Interactions = append(employee.Interactions, interaction)
				customer.Priority = 0
			}
		}

		prevPriority := customer.Priority

		// Calculate Priority
		if len(customer.Interactions) == 0 {
			dt := float32(customer.ExpiryTime.UnixNano() - time.Now().UnixNano() + int64(models.SleepDuration))
			if dt == 0 {
				customer.Priority = 1
			} else {
				customer.Priority += (1-customer.Priority)*float32(models.SleepDuration)/dt
			}
			if customer.Priority > 1 { customer.Priority = 1}
			if customer.Priority < 0 { customer.Priority = 0}
		}

		// Send push notification
		if customer.Priority == 1 && prevPriority < 1 {
			push_notification.Alert()
		}
	}
}

/*
 *	Super function for updating priorities. This also helps track analytics-
 *	based data.
 */
func UpdatePriorities(data *map[string]*models.Position) {
    // TODO::JF - Filter by retailer

    // If it's been a while, update our EmployeeAll data
    if time.Since(EmployeePullTime) > time.Hour {
        PullEmployeeData()
        EmployeePullTime = time.Now()
    }

	UpdateUsers(data)
	UpdateInteractions()
}

func GetCustomers() *map[string]*models.Customer {
	return &Customers
}

func GetEmployees() *map[string]*models.Employee {
	return &Employees
}
