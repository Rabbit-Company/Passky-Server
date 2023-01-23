#!/usr/bin/env bash

# Available Colors
brown='\033[0;33m'
green='\033[0;32m'
blue='\033[0;34m'
gray='\033[0;37m'
red='\033[0;31m'

bold='\e[1m'
none='\033[0m'

# Validate
validBoolean=("true" "false")
validLocations=("AF" "AX" "AL" "DZ" "AS" "AD" "AO" "AI" "AQ" "AG" "AR" "AM" "AW" "AU" "AT" "AZ" "BH" "BS" "BD" "BB" "BY" "BE" "BZ" "BJ" "BM" "BT" "BO" "BQ" "BA" "BW" "BV" "BR" "IO" "BN" "BG" "BF" "BI" "KH" "CM" "CA" "CV" "KY" "CF" "TD" "CL" "CN" "CX" "CC" "CO" "KM" "CG" "CD" "CK" "CR" "CI" "HR" "CU" "CW" "CY" "CZ" "DK" "DJ" "DM" "DO" "EC" "EG" "SV" "GQ" "ER" "EE" "ET" "FK" "FO" "FJ" "FI" "FR" "GF" "PF" "TF" "GA" "GM" "GE" "DE" "GH" "GI" "GR" "GL" "GD" "GP" "GU" "GT" "GG" "GN" "GW" "GY" "HT" "HM" "VA" "HN" "HK" "HU" "IS" "IN" "ID" "IR" "IQ" "IE" "IM" "IL" "IT" "JM" "JP" "JE" "JO" "KZ" "KE" "KI" "KP" "KR" "KW" "KG" "LA" "LV" "LB" "LS" "LR" "LY" "LI" "LT" "LU" "MO" "MK" "MG" "MW" "MY" "MV" "ML" "MT" "MH" "MQ" "MR" "MU" "YT" "MX" "FM" "MD" "MC" "MN" "ME" "MS" "MA" "MZ" "MM" "NA" "NR" "NP" "NL" "NC" "NZ" "NI" "NE" "NG" "NU" "NF" "MP" "NO" "OM" "PK" "PW" "PS" "PA" "PG" "PY" "PE" "PH" "PN" "PL" "PT" "PR" "QA" "RE" "RO" "RU" "RW" "BL" "SH" "KN" "LC" "MF" "PM" "VC" "WS" "SM" "ST" "SA" "SN" "RS" "SC" "SL" "SG" "SX" "SK" "SI" "SB" "SO" "ZA" "GS" "SS" "ES" "LK" "SD" "SR" "SJ" "SZ" "SE" "CH" "SY" "TW" "TJ" "TZ" "TH" "TL" "TG" "TK" "TO" "TT" "TN" "TR" "TM" "TC" "TV" "UG" "UA" "AE" "GB" "US" "UM" "UY" "UZ" "VU" "VE" "VN" "VG" "VI" "WF" "EH" "YE" "ZM" "ZW")

echo -e "${brown}"
echo "  _____              _          "
echo " |  __ \            | |         "
echo " | |__) |_ _ ___ ___| | ___   _ "
echo " |  ___/ _\` / __/ __| |/ / | | |"
echo " | |  | (_| \__ \__ \   <| |_| |"
echo " |_|   \__,_|___/___/_|\_\\__,  |"
echo "                           __/ |"
echo "                          |___/ "
echo -e "${green}"

echo "Welcome to Passky Server installer."
echo -e "This installer will only create an .env file based on your answers.\n"
echo -e "If you made a mistake just re-run the installer."

now=$(date)
cores=$(grep -c ^processor /proc/cpuinfo)
echo "#" > .env
echo "# Passky configuration file" >> .env
echo "# Created ${now}" >> .env
echo "#" >> .env

if [ "$cores" -ge 1 ] && [ "$cores" -le 1024 ]; then
	echo "SERVER_CORES=${cores}" >> .env
else
	echo "SERVER_CORES=1" >> .env
fi

echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       SERVER SETTINGS"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"

echo -e "\n${blue}${bold}Provide username for your Admin Panel.${blue}"
echo -e "On Admin Panel you will be able to manage passky accounts."
echo -e "Example: admin"
printf "\n${green}Admin username: "
read ADMIN_USERNAME
while [[ -z "$ADMIN_USERNAME" ]];
do
	echo -e "\n${red}Please enter Admin username."
	printf "\n${green}Admin username: "
	read ADMIN_USERNAME
done
echo "ADMIN_USERNAME=${ADMIN_USERNAME}" >> .env

echo -e "\n${blue}${bold}Provide password for your Admin Panel.${blue}"
echo -e "On Admin Panel you will be able to manage passky accounts."
echo -e "Example: fehu2UPmpragklWoJcbr4BajxoaGns"
printf "\n${green}Admin password: "
read -s ADMIN_PASSWORD
while [[ ! "$ADMIN_PASSWORD" =~ ^[A-Za-z0-9]{8,}$ ]];
do
	echo -e "\n${red}Entered password needs to be at least 8 characters long and can only contain uppercase characters, lowercase characters and numbers."
	printf "\n${green}Password: "
	read -s ADMIN_PASSWORD
done
echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env

echo -e "\n\n${blue}${bold}In what country your Passky Server is hosted?${blue}"
echo -e "Only 'ISO 3166-1 alpha-2' codes are accepted. (https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements)"
echo -e "Example: US"
printf "\n${green}Server location: "
read SERVER_LOCATION
while [[ ! " ${validLocations[@]} " =~ " ${SERVER_LOCATION} " ]];
do
	echo -e "${red}Location '${SERVER_LOCATION}' is not a valid location. Make sure you use uppercase characters."
	printf "${green}Server location: "
	read SERVER_LOCATION
done
echo "SERVER_LOCATION=${SERVER_LOCATION}" >> .env

echo -e "\n${blue}${bold}How many accounts can be created on this Passky Server?${blue}"
echo -e "When this amount would be reached, new users won't be able to create their accounts on this server."
echo -e "For Unlimited accounts use -1"
echo -e "Example: 100"
printf "\n${green}Maximum accounts created: "
read ACCOUNT_MAX
while [[ !( "$ACCOUNT_MAX" =~ ^[-]?[0-9]+ && "$ACCOUNT_MAX" -ge -1 && "$ACCOUNT_MAX" -le 1000000000 ) ]];
do
	echo -e "\n${red}'$ACCOUNT_MAX' is not a valid number. Make sure number is between -1 and 1000000000."
	printf "\n${green}Maximum accounts created: "
	read ACCOUNT_MAX
done
echo "ACCOUNT_MAX=${ACCOUNT_MAX}" >> .env

echo -e "\n${blue}${bold}How many passwords can each account hold/have?${blue}"
echo -e "When this amount would be reached, users won't be able to save new passwords."
echo -e "For Unlimited passwords use -1"
echo -e "Example: 1000"
printf "\n${green}Maximum passwords per account: "
read ACCOUNT_MAX_PASSWORDS
while [[ !( "$ACCOUNT_MAX_PASSWORDS" =~ ^[-]?[0-9]+ && "$ACCOUNT_MAX_PASSWORDS" -ge -1 && "$ACCOUNT_MAX_PASSWORDS" -le 1000000000 ) ]];
do
	echo -e "\n${red}'$ACCOUNT_MAX_PASSWORDS' is not a valid number. Make sure number is between -1 and 1000000000."
	printf "\n${green}Maximum passwords per account: "
	read ACCOUNT_MAX_PASSWORDS
done
echo "ACCOUNT_MAX_PASSWORDS=${ACCOUNT_MAX_PASSWORDS}" >> .env

echo -e "\n${blue}${bold}How many passwords can premium account hold/have?${blue}"
echo -e "When this amount would be reached, users with premium accounts won't be able to save new passwords."
echo -e "For Unlimited passwords use -1"
echo -e "Example: -1"
printf "\n${green}Maximum passwords per premium account: "
read ACCOUNT_PREMIUM
while [[ !( "$ACCOUNT_PREMIUM" =~ ^[-]?[0-9]+ && "$ACCOUNT_PREMIUM" -ge -1 && "$ACCOUNT_PREMIUM" -le 1000000000 ) ]];
do
	echo -e "\n${red}'$ACCOUNT_PREMIUM' is not a valid number. Make sure number is between -1 and 1000000000."
	printf "\n${green}Maximum passwords per premium account: "
	read ACCOUNT_PREMIUM
done
echo "ACCOUNT_PREMIUM=${ACCOUNT_PREMIUM}" >> .env

echo -e "\n${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       DATABASE SETTINGS"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"

echo -e "\n${blue}${bold}Provide Database Engine Type.${blue}"
echo -e "Currently support: (sqlite, mysql)"
printf "\n${green}Database Engine: "
read DATABASE_ENGINE
while [[ ! "$DATABASE_ENGINE" =~ sqlite|mysql$ ]];
do
	echo -e "\n${red}Entered database engine that not supported, currently support: (sqlite, mysql)."
	printf "\n${green}Database Engine: "
	read DATABASE_ENGINE
done
echo "DATABASE_ENGINE=${DATABASE_ENGINE}" >> .env

if [ $DATABASE_ENGINE == "sqlite" ]; then
	echo -e "\n${blue}${bold}Provide database file name.${blue}"
	echo -e "If you are using docker, database with user will be created automatically"
	echo -e "Example: passky"
	printf "\n${green}Database file name: "
	read DATABASE_FILE
	while [[ -z "$DATABASE_FILE" ]];
	do
		echo -e "\n${red}Please enter database file name."
		printf "\n${green}Database file name: "
		read DATABASE_FILE
	done
fi
echo "DATABASE_FILE=${DATABASE_FILE}" >> .env

if [ $DATABASE_ENGINE == "mysql" ]; then
	echo -e "${blue}${bold}Provide IP or host for your database.${blue}"
	echo -e "If you are using docker, use container name"
	echo -e "Example: passky-database"
	printf "\n${green}Database host: "
	read MYSQL_HOST
fi
echo "MYSQL_HOST=${MYSQL_HOST}" >> .env

if [ $DATABASE_ENGINE == "mysql" ]; then
	echo -e "\n${blue}${bold}Provide database port.${blue}"
	echo -e "If you are using docker, use port 3306"
	echo -e "Example: 3306"
	printf "\n${green}Database port: "
	read MYSQL_PORT
fi
echo "MYSQL_PORT=${MYSQL_PORT}" >> .env

if [ $DATABASE_ENGINE == "mysql" ]; then
	echo -e "\n${blue}${bold}Provide database name.${blue}"
	echo -e "If you are using docker, database with user will be created automatically"
	echo -e "Example: passky"
	printf "\n${green}Database name: "
	read MYSQL_DATABASE
fi
echo "MYSQL_DATABASE=${MYSQL_DATABASE}" >> .env

if [ $DATABASE_ENGINE == "mysql" ]; then
	echo -e "\n${blue}${bold}Provide user for your database.${blue}"
	echo -e "If you are using docker, database with user will be created automatically"
	echo -e "Example: passky"
	printf "\n${green}Database user: "
	read MYSQL_USER
fi
echo "MYSQL_USER=${MYSQL_USER}" >> .env

if [ $DATABASE_ENGINE == "mysql" ]; then
	echo -e "\n${blue}${bold}Provide password for user '${MYSQL_USER}'.${blue}"
	echo -e "Do not use password provided in example."
	echo -e "Example: uDWjSd8wB2HRBHei489o"
	printf "\n${green}Password: "
	read -s MYSQL_PASSWORD
	while [[ ! "$MYSQL_PASSWORD" =~ ^[A-Za-z0-9]{8,}$ ]];
	do
		echo -e "\n${red}Entered password needs to be at least 8 characters long and can only contain uppercase characters, lowercase characters and numbers."
		printf "\n${green}Password: "
		read -s MYSQL_PASSWORD
	done
fi
echo "MYSQL_PASSWORD=${MYSQL_PASSWORD}" >> .env

echo "MYSQL_CACHE_MODE=0" >> .env
echo "MYSQL_SSL=false" >> .env
echo "MYSQL_SSL_CA=/etc/ssl/certs/ca-certificates.crt" >> .env

echo -e "\n\n${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       MAIL SETTINGS"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"

echo -e "${blue}${bold}Do you want to enable SMTP mail?${blue}"
echo -e "Setting up SMTP is not required."
echo -e "Example: false"
printf "\n${green}Enable mail: "
read MAIL_ENABLED
while [[ ! " ${validBoolean[@]} " =~ " ${MAIL_ENABLED} " ]];
do
	echo -e "${red}'${MAIL_ENABLED}' is not a valid boolean. You can only answer this question with 'true' or 'false'."
	printf "\n${green}Enable mail: "
	read MAIL_ENABLED
done
echo "MAIL_ENABLED=${MAIL_ENABLED}" >> .env

if [ "$MAIL_ENABLED" = true ]
then
	echo -e "${blue}${bold}Provide SMTP host.${blue}"
	echo -e "Setting up SMTP is not required."
	echo -e "Example: mail.passky.org"
	printf "\n${green}SMTP host: "
	read MAIL_HOST
	echo "MAIL_HOST=${MAIL_HOST}" >> .env

	echo -e "\n${blue}${bold}Provide SMTP port.${blue}"
	echo -e "Setting up SMTP is not required."
	echo -e "Example: 465"
	printf "\n${green}SMTP port: "
	read MAIL_PORT
	while [[ ! "$MAIL_PORT" =~ ^[0-9]{1,5}$ ]];
	do
		echo -e "${red}'${MAIL_PORT}' is not a valid port. Port must be a number between 1 and 65535."
		printf "\n${green}SMTP port: "
		read MAIL_PORT
	done
	echo "MAIL_PORT=${MAIL_PORT}" >> .env

	echo -e "\n${blue}${bold}Use TLS?.${blue}"
	echo -e "Setting up SMTP is not required."
	echo -e "Example: true"
	printf "\n${green}Use TLS: "
	read MAIL_USE_TLS
	while [[ ! " ${validBoolean[@]} " =~ " ${MAIL_USE_TLS} " ]];
	do
		echo -e "${red}'${MAIL_USE_TLS}' is not a valid boolean. You can only answer this question with 'true' or 'false'."
		printf "\n${green}Enable mail: "
		read MAIL_USE_TLS
	done
	echo "MAIL_USE_TLS=${MAIL_USE_TLS}" >> .env

	echo -e "\n${blue}${bold}Provide SMTP username.${blue}"
	echo -e "Setting up SMTP is not required."
	echo -e "Example: info@passky.org"
	printf "\n${green}SMTP username: "
	read MAIL_USERNAME
	# REF https://github.com/deajan/linuxscripts/blob/master/emailCheck.sh#L73
	rfc822="^[a-z0-9!#\$%&'*+/=?^_\`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_\`{|}~-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?\$"
	while [[ ! "$MAIL_USERNAME" =~ $rfc822 ]];
	do
		echo -e "${red}'${MAIL_USERNAME}' is not a valid email address."
		printf "\n${green}SMTP username: "
		read MAIL_USERNAME
	done
	echo "MAIL_USERNAME=${MAIL_USERNAME}" >> .env

	echo -e "\n${blue}${bold}Provide SMTP password.${blue}"
	echo -e "Setting up SMTP is not required."
	echo -e "Example: uDWjSd8wB2HRBHei489o"
	printf "\n${green}SMTP password: "
	read -s MAIL_PASSWORD
	echo "MAIL_PASSWORD=${MAIL_PASSWORD}" >> .env
else
	echo "MAIL_HOST=" >> .env
	echo "MAIL_PORT=465" >> .env
	echo "MAIL_USERNAME=" >> .env
	echo "MAIL_PASSWORD=" >> .env
	echo "MAIL_USE_TLS=true" >> .env
fi

echo -e "\n\n${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       API CALL LIMITER (Brute force mitigation)"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"

echo -e "${blue}${bold}Do you want API call limiter to be enabled?${blue}"
echo -e "API call limiter will only allow specific amount of calls for each device (IP)."
echo -e "${red}If you expose this Passky Server to the internet, this should be enabled for security reasons.${blue}"
echo -e "Example: true"
printf "\n${green}API call limiter enabled: "
read LIMITER_ENABLED
while [[ ! " ${validBoolean[@]} " =~ " ${LIMITER_ENABLED} " ]];
do
	echo -e "${red}'${LIMITER_ENABLED}' is not a valid boolean. You can only answer this question with 'true' or 'false'."
	printf "\n${green}API call limiter enabled: "
	read LIMITER_ENABLED
done
echo "LIMITER_ENABLED=${LIMITER_ENABLED}" >> .env

echo "LIMITER_GET_INFO=-1" >> .env
echo "LIMITER_GET_STATS=-1" >> .env
echo "LIMITER_GET_TOKEN=3" >> .env
echo "LIMITER_GET_PASSWORDS=2" >> .env
echo "LIMITER_SAVE_PASSWORD=2" >> .env
echo "LIMITER_EDIT_PASSWORD=2" >> .env
echo "LIMITER_DELETE_PASSWORD=2" >> .env
echo "LIMITER_DELETE_PASSWORDS=10" >> .env
echo "LIMITER_CREATE_ACCOUNT=10" >> .env
echo "LIMITER_DELETE_ACCOUNT=10" >> .env
echo "LIMITER_IMPORT_PASSWORDS=10" >> .env
echo "LIMITER_FORGOT_USERNAME=60" >> .env
echo "LIMITER_ENABLE_2FA=10" >> .env
echo "LIMITER_DISABLE_2FA=10" >> .env
echo "LIMITER_ADD_YUBIKEY=10" >> .env
echo "LIMITER_REMOVE_YUBIKEY=10" >> .env
echo "LIMITER_UPGRADE_ACCOUNT=10" >> .env
echo "LIMITER_GET_REPORT=-1" >> .env

echo "YUBI_CLOUD=https://api.yubico.com/wsapi/2.0/verify" >> .env
echo "YUBI_ID=67857" >> .env

echo "CF_TURNSTILE_SITE_KEY=1x00000000000000000000AA" >> .env
echo "CF_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA" >> .env

echo "REDIS_HOST=127.0.0.1" >> .env
echo "REDIS_PORT=6379" >> .env
echo "REDIS_PASSWORD=" >> .env

echo "REDIS_LOCAL_HOST=127.0.0.1" >> .env
echo "REDIS_LOCAL_PORT=6379" >> .env
echo "REDIS_LOCAL_PASSWORD=" >> .env

echo -e "\n${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${green}            ENV FILE HAS BEEN SUCCESSFULLY GENEREATED"
echo -e "${blue} Now you can deploy Passky Server with command: ${bold}docker-compose up -d"
echo -e "${blue} If you made a mistake you can just re-run the installer with command: ${bold}./installer.sh"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"

echo -e "${none}"

cp .env api/.env