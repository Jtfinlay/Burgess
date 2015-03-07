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
		Bluetooth string
		Wifi string
		X float32
		Y float32
		Radius float32
		Time time.Time
	}

	/** Matches db 'archived' **/
	Archived struct {
		MAC string
		X float32
		Y float32
		Radius float32
		Priority float32
	}

	/** Object representing customer in store **/
	Customer struct {
		MAC string
		FirstSeen time.Time
		LastSeen time.Time
		Position Position
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
		active bool
	}
)

/** Convert Position struct to Archived struct **/
func ToArchived(value *Position) *Archived {
	return &Archived{value.Wifi, value.X, value.Y,
					 value.Radius, float32(0)}
}
