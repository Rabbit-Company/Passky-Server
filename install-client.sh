#!/usr/bin/env bash

red='\033[0;31m'

check_dependencies () {
  for cmd in "$@"; do
    if ! command -v $cmd >/dev/null 2>&1; then
      echo "This script requires \"${cmd}\" to be installed"
      exit 1
    fi
  done
}

check_dependencies rm git cp printf read sed

echo -e "${red}=========================================================================================="
echo -e "${red}\n\t[WARNING] ... You are about to break Zero-Trust Architecture ... [WARNING]"
echo -e "${red}\n=========================================================================================="
echo -e "${red}If you host this by yourself in your infrastructure it is fine."
echo -e "${red}But, be careful when using this tool on third-party hosting."
echo -e "${red}Because they have the power to change web client content without you realizing the change."
echo -e "${red}Which may lead to leaking your whole vault of passwords or the \"Master Password\" itself."
echo -e "${red}=========================================================================================="
printf "\n${red}Proceed(yes, no): "
read APPROVAL
while [[ ! "$APPROVAL" =~ yes|no$ ]];
do
	printf "${red}\nEntered: $APPROVAL(yes, no)."
	printf "${red}\nProceed(yes, no): "
	read APPROVAL
done

if [ $APPROVAL == "no" ]; then
	exit 0
fi

rm -rf Passky-Website

rm -rf server/src/client

git clone git@github.com:Rabbit-Company/Passky-Website.git

cp -r Passky-Website/website server/src/client

# Dirty Patch #

sed 's/"\/js\/Argon2idWorker.min.js/"\/client\/js\/Argon2idWorker.min.js/g' server/src/client/js/Argon2id.min.js > server/src/client/js/Argon2id.min.js.tmp
mv server/src/client/js/Argon2id.min.js.tmp server/src/client/js/Argon2id.min.js