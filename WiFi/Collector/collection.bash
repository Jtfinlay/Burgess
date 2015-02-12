#!/bin/bash

echo "Hello World"

HX='[[:xdigit:]]\{1,2\}'
INR="$HX:"

MAC="$INR$INR$INR$INR$INR$HX"
REGEX="[[:blank:]]*$MAC[[:blank:]]*\($MAC\)[[:blank:]]*\(-[[:digit:]]*\).*"
OUTPUT="{\"mac\":\"\1\",\"strength\":\"\2\",\"time\":\"$(date)\"}"

sed "s/$REGEX/$OUTPUT/gi" sample.txt
