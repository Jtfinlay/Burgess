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
    sleepDuration = 1 * time.Second
    host = "ua-bws.cloudapp.net"
)

func storeUser(c *[2]models.Archived) {
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
    users := &[...]models.Archived{ models.Archived{"zzzzzz", 5, 3.5, 1, 0, false},
                                    models.Archived{"40:B0:FA:68:39:0C", 5, 6.8, 1, 0, true}}

    col = session.DB("retailers").C("archived_fake")

    for {
        users[0].X += move
        users[1].X -= move
        fmt.Println("Storing user at", time.Now().UnixNano())

        storeUser(users)

        time.Sleep(sleepDuration)
        move *= -1
    }
}
