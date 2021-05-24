<?php

class Settings{

/*

    DATABASE SETTINGS

    Please do not touch those values if you are using docker-compose.

*/

    public static string $mysql_host = "passky-mysql";
    public static string $mysql_database = "passky";
    public static string $mysql_username = "passky";
    public static string $mysql_password = "uDWjSd8wB2HRBHei489o";

/*

    ACCOUNT SETTINGS

    In this section you can set account limits.

*/

    public static int $max_accounts = 100;      // How many accounts can be created on this server.
    public static int $max_passwords = 1000;    // How many passwords can each account have.

/*

    API CALL LIMITER (Brute force mitigation)
    
    In this section you can set how many seconds users needs to wait until they can make new request to API for spacific action.

*/

    public static int $limiter_getPasswords = 3;
    public static int $limiter_savePassword = 2;
    public static int $limiter_editPassword = 2;
    public static int $limiter_deletePassword = 2;
    public static int $limiter_createAccount = 30;
    public static int $limiter_deleteAccount = 30;
    public static int $limiter_importPasswords = 30;

}

?>