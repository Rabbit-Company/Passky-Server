<h1 align="center">🔒 Passky Server 🔒</h1>

[![GitHub issues](https://img.shields.io/github/issues/Rabbit-Company/Passky-Server?color=blue&style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/issues)
[![GitHub stars](https://img.shields.io/github/stars/Rabbit-Company/Passky-Server?style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Rabbit-Company/Passky-Server?style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/network)
[![GitHub license](https://img.shields.io/github/license/Rabbit-Company/Passky-Server?color=blue&style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/blob/main/LICENSE)

### [Download from Official Website](https://passky.org/download)

## Passky Clients

   * [Website](https://github.com/Rabbit-Company/Passky-Website#installation)
   * [Browser Extension](https://github.com/Rabbit-Company/Passky-Browser-Extension#installation)
   * [Desktop Application](https://github.com/Rabbit-Company/Passky-Desktop#installation)
   * [Android Application](https://github.com/Rabbit-Company/Passky-Android#installation)

## What is Passky?

Passky is a simple, modern, lightweight, open source and secure password manager.

[![Passky - Password manager](https://img.youtube.com/vi/yrk6cHkgVA8/0.jpg)](https://www.youtube.com/watch?v=yrk6cHkgVA8 "Click to watch!")

## How Much Does it Cost?

Passky is a free, open-source password manager that simplifies your digital life. Both the free and premium plans include advanced security features such as two-factor authentication to ensure the safety and security of your sensitive data.

While the free plan allows you to store up to 100 passwords, the premium plan offers additional benefits such as the ability to store an unlimited number of passwords. [Upgrade to the premium plan](https://passky.org/pricing) to gain access to all of Passky's features and take your password security to the next level.

At Passky, we take your security seriously, and we don't compromise on safety when it comes to password management. [Sign up now](https://vault.passky.org/register) and experience the peace of mind that comes with using Passky.

## How it Works?

Passky uses a combination of advanced encryption methods to ensure the security of your data.

Passky is based on a **zero trust architecture** and uses advanced encryption methods such as **XChaCha20** and **Argon2id** to ensure the security of your sensitive data.

For sensitive data encryption, Passky uses **XChaCha20**, a state-of-the-art encryption algorithm that provides a **high level of security and performance**. This encryption method is designed to be **resistant to known-plaintext attacks and other forms of cryptanalysis**.

For master password hashing, Passky uses **Argon2id**, a password-hashing algorithm that has been recognized as the winner of multiple password-hashing competitions, such as the **[Password Hashing Competition (PHC)](https://www.password-hashing.net)** held by the community. It is designed to be **resistant to brute-force attacks**. This algorithm uses a combination of memory-hard and data-dependent techniques to make it difficult for attackers to guess your master password.

When you save your account information to Passky, **all sensitive data is fully encrypted** using **XChaCha20**. The encrypted data is then stored on Passky's servers.

When you try to access your account, Passky will prompt you to input your master password. The master password is then hashed using **Argon2id** algorithm to ensure its security. The hashed master password is then used to decrypt the sensitive data, allowing you to access your account.

In summary, **Passky uses advanced encryption methods such as XChaCha20 and Argon2id** to ensure the security of your sensitive data and master password, making it difficult for anyone to access your information without your permission.

## How Does Passky Compare to the Competition?

Feature | Passky | Bitwarden | NordPass | Dashlane | 1Password | LastPass
--- | :---: | :---: | :---: | :---: | :---: | :---: |
Premium Price | $${\color{orange}\$2/month}$$ | $${\color{green}\$0.83/month}$$ | $${\color{orange}1.99€/month}$$ | $${\color{orange}2€/month}$$ | $${\color{red}\$2.99/month}$$ | $${\color{red}2.90€/month}$$ |
Number of Passwords | $${\color{green}Unlimited}$$ | $${\color{green}Unlimited}$$ | $${\color{green}Unlimited}$$ | $${\color{green}Unlimited}$$ | $${\color{green}Unlimited}$$ | $${\color{green}Unlimited}$$
Two-factor Authentication | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$
Zero-knowledge architecture | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{green}Yes}$$
Encryption | $${\color{green}XChaCha20/Argon2id}$$ | $${\color{orange}AES-256/PBKDF2}$$ | $${\color{green}XChaCha20/Argon2id}$$ | $${\color{orange}AES-256/PBKDF2}$$ | $${\color{orange}AES-256/PBKDF2}$$ | $${\color{orange}AES-256/PBKDF2}$$
Open-Source | $${\color{green}Yes}$$ | $${\color{green}Yes}$$ | $${\color{red}No}$$ | $${\color{red}No}$$ | $${\color{red}No}$$ | $${\color{red}No}$$
Customization | $${\color{green}Yes}$$ | $${\color{red}No}$$ | $${\color{red}No}$$ | $${\color{red}No}$$ | $${\color{red}No}$$ | $${\color{red}No}$$

> Comparison data accurate as of January 25th, 2023

## Installation

Passky Server can be easily installed in multiple ways.

- [Docker](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/installation/docker.md) (Recommended)
- [Linode](https://www.linode.com/marketplace/apps/rabbit-company/passky/) (One-click Install)
- [Shared Hosting](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/installation/shared-hosting.md)

## Upgrade

To upgrade your Passky Server, please **select the installation method** that you previously used to set up your server. This will ensure a seamless upgrade process and minimal disruption to your current Passky Server configuration. If you have any issues or concerns during the upgrade process, please do not hesitate to reach out to our support team for assistance.

- [Docker](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/upgrade/docker.md)
