/*
 *	Models to reflect database objects.
 *
 *	Author: James Finlay
 *	Date: March 6th, 2015
 */

package main

import "time"

/** Matches db 'position' **/
type (

	Position struct {
		Bluetooth string
		Wifi string
		X float32
		Y float32
		Radius float32
		Priority float32
		Time time.Time
	}

	/** Matches db 'archived' **/
	Archived struct {
		Mac string
		X float32
		Y float32
		Radius float32
		Priority float32
	}

)

/** Convert Position struct to Archived struct **/
func ToArchived(value *Position) *Archived {
	return &Archived{value.Wifi, value.X, value.Y,
					 value.Radius, value.Priority}
}
