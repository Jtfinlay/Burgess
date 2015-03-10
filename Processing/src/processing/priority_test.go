/*
 * Test cases for the priority logic
 *
 *	Author: James Finlay
 *	Date: March 7th, 2015
 */

package main

import (
    "testing"
    "time"
    "gopkg.in/mgo.v2/bson"
)

func resetValues() {
    Customers = make(map[string]*Customer,0)
    Employees = make(map[string]*Employee, 0)
    EmployeesAll = make(map[string]*Employee, 0)
}
func createCustomer(MAC string) *Customer {
    var pos Position
    return &Customer{MAC, time.Now(), time.Now(), pos, time.Now(), 0, nil}
}
func createEmployee(MAC string) *Employee {
    var pos Position
    return &Employee{"", "", MAC, time.Now(), time.Now(), pos, nil}
}
func TestUpdateUsers(t *testing.T) {
    resetValues()
    // Set up the data
    positions := make(map[string]*Position)
    positions["c1"] = &Position{bson.NewObjectId(), "", "c1", 30, 30, 2, time.Now()}
    positions["c2"] = &Position{bson.NewObjectId(), "", "c2", 30, 30, 2, time.Now()}
    positions["e1"] = &Position{bson.NewObjectId(), "", "e1", 10, 10, 2, time.Now()}

    EmployeesAll["e1"] = createEmployee("e1")
    Customers["c1"] = createCustomer("c1")
    Customers["c2"] = createCustomer("c2")
    Customers["c2"].ExpiryTime = time.Unix(0,
        time.Now().UnixNano() - int64(2*userExpiration))

    updateUsers(&positions)

    // Length of returned
    if len(Customers) != 2 {
        t.Errorf("UpdateUsers: Customers length is %d, want %d", len(Customers), 2)
    }
    if len(Employees) != 1 {
        t.Errorf("UpdateUsers: Employees length is %d, want %d", len(Employees), 1)
    }

    // Proper values
    for _,value := range Customers {
        if value.MAC != "c1" && value.MAC != "c2" {
            t.Error("UpdateUsers: Unknown Customer: %q, want %q or %q.",
                value.MAC, "c1", "c2")
        }
    }
    for _,value := range Employees {
        if value.MAC != "e1" {
            t.Error("UpdateUsers: Unknown Employee: %q, want %q.",
                value.MAC, "e1")
        }
    }
}

func TestUpdateInteractions(t *testing.T) {
    resetValues()

    // Set up the data
    positions := make(map[string]*Position)
    positions["c1"] = &Position{bson.NewObjectId(), "", "c1", 50, 50, 2, time.Now()}
    positions["c2"] = &Position{bson.NewObjectId(), "", "c2", 100, 100, 2, time.Now()}
    positions["e1"] = &Position{bson.NewObjectId(), "", "e1", 47, 47, 2, time.Now()}
    positions["e2"] = &Position{bson.NewObjectId(), "", "e2", 0, 0, 2, time.Now()}

    EmployeesAll["e1"] = createEmployee("e1")
    EmployeesAll["e2"] = createEmployee("e2")

    Customers["c1"] = createCustomer("c1")
    Customers["c2"] = createCustomer("c2")

    // Execute methods
    updateUsers(&positions)
    updateInteractions()

    // Tests!!!
    if len(Employees["e1"].Interactions) != 1 {
        t.Error("UpdateInteractions: e1 should have 1 interaction")
    }
    if len(Employees["e2"].Interactions) > 0 {
        t.Error("UpdateInteractions: e2 should not have any interactions")
    }
    if len(Customers["c1"].Interactions) != 1 {
        t.Error("UpdateInteractions: c1 should have 1 interaction")
    }
    if len(Customers["c2"].Interactions) > 0 {
        t.Error("UpdateInteractions: c2 should not have any interactions")
    }
    if Employees["e1"].Interactions[0] != Customers["c1"].Interactions[0] {
        t.Error("UpdateInteractions: e1 and c1 should point to same value")
    }

    // Test interaction expiry
    positions["c1"].X = 100
    Employees["e1"].Interactions[0].LastTime =
        time.Unix(0,time.Now().UnixNano()-int64(time.Hour))

    updateUsers(&positions)

    if len(Employees["e1"].Interactions) > 0 {
        t.Error("UpdateInteractions: e1 should not have any interactions")
    }

}

func TestPriorityValues(t *testing.T) {
    resetValues()

    positions := make(map[string]*Position)
    positions["c1"] = &Position{bson.NewObjectId(), "", "c1", 0, 0, 2, time.Now()}
    positions["e1"] = &Position{bson.NewObjectId(), "", "e1", 0, 0, 2, time.Now()}

    Customers["c1"] = createCustomer("c1")
    Employees["e1"] = createEmployee("e1")

    updateUsers(&positions)
    updateInteractions()

    if Customers["c1"].Priority != 0 {
        t.Error("C1 should have a priority of 0, it has:", Customers["c1"].Priority)
    }

    // Remove interaction
    Customers["c1"].Interactions[0].LastTime = time.Unix(0,time.Now().UnixNano()-
        int64(time.Minute))
    positions["c1"].X = 100

    updateUsers(&positions)

    // Test at 5sec -> .08333
    Customers["c1"].ExpiryTime =
        time.Unix(0,time.Now().UnixNano()+int64(time.Minute)-int64(5*time.Second))

    updateInteractions()

    if Customers["c1"].Priority > .084 || Customers["c1"].Priority < .083 {
        t.Error("C1 should have a priority of 0.08333, it has:", Customers["c1"].Priority)
    }

    // Test at t-5sec -> .91666
    Customers["c1"].Priority = 0.833333333
    Customers["c1"].ExpiryTime =
        time.Unix(0,time.Now().UnixNano()+int64(5*time.Second))
    updateInteractions()

    if Customers["c1"].Priority > .92 || Customers["c1"].Priority < .91 {
        t.Error("C1 should have a priority of 0.91666, it has:", Customers["c1"].Priority)
    }

}
