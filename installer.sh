#!/bin/bash

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

echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       SERVER SETTINGS"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${blue}${bold}In what country your Passky Server is hosted?${blue}"
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
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${brown}       DATABASE SETTINGS"
echo -e "${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
echo -e "${blue}${bold}Provide IP or host for your database.${blue}"
echo -e "If you are using docker, use container name"
echo -e "Example: passky-database"

printf "\n${green}Database host: "
read MYSQL_HOST

echo -e "\n${blue}${bold}Provide user for your database.${blue}"
echo -e "If you are using docker, database with user will be created automatically"
echo -e "Example: passky"

printf "\n${green}Database user: "
read MYSQL_USER

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

echo -e "\n${blue}${bold}Provide password for user 'root'.${blue}"
echo -e "Do not use password provided in example."
echo -e "Example: 9w8e8wil0bteC5iRlXofsnuuEiW1F"

printf "\n${green}Password: "
read -s MYSQL_ROOT_PASSWORD

while [[ ! "$MYSQL_ROOT_PASSWORD" =~ ^[A-Za-z0-9]{8,}$ ]];
do
  echo -e "\n${red}Entered password needs to be at least 8 characters long and can only contain uppercase characters, lowercase characters and numbers."
  printf "\n${green}Password: "
  read -s MYSQL_ROOT_PASSWORD
done
echo -e "\n${gray}----------------------------------------------------------------------------------------------------------------------------------${none}"
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

if [ "$MAIL_ENABLED" = true ]
then
  echo -e "${blue}${bold}Provide SMTP host.${blue}"
  echo -e "Setting up SMTP is not required."
  echo -e "Example: mail.passky.org"

  printf "\n${green}SMTP host: "
  read MAIL_HOST

  echo -e "\n${blue}${bold}Provide SMTP port.${blue}"
  echo -e "Setting up SMTP is not required."
  echo -e "Example: 587"

  printf "\n${green}SMTP port: "
  read MAIL_PORT

  while [[ ! "$MAIL_PORT" =~ ^[0-9]{1,5}$ ]];
  do
    echo -e "${red}'${MAIL_PORT}' is not a valid port. Port must be a number between 1 and 65535."
    printf "\n${green}SMTP port: "
    read MAIL_PORT
  done

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

  echo -e "\n${blue}${bold}Provide SMTP username.${blue}"
  echo -e "Setting up SMTP is not required."
  echo -e "Example: info@passky.org"

  printf "\n${green}SMTP username: "
  read MAIL_USERNAME

  echo -e "\n${blue}${bold}Provide SMTP password.${blue}"
  echo -e "Setting up SMTP is not required."
  echo -e "Example: uDWjSd8wB2HRBHei489o"

  printf "\n${green}SMTP password: "
  read -s MAIL_PASSWORD
fi


echo -e "${none}"