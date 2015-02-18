#!/bin/bash

HX='[[:xdigit:]]\{1,2\}'
INR="$HX:"

MAC="$INR$INR$INR$INR$INR$HX"
REGEX="[[:blank:]]*$MAC[[:blank:]]*\($MAC\)[[:blank:]]*\(-[[:digit:]]*\).*"
OUTPUT="{\"mac\":\"\1\",\"strength\":\"\2\",\"time\":\"$(date)\"}"

while read line
do
    sed -n "s/$REGEX/$OUTPUT/gip"
done
