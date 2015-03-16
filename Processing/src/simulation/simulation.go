/*
 *	This program simulates a retail space. It has random people walking around.
 */

package main
 
import (
 	"fmt"
 	"time"
    "gopkg.in/mgo.v2"
)

var (
	host = "ua-bws.cloudapp.net"
	sleepDuration = 1 * time.Second
	col *mgo.Collection
)

type Position struct {
	Wifi string "wifi"
	X float32 "x"
	Y float32 "y"
	Radius float32 "radius"
	Time time.Time "time"
}

func storeUser(v *Position) {
	err := col.Insert(*v)
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

    col = session.DB("retailers").C("position")

    move1 := float32(0.5)
    move2 := float32(0.25)

    move3 := float32(0.05)

    customer1 := &Position{"aaaaaa",1,.7,0.5,time.Now()}
    customer2 := &Position{"bbbbbb",1,9.8,0.5,time.Now()}
    employee3 := &Position{"40:B0:FA:68:39:0C",6,1,0.5,time.Now()}
    employee4 := &Position{"C0:EE:FB:25:F9:B6",11,9.8,0.5,time.Now()}
    customer4 := &Position{"ffffff",1,2,0.5,time.Now()}

    for {
    	customer1.X += move1
    	customer2.X += move2
    	employee3.Y += move3

    	if customer1.X > 11 || customer1.X < 1 { move1 *= -1 }
    	if customer2.X > 11 || customer2.X < 1 { move2 *= -1 }
    	if employee3.Y > 9 || employee3.Y < 1 { move3 *= -1 }

    	customer1.Time = time.Now()
    	customer2.Time = time.Now()
    	employee3.Time = time.Now()
    	employee4.Time = time.Now()
        customer4.Time = time.Now()

    	storeUser(customer1)
    	storeUser(customer2)
    	storeUser(employee3)
    	storeUser(employee4)
        storeUser(customer4)

    	time.Sleep(sleepDuration)
    }


}