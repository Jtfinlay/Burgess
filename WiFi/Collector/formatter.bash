#!/bin/bash

HX='[[:xdigit:]]\{2\}'
INR="$HX:"

MAC="$INR$INR$INR$INR$INR$HX"
REGEX=".*\($MAC\)[[:blank:]]*\(-[[:digit:]]*\).*$"

while read line
do
    # output needs to be re-init each time otherwise the date is just the start
    # date of the script
    OUTPUT="{\"mac\":\"\1\",\"strength\":\"\2\",\"time\":\"$(date)\"}"
    echo "$line" | sed -n "s/$REGEX/$OUTPUT/gip"
done
