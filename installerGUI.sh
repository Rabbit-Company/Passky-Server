#!/usr/bin/env bash

if (! whiptail --title "Passky Installer" --yesno "Passky Installer will remove your current .env file and create a new one based on your provided answers.\n\nDo you want to process with the installer?" 12 78);
then
	exit
fi

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

ADMIN_USERNAME=$(whiptail --title "Passky Installer - Admin Settings" --inputbox "Provide username for your Admin Panel.\n\nOn Admin Panel you will be able to manage passky accounts." 12 78 admin 3>&1 1>&2 2>&3)
echo "ADMIN_USERNAME=${ADMIN_USERNAME}" >> .env

ADMIN_PASSWORD=$(whiptail --title "Passky Installer - Admin Settings" --passwordbox "Provide password for your Admin Panel.\n\nOn Admin Panel you will be able to manage passky accounts." 12 78 3>&1 1>&2 2>&3)
echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env

SERVER_LOCATION=$(whiptail --title "Passky Installer - Server Settings" --menu "Choose server location:" 25 78 16 "AD" "Andorra" "AE" "United Arab Emirates" "AF" "Afghanistan" "AG" "Antigua and Barbuda" "AI" "Anguilla" "AL" "Albania" "AM" "Armenia" "AO" "Angola" "AQ" "Antarctica" "AR" "Argentina" "AS" "American Samoa" "AT" "Austria" "AU" "Australia" "AW" "Aruba" "AX" "Åland Islands" "AZ" "Azerbaijan" "BA" "Bosnia and Herzegovina" "BB" "Barbados" "BD" "Bangladesh" "BE" "Belgium" "BF" "Burkina Faso" "BG" "Bulgaria" "BH" "Bahrain" "BI" "Burundi" "BJ" "Benin" "BL" "Saint Barthélemy" "BM" "Bermuda" "BN" "Brunei Darussalam" "BO" "Bolivia (Plurinational State of)" "BQ" "Bonaire, Sint Eustatius and Saba" "BR" "Brazil" "BS" "Bahamas" "BT" "Bhutan" "BV" "Bouvet Island" "BW" "Botswana" "BY" "Belarus" "BZ" "Belize" "CA" "Canada" "CC" "Cocos (Keeling) Islands" "CD" "Congo, Democratic Republic of the" "CF" "Central African Republic" "CG" "Congo" "CH" "Switzerland" "CI" "Côte d'Ivoire" "CK" "Cook Islands" "CL" "Chile" "CM" "Cameroon" "CN" "China" "CO" "Colombia" "CR" "Costa Rica" "CU" "Cuba" "CV" "Cabo Verde" "CW" "Curaçao" "CX" "Christmas Island" "CY" "Cyprus" "CZ" "Czechia" "DE" "Germany" "DJ" "Djibouti" "DK" "Denmark" "DM" "Dominica" "DO" "Dominican Republic" "DZ" "Algeria" "EC" "Ecuador" "EE" "Estonia" "EG" "Egypt" "EH" "Western Sahara" "ER" "Eritrea" "ES" "Spain" "ET" "Ethiopia" "FI" "Finland" "FJ" "Fiji" "FK" "Falkland Islands (Malvinas)" "FM" "Micronesia (Federated States of)" "FO" "Faroe Islands" "FR" "France" "GA" "Gabon" "GB" "United Kingdom of Great Britain and Northern Ireland" "GD" "Grenada" "GE" "Georgia" "GF" "French Guiana" "GG" "Guernsey" "GH" "Ghana" "GI" "Gibraltar" "GL" "Greenland" "GM" "Gambia" "GN" "Guinea" "GP" "Guadeloupe" "GQ" "Equatorial Guinea" "GR" "Greece" "GS" "South Georgia and the South Sandwich Islands" "GT" "Guatemala" "GU" "Guam" "GW" "Guinea-Bissau" "GY" "Guyana" "HK" "Hong Kong" "HM" "Heard Island and McDonald Islands" "HN" "Honduras" "HR" "Croatia" "HT" "Haiti" "HU" "Hungary" "ID" "Indonesia" "IE" "Ireland" "IL" "Israel" "IM" "Isle of Man" "IN" "India" "IO" "British Indian Ocean Territory" "IQ" "Iraq" "IR" "Iran (Islamic Republic of)" "IS" "Iceland" "IT" "Italy" "JE" "Jersey" "JM" "Jamaica" "JO" "Jordan" "JP" "Japan" "KE" "Kenya" "KG" "Kyrgyzstan" "KH" "Cambodia" "KI" "Kiribati" "KM" "Comoros" "KN" "Saint Kitts and Nevis" "KP" "Korea (Democratic People's Republic of)" "KR" "Korea, Republic of" "KW" "Kuwait" "KY" "Cayman Islands" "KZ" "Kazakhstan" "LA" "Lao People's Democratic Republic" "LB" "Lebanon" "LC" "Saint Lucia" "LI" "Liechtenstein" "LK" "Sri Lanka" "LR" "Liberia" "LS" "Lesotho" "LT" "Lithuania" "LU" "Luxembourg" "LV" "Latvia" "LY" "Libya" "MA" "Morocco" "MC" "Monaco" "MD" "Moldova, Republic of" "ME" "Montenegro" "MF" "Saint Martin (French part)" "MG" "Madagascar" "MH" "Marshall Islands" "MK" "North Macedonia" "ML" "Mali" "MM" "Myanmar" "MN" "Mongolia" "MO" "Macao" "MP" "Northern Mariana Islands" "MQ" "Martinique" "MR" "Mauritania" "MS" "Montserrat" "MT" "Malta" "MU" "Mauritius" "MV" "Maldives" "MW" "Malawi" "MX" "Mexico" "MY" "Malaysia" "MZ" "Mozambique" "NA" "Namibia" "NC" "New Caledonia" "NE" "Niger" "NF" "Norfolk Island" "NG" "Nigeria" "NI" "Nicaragua" "NL" "Netherlands" "NO" "Norway" "NP" "Nepal" "NR" "Nauru" "NU" "Niue" "NZ" "New Zealand" "OM" "Oman" "PA" "Panama" "PE" "Peru" "PF" "French Polynesia" "PG" "Papua New Guinea" "PH" "Philippines" "PK" "Pakistan" "PL" "Poland" "PM" "Saint Pierre and Miquelon" "PN" "Pitcairn" "PR" "Puerto Rico" "PS" "Palestine, State of Consists of the West Bank and the Gaza Strip" "PT" "Portugal" "PW" "Palau" "PY" "Paraguay" "QA" "Qatar" "RE" "Réunion" "RO" "Romania" "RS" "Serbia" "RU" "Russian Federation" "RW" "Rwanda" "SA" "Saudi Arabia" "SB" "Solomon Islands" "SC" "Seychelles" "SD" "Sudan" "SE" "Sweden" "SG" "Singapore" "SH" "Saint Helena, Ascension and Tristan da Cunha" "SI" "Slovenia" "SJ" "Svalbard and Jan Mayen" "SK" "Slovakia" "SL" "Sierra Leone" "SM" "San Marino" "SN" "Senegal" "SO" "Somalia" "SR" "Suriname" "SS" "South Sudan" "ST" "Sao Tome and Principe" "SV" "El Salvador" "SX" "Sint Maarten (Dutch part)" "SY" "Syrian Arab Republic" "SZ" "Eswatini" "TC" "Turks and Caicos Islands" "TD" "Chad" "TF" "French Southern Territories" "TG" "Togo" "TH" "Thailand" "TJ" "Tajikistan" "TK" "Tokelau" "TL" "Timor-Leste" "TM" "Turkmenistan" "TN" "Tunisia" "TO" "Tonga" "TR" "Turkey" "TT" "Trinidad and Tobago" "TV" "Tuvalu" "TW" "Taiwan, Province of China" "TZ" "Tanzania" "UA" "Ukraine" "UG" "Uganda" "UM" "United States Minor Outlying Islands" "US" "United States of America" "UY" "Uruguay" "UZ" "Uzbekistan" "VA" "Holy See" "VC" "Saint Vincent and the Grenadines" "VE" "Venezuela" "VG" "Virgin Islands (British)" "VI" "Virgin Islands (U.S.)" "VN" "Viet Nam" "VU" "Vanuatu" "WF" "Wallis and Futuna" "WS" "Samoa" "YE" "Yemen" "YT" "Mayotte" "ZA" "South Africa" "ZM" "Zambia" "ZW" "Zimbabwe" 3>&1 1>&2 2>&3)
echo "SERVER_LOCATION=${SERVER_LOCATION}" >> .env

ACCOUNT_MAX=$(whiptail --title "Passky Installer - Server Settings" --inputbox "How many accounts can be created on this Passky Server?\n\nWhen this amount would be reached, new users won't be able to create their accounts on this server.\n\nFor Unlimited accounts use -1" 14 78 100 3>&1 1>&2 2>&3)
while [[ !( "$ACCOUNT_MAX" =~ ^[-]?[0-9]+ && "$ACCOUNT_MAX" -ge -1 && "$ACCOUNT_MAX" -le 1000000000 ) ]];
do
	ACCOUNT_MAX=$(whiptail --title "Passky Installer - Server Settings" --inputbox "How many accounts can be created on this Passky Server?\n\nWhen this amount would be reached, new users won't be able to create their accounts on this server.\n\nFor Unlimited accounts use -1\n\n'$ACCOUNT_MAX' is not a valid number. Make sure number is between -1 and 1000000000." 16 78 100 3>&1 1>&2 2>&3)
done
echo "ACCOUNT_MAX=${ACCOUNT_MAX}" >> .env

ACCOUNT_MAX_PASSWORDS=$(whiptail --title "Passky Installer - Server Settings" --inputbox "How many passwords can each account hold/have?\n\nWhen this amount would be reached, users won't be able to save new passwords.\n\nFor Unlimited passwords use -1" 14 78 1000 3>&1 1>&2 2>&3)
while [[ !( "$ACCOUNT_MAX_PASSWORDS" =~ ^[-]?[0-9]+ && "$ACCOUNT_MAX_PASSWORDS" -ge -1 && "$ACCOUNT_MAX_PASSWORDS" -le 1000000000 ) ]];
do
	ACCOUNT_MAX_PASSWORDS=$(whiptail --title "Passky Installer - Server Settings" --inputbox "How many passwords can each account hold/have?\n\nWhen this amount would be reached, users won't be able to save new passwords.\n\nFor Unlimited passwords use -1\n\n'$ACCOUNT_MAX_PASSWORDS' is not a valid number. Make sure number is between -1 and 1000000000." 16 78 1000 3>&1 1>&2 2>&3)
done
echo "ACCOUNT_MAX_PASSWORDS=${ACCOUNT_MAX_PASSWORDS}" >> .env

MYSQL_HOST=$(whiptail --title "Passky Installer - Database Settings" --inputbox "Provide IP or host for your database.\n\nIf you are using docker, use container name" 12 78 passky-database 3>&1 1>&2 2>&3)
echo "MYSQL_HOST=${MYSQL_HOST}" >> .env

MYSQL_PORT=$(whiptail --title "Passky Installer - Database Settings" --inputbox "Provide port for your database.\n\nIf you are using docker, use port 3306" 12 78 3306 3>&1 1>&2 2>&3)
echo "MYSQL_PORT=${MYSQL_PORT}" >> .env

MYSQL_DATABASE=$(whiptail --title "Passky Installer - Database Settings" --inputbox "Provide name for your database.\n\nIf you are using docker, database with user will be created automatically" 12 78 passky 3>&1 1>&2 2>&3)
echo "MYSQL_DATABASE=${MYSQL_DATABASE}" >> .env

MYSQL_USER=$(whiptail --title "Passky Installer - Database Settings" --inputbox "Provide user for your database.\n\nIf you are using docker, database with user will be created automatically" 12 78 passky 3>&1 1>&2 2>&3)
echo "MYSQL_USER=${MYSQL_USER}" >> .env

MYSQL_PASSWORD=$(whiptail --title "Passky Installer - Database Settings" --passwordbox "Provide password for user '${MYSQL_USER}'.\n\nIf you are using docker, database with user will be created automatically" 12 78 3>&1 1>&2 2>&3)
while [[ ! "$MYSQL_PASSWORD" =~ ^[A-Za-z0-9]{8,}$ ]];
do
	MYSQL_PASSWORD=$(whiptail --title "Passky Installer - Database Settings" --passwordbox "Provide password for user '${MYSQL_USER}'.\n\nIf you are using docker, database with user will be created automatically\n\nEntered password needs to be at least 8 characters long and can only contain uppercase characters, lowercase characters and numbers." 14 78 3>&1 1>&2 2>&3)
done
echo "MYSQL_PASSWORD=${MYSQL_PASSWORD}" >> .env

MYSQL_ROOT_PASSWORD=$(whiptail --title "Passky Installer - Database Settings" --passwordbox "Provide password for user 'root'.\n\nIf you are using docker, database with user will be created automatically" 12 78 3>&1 1>&2 2>&3)
while [[ ! "$MYSQL_ROOT_PASSWORD" =~ ^[A-Za-z0-9]{8,}$ ]];
do
	MYSQL_ROOT_PASSWORD=$(whiptail --title "Passky Installer - Database Settings" --passwordbox "Provide password for user 'root'.\n\nIf you are using docker, database with user will be created automatically\n\nEntered password needs to be at least 8 characters long and can only contain uppercase characters, lowercase characters and numbers." 14 78 3>&1 1>&2 2>&3)
done
echo "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}" >> .env

if (whiptail --title "Passky Installer - Mail Settings" --yesno "Do you want to enable SMTP mail?\n\nSetting up SMTP is not required." 12 78);
then
	echo "MAIL_ENABLED=true" >> .env

	MAIL_HOST=$(whiptail --title "Passky Installer - Mail Settings" --inputbox "Provide SMTP host.\n\nSetting up SMTP is not required." 12 78 mail.passky.org 3>&1 1>&2 2>&3)
	echo "MAIL_HOST=${MAIL_HOST}" >> .env

	MAIL_PORT=$(whiptail --title "Passky Installer - Mail Settings" --inputbox "Provide SMTP port.\n\nSetting up SMTP is not required." 12 78 587 3>&1 1>&2 2>&3)
	while [[ ! "$MAIL_PORT" =~ ^[0-9]{1,5}$ ]];
	do
		MAIL_PORT=$(whiptail --title "Passky Installer - Mail Settings" --inputbox "Provide SMTP port.\n\nSetting up SMTP is not required.\n\n'${MAIL_PORT}' is not a valid port. Port must be a number between 1 and 65535." 14 78 587 3>&1 1>&2 2>&3)
	done
	echo "MAIL_PORT=${MAIL_PORT}" >> .env

	if (whiptail --title "Passky Installer - Mail Settings" --yesno "Use TLS?\n\nSetting up SMTP is not required." 12 78); then
		echo "MAIL_USE_TLS=true" >> .env
	else
		echo "MAIL_USE_TLS=false" >> .env
	fi

	MAIL_USERNAME=$(whiptail --title "Passky Installer - Mail Settings" --inputbox "Provide SMTP username.\n\nSetting up SMTP is not required." 12 78 info@passky.org 3>&1 1>&2 2>&3)
	echo "MAIL_USERNAME=${MAIL_USERNAME}" >> .env

	MAIL_PASSWORD=$(whiptail --title "Passky Installer - Mail Settings" --passwordbox "Provide SMTP password.\n\nSetting up SMTP is not required." 12 78 3>&1 1>&2 2>&3)
	echo "MAIL_PASSWORD=${MAIL_PASSWORD}" >> .env
else
	echo "MAIL_ENABLED=false" >> .env
	echo "MAIL_HOST=" >> .env
	echo "MAIL_PORT=" >> .env
	echo "MAIL_USERNAME=" >> .env
	echo "MAIL_PASSWORD=" >> .env
	echo "MAIL_USE_TLS=" >> .env
fi

if (whiptail --title "Passky Installer - Mail Settings" --yesno "Do you want backups to be enabled?\n\nBackup perform every day and will export database to external server thru SSH (Using SCP).\n\nIf you don't have any external server ready for backups, leave it disabled." 14 78);
then
	echo "BACKUP_ENABLED=true" >> .env

	BACKUP_HOST=$(whiptail --title "Passky Installer - Backup Settings" --inputbox "Provide host for Backup server.\n\nSetting up Backups is not required." 12 78 backups.passky.org 3>&1 1>&2 2>&3)
	echo "BACKUP_HOST=${BACKUP_HOST}" >> .env

	BACKUP_PORT=$(whiptail --title "Passky Installer - Backup Settings" --inputbox "Provide SSH port.\n\nSetting up Backups is not required." 12 78 22 3>&1 1>&2 2>&3)
	while [[ ! "$BACKUP_PORT" =~ ^[0-9]{1,5}$ ]];
	do
		BACKUP_PORT=$(whiptail --title "Passky Installer - Backup Settings" --inputbox "Provide SSH port.\n\nSetting up Backups is not required.\n\n'${BACKUP_PORT}' is not a valid port. Port must be a number between 1 and 65535." 14 78 22 3>&1 1>&2 2>&3)
	done
	echo "BACKUP_PORT=${BACKUP_PORT}" >> .env

	BACKUP_LOCATION=$(whiptail --title "Passky Installer - Backup Settings" --inputbox "Provide location for Backup server.\n\nOn this location backup would be saved every day." 12 78 /home/backup/Passky 3>&1 1>&2 2>&3)
	echo "BACKUP_LOCATION=${BACKUP_LOCATION}" >> .env

	BACKUP_USER=$(whiptail --title "Passky Installer - Backup Settings" --inputbox "Provide user for Backup server.\n\nDo not use root user. Create new user that doesn't have root premissions." 12 78 backup 3>&1 1>&2 2>&3)
	echo "BACKUP_USER=${BACKUP_USER}" >> .env

	BACKUP_PASSWORD=$(whiptail --title "Passky Installer - Backup Settings" --passwordbox "Provide password for user '${BACKUP_USER}'.\n\nSetting up Backups is not required." 12 78 3>&1 1>&2 2>&3)
	echo "BACKUP_PASSWORD=${BACKUP_PASSWORD}" >> .env
else
	echo "BACKUP_ENABLED=false" >> .env
	echo "BACKUP_HOST=" >> .env
	echo "BACKUP_PORT=" >> .env
	echo "BACKUP_USER=" >> .env
	echo "BACKUP_PASSWORD=" >> .env
	echo "BACKUP_LOCATION=" >> .env
fi

if (whiptail --title "Passky Installer - API call limiter (Brute force mitigation)" --yesno "Do you want API call limiter to be enabled?\n\nAPI call limiter will only allow specific amount of calls for each device (IP).\n\nIf you expose this Passky Server to the internet, this should be enabled for security reasons." 14 78); then
	echo "LIMITER_ENABLED=true" >> .env
else
	echo "LIMITER_ENABLED=false" >> .env
fi

echo "LIMITER_GET_INFO=1" >> .env
echo "LIMITER_GET_STATS=1" >> .env
echo "LIMITER_GET_TOKEN=3" >> .env
echo "LIMITER_GET_PASSWORDS=2" >> .env
echo "LIMITER_SAVE_PASSWORD=2" >> .env
echo "LIMITER_EDIT_PASSWORD=2" >> .env
echo "LIMITER_DELETE_PASSWORD=2" >> .env
echo "LIMITER_CREATE_ACCOUNT=10" >> .env
echo "LIMITER_DELETE_ACCOUNT=10" >> .env
echo "LIMITER_IMPORT_PASSWORDS=10" >> .env
echo "LIMITER_FORGOT_USERNAME=60" >> .env
echo "LIMITER_ENABLE_2FA=10" >> .env
echo "LIMITER_DISABLE_2FA=10" >> .env
echo "LIMITER_ADD_YUBIKEY=10" >> .env
echo "LIMITER_REMOVE_YUBIKEY=10" >> .env

echo "YUBI_CLOUD=https://api.yubico.com/wsapi/2.0/verify" >> .env
echo "YUBI_ID=67857" >> .env

whiptail --title "Passky Installer" --msgbox "ENV FILE HAS BEEN SUCCESSFULLY GENEREATED\n\nNow you can deploy Passky Server with command: docker-compose up -d\n\nIf you made a mistake you can just re-run the installer with command: ./installerGUI.sh" 14 78