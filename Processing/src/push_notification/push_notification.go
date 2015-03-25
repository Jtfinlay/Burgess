/*
 *	Manage push notifications for devices
 *
 *	Author: James Finlay
 *	Date: March 24th, 2015
 */

package push_notification

import (
 	"net/http"
 	"bytes"
)

/*
 *	Send push notification to all subscribed devices
 */
func Alert() {
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
 }
