# Passky 🔒

[![GitHub issues](https://img.shields.io/github/issues/Rabbit-Company/Passky-Server?color=blue&style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/issues)
[![GitHub stars](https://img.shields.io/github/stars/Rabbit-Company/Passky-Server?style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Rabbit-Company/Passky-Server?style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/network)
[![GitHub license](https://img.shields.io/github/license/Rabbit-Company/Passky-Server?color=blue&style=for-the-badge)](https://github.com/Rabbit-Company/Passky-Server/blob/main/LICENSE)

### [Download from Rabbit Store](https://rabbitstore.org/?app=com.rabbit-company.passky)

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

For sensitive data encryption, Passky uses XChaCha20, a state-of-the-art encryption algorithm that provides a high level of security and performance. This encryption method is designed to be resistant to known-plaintext attacks and other forms of cryptanalysis.

For master password hashing, Passky uses Argon2id, a password-hashing algorithm that is designed to be resistant to brute-force attacks. This algorithm uses a combination of memory-hard and data-dependent techniques to make it difficult for attackers to guess your master password.

When you save your account information to Passky, all sensitive data is fully encrypted using XChaCha20. The encrypted data is then stored on Passky's servers.

When you try to access your account, Passky will prompt you to input your master password. The master password is then hashed using Argon2id algorithm to ensure its security. The hashed master password is then used to decrypt the sensitive data, allowing you to access your account.

In summary, Passky uses advanced encryption methods such as XChaCha20 and Argon2id to ensure the security of your sensitive data and master password, making it difficult for anyone to access your information without your permission.

## How Secure is Passky?

Passky simplifies your digital life and solves your password problem. All you’ll ever need to do is remember a single, ultra-secure password that includes uppercase letters, lowercase letters, numbers, and special characters. Once you’ve got that written down in your wallet or purse (or buried in your memory), you’ll get the benefit of secure passwords across your online accounts without having to memorize dozens of codewords. This makes it one of the most secure ways to protect your online identity.

But Passky takes security a step further. We’ve implemented a brute force mitigation system that locks out any user who inputs the wrong password too many times. By stopping login attempts for a set time and warning you about an attempted breach, you’ll have time to secure your account by creating a new password or taking other measures.

## But is Passky Easy to Use?

Passky has been designed with modern users in mind. That’s why we’ve strived to provide an interface that’s streamlined and easy to use. Unlike some of the competition, Passky can be easily used by anyone, including techies and computer novices. And since it’s built for performance, you won’t need to overtax your CPU or waste a lot of storage space to keep it running.

Downloading and installing Passky to your browser is a simple process that takes less than two-minutes to complete. Once it’s up and running, you can immediately begin managing your passwords with it. Creating, editing, and deleting passwords takes mere seconds. And once you’ve got everything setup, you’ll be able to quickly access all of your password-protected websites and accounts.

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
- [Shared Hosting](https://github.com/Rabbit-Company/Passky-Server/blob/main/docs/installation/shared-hosting.md)

## Upgrade

```yaml
sudo docker-compose pull
sudo docker-compose up -d
```

## Uninstall

```yaml
sudo docker-compose down
```
