<?php

function displayHeader($location){

  $active = 'mainMenuLinkSelected inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  $inactive = 'mainMenuLink border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';

  $activeMobile = 'mainMenuMobileLinkSelected block pl-3 pr-4 py-2 border-l-4 text-base font-medium';
  $inactiveMobile = 'mainMenuMobileLink border-transparent block pl-3 pr-4 py-2 border-l-4 text-base font-medium';

  ?>
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width" />
      <meta name="description" content="Passky is a simple, modern, lightweight, open-source and secure password manager." />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#0D1117" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <title>Passky</title>
      <link rel="shortcut icon" type="image/png" href="./website/images/logo.png"/>
      <link rel="stylesheet" href="./website/css/tailwind.min.css">
      <link rel="stylesheet" href="./website/css/index.css">
      <link id="css-theme" type="text/css" rel="stylesheet" href="./website/css/themes/dark.css">
      <script src="./website/js/header.js"></script>
    </head>
    <body class="primaryBackgroundColor">
      <nav class="secondaryBackgroundColor shadow">
        <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex px-2 lg:px-0">
              <div class="flex-shrink-0 flex items-center">
                <img class="block lg:hidden h-8 w-auto" src="./website/images/logo.png" alt="Passky">
                <img class="hidden lg:block h-8 w-auto" src="./website/images/logo.png" alt="Passky">
              </div>
              <div class="hidden lg:ml-6 lg:flex lg:space-x-8">
                <a id="home-link" href="./website/actions/changePage.php?page=home" class="<?= ($location === 0) ? $active : $inactive ?>">Home</a>
                <a id="server-link" href="./website/actions/changePage.php?page=server" class="<?= ($location === 1) ? $active : $inactive ?>">Server</a>
                <?php if(isset($_SESSION['username']) && isset($_SESSION['token'])){ ?>
                  <a id="accounts-link" href="./website/actions/changePage.php?page=accounts" class="<?= ($location === 2) ? $active : $inactive ?>">Accounts</a>
									<a id="licenses-link" href="./website/actions/changePage.php?page=licenses" class="<?= ($location === 5) ? $active : $inactive ?>">Licenses</a>
                  <a id="health-link" href="./website/actions/changePage.php?page=health" class="<?= ($location === 3) ? $active : $inactive ?>">Health</a>
                  <a id="settings-link" href="./website/actions/changePage.php?page=settings" class="<?= ($location === 4) ? $active : $inactive ?>">Settings</a>
                <?php } ?>
              </div>
            </div>
            <?php if($location === 2 || $location === 5){ ?>
              <div class="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
                <div class="flex-shrink-0">
                  <span class="relative z-0 inline-flex shadow-sm rounded-md">
                    <input type="text" id="search" class="relative inline-flex shadow focus:outline-none px-4 py-2 sm:text-sm rounded-md" placeholder="Search">
                  </span>
                </div>
              </div>
            <?php } ?>
            <div class="hidden lg:flex space-x-8 items-center justify-end lg:flex-1 lg:w-0">
              <?php if(isset($_SESSION['username'])){ ?>
                <a id="signout-link" href="./website/actions/logout.php" class="dangerButton px-3 py-2 rounded-md text-sm font-medium">Sign out</a>
              <?php }else{ ?>
                <a id="login-link" href="./website/actions/changePage.php?page=login" class="primaryButton px-3 py-2 rounded-md text-sm font-medium">Log in</a>
              <?php } ?>
            </div>
            <div class="flex items-center lg:hidden">
              <button id="main-menu-toggle-btn" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none" aria-controls="mobile-menu" aria-expanded="false">
                <span class="sr-only">Open main menu</span>
                <svg id="mobile-menu-icon" xmlns="http://www.w3.org/2000/svg" class="block h-6 w-6" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="lg:hidden">
          <div id="mobile-menu" class="hidden pt-2 pb-3 space-y-1">
            <a id="home-link-mobile" href="./website/actions/changePage.php?page=home" class="<?= ($location === 0) ? $activeMobile : $inactiveMobile ?>">Home</a>
            <a id="server-link-mobile" href="./website/actions/changePage.php?page=server" class="<?= ($location === 1) ? $activeMobile : $inactiveMobile ?>">Server</a>
            <?php if(isset($_SESSION['username']) && isset($_SESSION['token'])){ ?>
              <a id="accounts-link-mobile" href="./website/actions/changePage.php?page=accounts" class="<?= ($location === 2) ? $activeMobile : $inactiveMobile ?>">Accounts</a>
							<a id="licenses-link-mobile" href="./website/actions/changePage.php?page=licenses" class="<?= ($location === 5) ? $activeMobile : $inactiveMobile ?>">Licenses</a>
              <a id="health-link-mobile" href="./website/actions/changePage.php?page=health" class="<?= ($location === 3) ? $activeMobile : $inactiveMobile ?>">Health</a>
              <a id="settings-link-mobile" href="./website/actions/changePage.php?page=settings" class="<?= ($location === 4) ? $activeMobile : $inactiveMobile ?>">Settings</a>
              <a id="signout-link-mobile" href="./website/actions/logout.php" class="mainMenuMobileLink border-transparent block pl-3 pr-4 py-2 border-l-4 text-base font-medium">Sign out</a>
            <?php }else{ ?>
              <a id="login-link-mobile" href="./website/actions/changePage.php?page=login" class="mainMenuMobileLink border-transparent block pl-3 pr-4 py-2 border-l-4 text-base font-medium">Log in</a>
            <?php } ?>
          </div>
      </div>
    </nav>
<?php } ?>