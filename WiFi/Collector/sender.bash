#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Please supply an ID as the first parameter to sender!"
    exit 1
fi

ID="\"id\":\"$1\", "

DEST="http://192.168.1.73:8000/drone"
BODY_START="{$ID\"data\":["
BODY_END="]}"

block=""
counter=0
MAX=100

send()
{
    # we need to strip duplicates, easiest way to do this is sort -u
    # However, that only reads from file. So we dump the contents to a temp file,
    # sort and strip, then send the results.
    arr=$1
    echo "$arr" > "./tmp.txt"
    arr="$(sort -u -b -f ./tmp.txt)"

    lastChar="${arr: -1}"
    if [ "$lastChar" = "," ];then
	arr="${arr%?}"
    fi

    toSend="$BODY_START $arr $BODY_END"
    
    curl --silent -m 10 -H "Content-Type: application/json" --data "$toSend" "$DEST"
    rm "./tmp.txt"
}

while read line 
do
    block="$block $line,"$'\n'
    counter=$((counter + 1))
    if (( "$counter" > "$MAX" )); then
	# send this block, reset and carry on
	send "$block"
	block=""
	counter=0
    fi
done

# send anything that is left
send "$block"
