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

    API CALL LIMITER (Brute force mitigation)
    
    In this section you can set how many seconds users needs to wait until they can make new request to API for spacific action.

*/

    public static int $limiter_getPasswords = 3;
    public static int $limiter_savePassword = 2;
    public static int $limiter_editPassword = 2;
    public static int $limiter_deletePassword = 2;
    public static int $limiter_createAccount = 30;
    public static int $limiter_deleteAccount = 30;

}

?>