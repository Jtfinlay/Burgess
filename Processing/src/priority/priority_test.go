/*
 *  Test cases for the priority logic
 *
 *	Author: James Finlay
 *	Date: March 7th, 2015
 */

package priority

import (
    "testing"
    "time"
    "models"
    "gopkg.in/mgo.v2/bson"
)

func resetValues() {
    models.DEBUG = true
    models.SleepDuration = 5*time.Second
    Customers = make(map[string]*models.Customer,0)
    Employees = make(map[string]*models.Employee, 0)
    EmployeesAll = make(map[string]*models.Employee, 0)
}
func createCustomer(MAC string) *models.Customer {
    var pos models.Position
    return &models.Customer{MAC, time.Now(), time.Now(), pos, time.Now(), 0, nil}
}
func createEmployee(MAC string) *models.Employee {
    var pos models.Position
    return &models.Employee{"", "", MAC, time.Now(), time.Now(), pos, nil}
}
func TestUpdateUsers(t *testing.T) {
    resetValues()
    // Set up the data
    positions := make(map[string]*models.Position)
    positions["c1"] = &models.Position{bson.NewObjectId(), "", "c1", 30, 30, 2, time.Now()}
    positions["c2"] = &models.Position{bson.NewObjectId(), "", "c2", 30, 30, 2, time.Now()}
    positions["e1"] = &models.Position{bson.NewObjectId(), "", "e1", 10, 10, 2, time.Now()}

    EmployeesAll["e1"] = createEmployee("e1")
    Customers["c1"] = createCustomer("c1")
    Customers["c2"] = createCustomer("c2")
    Customers["c2"].ExpiryTime = time.Unix(0, time.Now().UnixNano() - int64(2*models.UserExpiration))

    UpdateUsers(&positions)

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

    tNow := time.Now()
    models.TimeNow = tNow

    // Set up the data
    positions := make(map[string]*models.Position)
    positions["c1"] = &models.Position{bson.NewObjectId(), "", "c1", 50, 50, 2, tNow}
    positions["c2"] = &models.Position{bson.NewObjectId(), "", "c2", 100, 100, 2, tNow}
    positions["e1"] = &models.Position{bson.NewObjectId(), "", "e1", 49.5, 49.5, 2, tNow}
    positions["e2"] = &models.Position{bson.NewObjectId(), "", "e2", 0, 0, 2, tNow}

    EmployeesAll["e1"] = createEmployee("e1")
    EmployeesAll["e2"] = createEmployee("e2")

    Customers["c1"] = createCustomer("c1")
    Customers["c2"] = createCustomer("c2")

    // Execute methods
    UpdateUsers(&positions)
    UpdateInteractions()

    // Tests!!!
    if len(Employees["e1"].Interactions) != 1 {
        t.Error("UpdateInteractions: e1 should have 1 interaction. Has", len(Employees["e1"].Interactions))
    }
    if len(Employees["e2"].Interactions) > 0 {
        t.Error("UpdateInteractions: e2 should not have any interactions")
    }
    if len(Customers["c1"].Interactions) != 1 {
        t.Error("UpdateInteractions: c1 should have 1 interaction. Has", len(Customers["c1"].Interactions))
    }
    if len(Customers["c2"].Interactions) > 0 {
        t.Error("UpdateInteractions: c2 should not have any interactions")
    }
    if Employees["e1"].Interactions[0] != Customers["c1"].Interactions[0] {
        t.Error("UpdateInteractions: e1 and c1 should point to same value")
    }

    // Test interaction expiry
    positions["c1"].X = 100
    Employees["e1"].Interactions[0].LastTime = tNow.Add(-time.Hour)

    UpdateUsers(&positions)

    if len(Employees["e1"].Interactions) > 0 {
        t.Error("UpdateInteractions: e1 should not have any interactions")
    }

}

func TestPriorityValues(t *testing.T) {
    resetValues()

    tNow := time.Now()
    models.TimeNow = tNow

    positions := make(map[string]*models.Position)
    positions["c1"] = &models.Position{bson.NewObjectId(), "", "c1", 0, 0, 2, tNow}
    positions["e1"] = &models.Position{bson.NewObjectId(), "", "e1", 0, 0, 2, tNow}

    Customers["c1"] = createCustomer("c1")
    Employees["e1"] = createEmployee("e1")

    UpdateUsers(&positions)
    UpdateInteractions()

    if Customers["c1"].Priority != 0 {
        t.Error("C1 should have a priority of 0, it has:", Customers["c1"].Priority)
    }

    // Remove interaction
    Customers["c1"].Interactions[0].LastTime = tNow.Add(-time.Minute)
    positions["c1"].X = 100

    UpdateUsers(&positions)

    // Test at 5sec -> .08333
    Customers["c1"].ExpiryTime = tNow.Add(time.Minute - 5*time.Second)

    UpdateInteractions()

    if Customers["c1"].Priority > .084 || Customers["c1"].Priority < .083 {
        t.Error("C1 should have a priority of 0.08333, it has:", Customers["c1"].Priority)
    }

    // Test at t-5sec -> .91666
    Customers["c1"].Priority = 0.833333333
    Customers["c1"].ExpiryTime = tNow.Add(5*time.Second)
        
    UpdateInteractions()

    if Customers["c1"].Priority > .92 || Customers["c1"].Priority < .91 {
        t.Error("C1 should have a priority of 0.91666, it has:", Customers["c1"].Priority)
    }

}
