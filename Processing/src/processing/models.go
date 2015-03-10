/*
 *	Models to reflect database objects.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package main

import (
	"time"
	"gopkg.in/mgo.v2/bson"
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
	}
)

/** Convert Position struct to Archived struct **/
func (v *Position) toArchived() *Archived {
	return &Archived{v.Wifi, v.X, v.Y, v.Radius, float32(0)}
}

/** Returns the Interaction containing specific customer **/
func findByCustomer(a []*Interaction, c *Customer) *Interaction {
	for _,value := range a {
		if value.Customer == c { return value }
	}
	return nil
}

/** Remove interaction from Customer **/
func (c *Customer) removeInteraction(interaction *Interaction) {
	for i,value := range c.Interactions {
		if value == interaction {
			c.Interactions = append(c.Interactions[:i], c.Interactions[i+1:]...)
		}
	}
}

/** Get preferred wait time for completed interaction **/
func (i *Interaction) getPriorityTime() time.Time {
	t := time.Since(i.StartTime)
	if t >= (1 * time.Minute) {
		return time.Unix(0, time.Now().UnixNano() + int64(15*time.Minute))
	} else if t >= (30 * time.Second) {
		return time.Unix(0, time.Now().UnixNano() + int64(7*time.Minute))
	} else {
			return time.Unix(0, time.Now().UnixNano() + int64(2*time.Minute))
	}
}
