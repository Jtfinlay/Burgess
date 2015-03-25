/*
 *	Models to reflect database objects.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package models

import (
	"time"
	"gopkg.in/mgo.v2/bson"
)

var (
	// Sleep time between loops
	SleepDuration = 2 * time.Second			// period to aggregate data over

	// Interactions - Meet time & wait time
	InitialWait = int64(5*time.Minute)

	ShortInteraction = 1 * time.Minute
	ShortWait = int64(15*time.Minute)

	MediumInteraction = 30 * time.Second
	MediumWait = int64(7*time.Minute)
	
	LongWait = int64(2*time.Minute)

	// Interaction vars
	UserExpiration = 10 * time.Second			// Time until user considered dead
	InteractionExpiration =  5*time.Second 		// Time until interaction considered dead
	InteractionDistance = float32(1)			// 1 metre, boundary box
)

type (

	/** Matches db 'position' **/
	Position struct {
		Id bson.ObjectId "_id"
		Bluetooth string "bluetooth"
		Wifi string "wifi"
		X float32 "x"
		Y float32 "y"
		Radius float32 "radius"
		Time time.Time "time"
	}

	/** Matches db 'archived' **/
	Archived struct {
		MAC string "mac"
		X float32 "x"
		Y float32 "y"
		Radius float32 "radius"
		Priority float32 "priority"
		Employee bool "employee"
	}

	/** Object representing customer in store **/
	Customer struct {
		MAC string
		FirstSeen time.Time
		LastSeen time.Time
		Position Position
		ExpiryTime time.Time
		Priority float32
		Interactions []*Interaction
	}

	/** Object representing employee in store **/
	Employee struct {
		Id bson.ObjectId "_id"
		Retailer bson.ObjectId "retailer"
		MAC string "mac"
		FirstSeen time.Time
		LastSeen time.Time
		Position Position
		Interactions []*Interaction
	}

	/** Object representing an interaction between Customer and Employee **/
	Interaction struct {
		Employee *Employee
		Customer *Customer
		StartTime time.Time
		LastTime time.Time
		PriorityAtStart float32
	}
)

/** Convert Customer struct to Archived struct **/
func (c *Customer) ToArchived() *Archived {
	return &Archived{c.MAC, c.Position.X, c.Position.Y, c.Position.Radius, c.Priority, false}
}

/** Convert Employee struct to Archived struct **/
func (e *Employee) ToArchived() *Archived {
	return &Archived{e.MAC, e.Position.X, e.Position.Y, e.Position.Radius, 0, true}
}

/** Returns the Interaction containing specific customer **/
func FindByCustomer(a []*Interaction, c *Customer) *Interaction {
	for _,value := range a {
		if value.Customer == c { return value }
	}
	return nil
}

/** Remove interaction from Customer **/
func (c *Customer) RemoveInteraction(interaction *Interaction) {
	for i,value := range c.Interactions {
		if value == interaction {
			c.Interactions = append(c.Interactions[:i], c.Interactions[i+1:]...)
		}
	}
}

/** Get preferred wait time for completed interaction **/
func (i *Interaction) GetPriorityTime() time.Time {
	t := time.Since(i.StartTime)
	if t >= ShortInteraction {
		return time.Unix(0, time.Now().UnixNano() + ShortWait)
	} else if t >= MediumInteraction {
		return time.Unix(0, time.Now().UnixNano() + MediumWait)
	} else {
		return time.Unix(0, time.Now().UnixNano() + LongWait)
	}
}

/** Convert from Customer hash to Archived array **/
func custToArchived(hash *map[string]*Customer) *[]Archived {
    result := make([]Archived, 0)
    for _,value := range *hash {
        result = append(result, *value.ToArchived())
    }
    return &result
}

/** Convert from Employee hash to Archived array **/
func emplToArchived(hash *map[string]*Employee) *[]Archived {
    result := make([]Archived, 0)
    for _,value := range *hash {
        result = append(result, *value.ToArchived())
    }
    return &result
}

