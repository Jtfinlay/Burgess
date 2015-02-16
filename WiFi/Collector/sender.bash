#!/bin/bash

BODY_START="\"data\":["
BODY_END="]"

block=""
counter=0
MAX=100

send()
{
    #TODO::JT use curl to actually send this to something
    toSend="$BODY_START $1 $BODY_END"
    echo "TO SEND: $toSend"
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
