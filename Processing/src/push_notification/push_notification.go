/*
 *	Send push notification.
 *
 *	Author: James Finlay
 *	Date: March 24th, 2015
 */

package push_notification

import (
 	"fmt"
 	"net/http"
 	"bytes"
 	"io/ioutil"
)

 func alert() {

 	url := "https://api.parse.com/1/push"
 	jsonStr := []byte(`{"where": {"deviceType": "android"},"data": {"alert": "Customer help!"}}`)
 	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
 	req.Header.Set("X-Parse-Application-Id", "OHZhBe7qRjQWqz0IkKV9mOKXcb7yA4tRSgIvjQBC")
 	req.Header.Set("X-Parse-REST-API-Key", "UXIDM1eOoC2dJEjLDclRyKTI3lCXivw5EkzlFkFb")
 	req.Header.Set("Content-Type", "application/json")

 	client := &http.Client{}
 	resp, err := client.Do(req)
 	if err != nil {
 		panic(err)
 	}
 	defer resp.Body.Close()

 	fmt.Println("response Status:", resp.Status)
    fmt.Println("response Headers:", resp.Header)
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println("response Body:", string(body))
 }