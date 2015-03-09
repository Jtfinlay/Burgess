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

func TestUpdateUsers(t *testing.T) {

    // Set up the data
    positions := make(map[string]*Position)
    positions["c1"] = &Position{bson.NewObjectId(), "", "c1", 30, 30, 2, time.Now()}
    positions["c2"] = &Position{bson.NewObjectId(), "", "c2", 30, 30, 2, time.Now()}
    positions["e1"] = &Position{bson.NewObjectId(), "", "e1", 10, 10, 2, time.Now()}

    var pos Position
    EmployeesAll["e1"] = &Employee{bson.NewObjectId(), "", "e1", time.Now(),
        time.Now(), pos, nil}
    Customers["c1"] = &Customer{"c1", time.Now(), time.Now(), pos, nil}
    Customers["c3"] = &Customer{"c2", time.Now(), time.Unix(0,
        time.Now().UnixNano() - int64(2*userExpiration)), pos, nil}

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

    // Set up the data
    positions := make(map[string]*Position)
    positions["c1"] = &Position{bson.NewObjectId(), "", "c1", 50, 50, 2, time.Now()}
    positions["c2"] = &Position{bson.NewObjectId(), "", "c2", 100, 100, 2, time.Now()}
    positions["e1"] = &Position{bson.NewObjectId(), "", "e1", 47, 47, 2, time.Now()}
    positions["e2"] = &Position{bson.NewObjectId(), "", "e2", 0, 0, 2, time.Now()}

    var pos Position
    EmployeesAll["e1"] = &Employee{bson.NewObjectId(), "", "e1", time.Now(),
        time.Now(), pos, nil}
    EmployeesAll["e2"] = &Employee{bson.NewObjectId(), "", "e2", time.Now(),
        time.Now(), pos, nil}
    Customers["c1"] = &Customer{"c1", time.Now(), time.Now(), pos, nil}
    Customers["c3"] = &Customer{"c2", time.Now(), time.Now(), pos, nil}

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
    if ! Employees["e1"].Interactions[0].active {
        t.Error("UpdateInteractions: interaction is inactive. Should be active")
    }

    // Test interaction expiry
    positions["c1"].X = 100
    Employees["e1"].Interactions[0].LastTime =
        time.Unix(0,time.Now().UnixNano()-int64(time.Hour))

    updateUsers(&positions)

    if Employees["e1"].Interactions[0].active {
        t.Error("UpdateInteractions: interaction should now be inactive.")
    }

}
