#!/bin/bash

DEST="http://192.168.1.67:8000/drone"
BODY_START="{\"data\":["
BODY_END="]}"

block=""
counter=0
MAX=100

send()
{
    toSend="$BODY_START $1 $BODY_END"
    curl --silent -H "Content-Type: application/json" --data "$toSend" "$DEST"
}

while read line 
do
    block="$block $line"
    counter=$((counter + 1))
    if (( "$counter" > "$MAX" )); then
	# send this block, reset and carry on
	send "$block"
	block=""
	counter=0
    else
        # if we are not sending append a comma
        block="$block,"
    fi
done

# strip comma at end
block="${block%?}"
# send anything that is left
send "$block"
