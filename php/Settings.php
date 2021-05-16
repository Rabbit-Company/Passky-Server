<?php

class Settings{

/*

    DATABASE SETTINGS

    Please do not touch those values if you are using docker-compose.

*/
    static string $mysql_host = "passky-mysql";
    static string $mysql_database = "passky";
    static string $mysql_username = "passky";
    static string $mysql_password = "uDWjSd8wB2HRBHei489o";

/*

    API CALL LIMITER (Brute force mitigation)
    
    In this section you can set how many seconds users needs to wait until they can make new request to API for spacific action.

*/
    static int $limiter_login = 3;
    static int $limiter_getPasswords = 3;
    static int $limiter_savePassword = 2;
    static int $limiter_editPassword = 2;
    static int $limiter_deletePassword = 2;
    static int $limiter_createAccount = 1800; // Time will be reset if user delete his account.
    static int $limiter_deleteAccount = 1800; // Time will be reset if account has been deleted successfully.
}

?>