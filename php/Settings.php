<?php

class Settings{

/*

    SERVER SETTINGS

*/

    public static function getLocation() : string{
        return getenv("SERVER_LOCATION", true) ?: getenv("SERVER_LOCATION") ?: "us";
    }

/*

    DATABASE SETTINGS

*/

    public static function getDBHost() : string{
        return getenv("MYSQL_HOST", true) ?: getenv("MYSQL_HOST") ?: "passky-mysql";
    }

    public static function getDBUsername() : string{
        return getenv("MYSQL_USER", true) ?: getenv("MYSQL_USER") ?: "passky";
    }

    public static function getDBPassword() : string{
        return getenv("MYSQL_PASSWORD", true) ?: getenv("MYSQL_PASSWORD") ?: "uDWjSd8wB2HRBHei489o";
    }

/*

    EMAIL SETTINGS

*/

    public static function getMailHost() : string{
        return getenv("MAIL_HOST", true) ?: getenv("MAIL_HOST") ?: "mail.passky.org";
    }

    public static function getMailPort() : int{
        return getenv("MAIL_PORT", true) ?: getenv("MAIL_PORT") ?: 587;
    }

    public static function getMailUsername() : string{
        return getenv("MAIL_USERNAME", true) ?: getenv("MAIL_USERNAME") ?: "info@passky.org";
    }

    public static function getMailPassword() : string{
        return getenv("MAIL_PASSWORD", true) ?: getenv("MAIL_PASSWORD") ?: "secret";
    }

    public static function getMailTLS() : bool{
        return getenv("MAIL_USE_TLS", true);
    }

/*

    ACCOUNT SETTINGS

*/

    public static function getMaxAccounts() : int{
        return getenv("ACCOUNT_MAX", true) ?: getenv("ACCOUNT_MAX") ?: 100;
    }

    public static function getMaxPasswords() : int{
        return getenv("ACCOUNT_MAX_PASSWORDS", true) ?: getenv("ACCOUNT_MAX_PASSWORDS") ?: 1000;
    }

/*

    YUBICO SETTINGS

*/

    public static function getYubiCloud() : string{
        return getenv("YUBI_CLOUD", true) ?: getenv("YUBI_CLOUD") ?: "https://api.yubico.com/wsapi/2.0/verify";
    }

    public static function getYubiId() : int{
        return getenv("YUBI_ID", true) ?: getenv("YUBI_ID") ?: 67857;
    }

/*

    API CALL LIMITER (Brute force mitigation)
    
*/

    public static function getLimiterGetInfo() : int{
        return getenv("LIMITER_GET_INFO", true) ?: getenv("LIMITER_GET_INFO") ?: 1;
    }

    public static function getLimiterGetToken() : int{
        return getenv("LIMITER_GET_TOKEN", true) ?: getenv("LIMITER_GET_TOKEN") ?: 3;
    }

    public static function getLimiterGetPasswords() : int{
        return getenv("LIMITER_GET_PASSWORDS", true) ?: getenv("LIMITER_GET_PASSWORDS") ?: 3;
    }

    public static function getLimiterSavePassword() : int{
        return getenv("LIMITER_SAVE_PASSWORD", true) ?: getenv("LIMITER_SAVE_PASSWORD") ?: 2;
    }

    public static function getLimiterEditPassword() : int{
        return getenv("LIMITER_EDIT_PASSWORD", true) ?: getenv("LIMITER_EDIT_PASSWORD") ?: 2;
    }

    public static function getLimiterDeletePassword() : int{
        return getenv("LIMITER_DELETE_PASSWORD", true) ?: getenv("LIMITER_DELETE_PASSWORD") ?: 2;
    }

    public static function getLimiterCreateAccount() : int{
        return getenv("LIMITER_CREATE_ACCOUNT", true) ?: getenv("LIMITER_CREATE_ACCOUNT") ?: 30;
    }

    public static function getLimiterDeleteAccount() : int{
        return getenv("LIMITER_DELETE_ACCOUNT", true) ?: getenv("LIMITER_DELETE_ACCOUNT") ?: 30;
    }

    public static function getLimiterImportPasswords() : int{
        return getenv("LIMITER_IMPORT_PASSWORDS", true) ?: getenv("LIMITER_IMPORT_PASSWORDS") ?: 30;
    }

    public static function getLimiterForgotUsername() : int{
        return getenv("LIMITER_FORGOT_USERNAME", true) ?: getenv("LIMITER_FORGOT_USERNAME") ?: 600;
    }

    public static function getLimiterEnable2fa() : int{
        return getenv("LIMITER_ENABLE_2FA", true) ?: getenv("LIMITER_ENABLE_2FA") ?: 60;
    }

    public static function getLimiterDisable2fa() : int{
        return getenv("LIMITER_DISABLE_2FA", true) ?: getenv("LIMITER_DISABLE_2FA") ?: 60;
    }

    public static function getLimiterAddYubiKey() : int{
        return getenv("LIMITER_ADD_YUBIKEY", true) ?: getenv("LIMITER_ADD_YUBIKEY") ?: 60;
    }

    public static function getLimiterRemoveYubiKey() : int{
        return getenv("LIMITER_REMOVE_YUBIKEY", true) ?: getenv("LIMITER_REMOVE_YUBIKEY") ?: 60;
    }

}

?>