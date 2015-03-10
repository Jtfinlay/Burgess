/*
 * This program pushes aggregated data to a fake data to test the LiveFeed
 * system.
 */

package livefeed

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

func storeUser(c *models.Archived) {
    err := col.Insert(
        bson.M {
            "t": time.Now(),
            "data": *c,
        })
    if err != nil { panic(err) }
}

func Run() {
    fmt.Println("Connecting...")
    session, err := mgo.Dial(host)
    if err != nil {
        panic(err)
    }
    fmt.Println("Connection Established!")
    defer session.Close()

    move := float32(1)
    user := &models.Archived{"zzzzzz", 5, 5, 1, 0}

    col = session.DB("retailers").C("archived_fake")

    for {
        user.X += move

        storeUser(user)

        time.Sleep(sleepDuration)
        move *= -1
    }
}
