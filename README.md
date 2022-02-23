# Passky: The Ultimate Open-Source Password Manager

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

Passky is simple, modern, lightweight, open source and secure password manager.

[![Passky - Password manager](https://img.youtube.com/vi/yrk6cHkgVA8/0.jpg)](https://www.youtube.com/watch?v=yrk6cHkgVA8 "Click to watch!")

## How Much Does it Cost?

Passky is open-source. This means that anyone can download it, dig into its code, and customize it to their liking. Using Passky doesn’t require an upfront cost or monthly subscription. It’s completely free to download and can be hosted by anyone who has the space to do so.

When we launched Passky, we setup two servers, each holding up to 1,000 passwords for 100 users apiece. These servers are currently open for new users. But only the first two-hundred people to sign up will get access. Possible future servers are contingent upon a number of factors. So, if you want access to the best, open-source password manager on the market, now is the time to join.

## How Does Passky Work?

Some people are hesitant to use a password manager because they fear that it could leave them vulnerable to hackers and other malicious actors. But once you understand the way Passky works, you’ll quickly realize that using a password manager like Passky is far more secure than opting for a single password across all your accounts.

When you save your account information to Passky, all sensitive data is fully encrypted. This means that your sensitive data cannot be accessed by anyone at Passky or by any potential hackers. If someone did access your passwords, they’d only be able to see an encrypted version of it that’s useless without your master key.

So, what is your master key? It’s your own personal password – the one password you need to unlock all other passwords. When you try to access your e-mail or another password protected site, Passky will pull your encrypted password from our server. Then, you’ll input your master password, and it will decrypt the password. So, you’ll only ever need to remember your master password. It will effortlessly unlock every other password you could want.

## How Secure is Passky?

Passky simplifies your digital life and solves your password problem. All you’ll ever need to do is remember a single, ultra-secure password that includes uppercase letters, lowercase letters, numbers, and special characters. Once you’ve got that written down in your wallet or purse (or buried in your memory), you’ll get the benefit of secure passwords across your online accounts without having to memorize dozens of codewords. This makes it one of the most secure ways to protect your online identity.

But Passky takes security a step further. We’ve implemented a brute force mitigation system that locks out any user who inputs the wrong password too many times. By stopping login attempts for a set time and warning you about an attempted breach, you’ll have time to secure your account by creating a new password or taking other measures.

## But is Passky Easy to Use?

Passky has been designed with modern users in mind. That’s why we’ve strived to provide an interface that’s streamlined and easy to use. Unlike some of the competition, Passky can be easily used by anyone, including techies and computer novices. And since it’s built for performance, you won’t need to overtax your CPU or waste a lot of storage space to keep it running.

[Downloading and installing Passky](https://www.youtube.com/watch?v=efi1GXv52iI) to your browser is a simple process that takes less than two-minutes to complete. Once it’s up and running, you can immediately begin managing your passwords with it. [Creating, editing, and deleting passwords](https://www.youtube.com/watch?v=8YCkCDm5NkQ) takes mere seconds. And once you’ve got everything setup, you’ll be able to quickly access all of your password-protected websites and accounts.

## How Does Passky Compare to the Competition?

Bitwarden is one of Passky’s biggest competitors. It’s also a free, open-source password manager. But unlike Passky, Bitwarden offers a host of additional features. The only problem is that you’ll likely never use any of them. Most people want a password manager to do one thing really well – not a whole host of things with mediocrity.

Since Passky is designed to do one thing well, it’s faster, less resource intensive, easier to use, and requires less storage space than Bitwarden. Plus, it’s just more modern.

Passky is built for today’s users, not yesterday’s.

But how does Passky stack up against other password managers on the market today?

Unfortunately, that’s the problem with them. Most other password managers are on the market. They’ve been built to be sold to people like you. Those managers aren’t open-source or free. They require an upfront cost, or a monthly or yearly subscription.

We believe in the power of open-source software. And we also believe in the generosity of those who benefit from our products. That’s why we’ve made Passky available at no cost. We only ask that you’d consider making a donation if you benefit from the work we’ve put in to this product.

And when you donate, don’t think that you’re paying us to rest on our laurels. We’re dedicated to enhancing Passky in a number of valuable and important ways, including…

    • An increasing number of themes that users can choose from to customize their Passky experience.
    • More language options for our worldwide users.
    • And more…

If you’re ready to try Passky out at no cost, you can get started by visiting our website at https://passky.org. We currently have a desktop application available for Windows and Linux operating systems along with a mobile app on the Google Play Store. MacOS and iOS apps are currently being developed. In addition, we offer browser extensions for all major browsers except for Safari.

## Installation

### Docker
#### Debian & Ubuntu (x64)
```yaml
# Install docker
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
# Start docker on boot
sudo systemctl enable --now docker
# Install docker compose
sudo apt install docker-compose -y
```
#### Raspberry Pi OS (arm64)
```yaml
# Install docker
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
# Start docker on boot
sudo systemctl enable --now docker
# Install docker compose
sudo apt-get install libffi-dev libssl-dev
sudo apt install python3-dev
sudo apt-get install -y python3 python3-pip
sudo pip3 install docker-compose
```

### Passky containers
```yaml
wget https://github.com/Rabbit-Company/Passky-Server/releases/latest/download/passky-server.tar.xz
tar -xf passky-server.tar.xz
cd passky-server
# Makes installers executable
chmod +x installer.sh installerGUI.sh
# Start the GUI installer
./installerGUI.sh
# After you complete with installer you can create containers with below command
sudo docker-compose up -d
```

## Upgrade

```yaml
sudo docker-compose pull
sudo docker-compose up -d
```

## Uninstall

```yaml
sudo docker-compose down
```
