/*
 * This program pushes aggregated data to a fake data to test the LiveFeed
 * system.
 */

package main

import (
    "fmt"
    "models"
    "time"
    "gopkg.in/mgo.v2"
    "gopkg.in/mgo.v2/bson"
)

var (
    col *mgo.Collection
    sleepDuration = 5 * time.Second
    host = "ua-bws.cloudapp.net"
)

func storeUser(c *[1]models.Archived) {
    err := col.Insert(
        bson.M {
            "t": time.Now(),
            "data": *c,
        })
    if err != nil { panic(err) }
}

func main() {
    fmt.Println("Connecting...")
    session, err := mgo.Dial(host)
    if err != nil {
        panic(err)
    }
    fmt.Println("Connection Established!")
    defer session.Close()

    move := float32(1)
    users := &[...]models.Archived{models.Archived{"zzzzzz", 5, 5, 1, 0}}

    col = session.DB("retailers").C("archived_fake")

    for {
        users[0].X += move
        fmt.Println("Storing user")

        storeUser(users)

        time.Sleep(sleepDuration)
        move *= -1
    }
}
