/*
 * Test cases for model logic
 *
 *	Author: James Finlay
 *	Date: March 7th, 2015
 */

package models

import (
	"testing"
	"time"
	// "gopkg.in/mgo.v2/bson"
)

func TestCustomerToArchived(t *testing.T) {
	var pos Position
	customer := &Customer{"CARLTON", time.Now(), time.Now(), pos, time.Now(), 0, nil}
	archived := customer.ToArchived()

	if archived.MAC != "CARLTON" {
		t.Error("CustomerToArchived: MAC address wrong: %q, want %q.",
			archived.MAC, "CARLTON")
	}
}


//TODO::JF More model tests