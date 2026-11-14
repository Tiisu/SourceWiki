# MariaDB Database Server – Installation & Setup Guide

A step-by-step guide to installing, configuring, and running MariaDB Server on Windows, Linux (Ubuntu/Debian), and macOS.

## Table of Contents

1. Introduction
2. System Requirements
3. Windows Installation
4. Linux Installation (Ubuntu/Debian)
5. macOS Installation
6. Starting and Stopping MariaDB
7. Connecting to MariaDB
8. Creating a Database
9. Creating a Database User
10. Configuring Remote Access
11. Testing the Installation
12. Troubleshooting
13. Uninstallation

---

## 1. Introduction

MariaDB is an open-source relational database management system (RDBMS) compatible with MySQL.

It can be used for:
- Web applications.
- Django and Python applications.
- PHP applications.
- Enterprise systems.
- Local development environments.
- Production database servers.

Default connection details:

| Setting | Default |
|---|---|
| Host | localhost |
| Port | 3306 |
| Username | root |
| Database | Depends on installation |
| Protocol | TCP/IP |

## 2. System Requirements

Recommended minimum requirements:

| Component | Requirement |
|---|---|
| Operating System | Windows 10/11, Ubuntu 22.04+, macOS |
| RAM | 2 GB minimum |
| Storage | 1 GB available |
| Processor | 64-bit processor |
| Network | Internet connection for installation |

## 3. Windows Installation

### Step 1: Download MariaDB

Visit the official MariaDB downloads page:

https://mariadb.org/download/

1. Select Windows.
2. Download the latest stable MariaDB MSI installer.
3. Run the downloaded installer.

### Step 2: Install MariaDB

During installation:

1. Accept the license agreement.
2. Select the installation directory.
3. Configure the database root password.
4. Enable networking.
5. Set the TCP port to `3306`.
6. Enable installation as a Windows service.
7. Complete the installation.

Recommended service name:

`MariaDB`

### Step 3: Verify Installation

Open Command Prompt or PowerShell:

```powershell
mariadb --version
```

If the command is not recognized, navigate to the MariaDB installation directory or add its `bin` directory to the Windows PATH.

Typical installation location:

```text
C:\Program Files\MariaDB 11.x\bin
```

### Step 4: Connect to MariaDB

```powershell
mariadb -u root -p
```

Enter the root password configured during installation.

### Step 5: Manage MariaDB Service

Open PowerShell as Administrator.

Start:

```powershell
Start-Service MariaDB
```

Stop:

```powershell
Stop-Service MariaDB
```

Restart:

```powershell
Restart-Service MariaDB
```

Check status:

```powershell
Get-Service MariaDB
```

---

## 4. Linux Installation (Ubuntu/Debian)

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install MariaDB

```bash
sudo apt install mariadb-server mariadb-client -y
```

### Step 3: Start MariaDB

```bash
sudo systemctl start mariadb
```

Enable automatic startup:

```bash
sudo systemctl enable mariadb
```

### Step 4: Verify Installation

```bash
sudo systemctl status mariadb
```

Check the installed version:

```bash
mariadb --version
```

### Step 5: Secure MariaDB

```bash
sudo mariadb-secure-installation
```

Follow the prompts to configure security settings.

### Step 6: Connect to MariaDB

```bash
sudo mariadb
```

---

## 5. macOS Installation

The recommended installation method is Homebrew.

### Step 1: Install Homebrew

If Homebrew is not installed, run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Official website:

https://brew.sh/

### Step 2: Install MariaDB

```bash
brew update
brew install mariadb
```

### Step 3: Start MariaDB

```bash
brew services start mariadb
```

This configures MariaDB to start automatically when the Homebrew service manager starts.

### Step 4: Verify Installation

```bash
mariadb --version
```

Check service status:

```bash
brew services list
```

### Step 5: Secure Installation

```bash
mariadb-secure-installation
```

Follow the prompts.

### Step 6: Connect to MariaDB

```bash
mariadb -u root
```

Depending on your installation and authentication configuration, you may need:

```bash
mariadb -u root -p
```

---

## 6. Starting and Stopping MariaDB

### Windows

Run PowerShell as Administrator.

Start:

```powershell
Start-Service MariaDB
```

Stop:

```powershell
Stop-Service MariaDB
```

Restart:

```powershell
Restart-Service MariaDB
```

### Linux (Ubuntu/Debian)

Start:

```bash
sudo systemctl start mariadb
```

Stop:

```bash
sudo systemctl stop mariadb
```

Restart:

```bash
sudo systemctl restart mariadb
```

Enable startup:

```bash
sudo systemctl enable mariadb
```

### macOS

Start:

```bash
brew services start mariadb
```

Stop:

```bash
brew services stop mariadb
```

Restart:

```bash
brew services restart mariadb
```

---

## 7. Connecting to MariaDB

General connection syntax:

```bash
mariadb -h HOST -P PORT -u USERNAME -p
```

Example:

```bash
mariadb -h localhost -P 3306 -u root -p
```

For a local installation, you can also use:

```bash
mariadb -u root -p
```

---

## 8. Creating a Database

Log in to MariaDB:

```bash
mariadb -u root -p
```

Create a database:

```sql
CREATE DATABASE mydatabase;
```

List databases:

```sql
SHOW DATABASES;
```

Select a database:

```sql
USE mydatabase;
```

---

## 9. Creating a Database User

Create a dedicated database user instead of using root for applications.

```sql
CREATE USER 'appuser'@'localhost'
IDENTIFIED BY 'ReplaceWithAStrongPassword';

GRANT ALL PRIVILEGES ON mydatabase.*
TO 'appuser'@'localhost';

FLUSH PRIVILEGES;
```

Test the account:

```bash
mariadb -u appuser -p mydatabase
```

---

## 10. Configuring Remote Access

By default, MariaDB installations may listen only on the local machine.

To allow connections from other computers on your network, configure the MariaDB server's bind address.

### Linux

Edit:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Find:

```ini
bind-address = 127.0.0.1
```

Change to:

```ini
bind-address = 0.0.0.0
```

Restart:

```bash
sudo systemctl restart mariadb
```

### Windows

Locate the MariaDB configuration file (`my.ini`).

Find the `[mysqld]` section and configure:

```ini
bind-address=0.0.0.0
```

Restart the MariaDB Windows service.

### macOS

Locate the MariaDB configuration file, commonly:

```text
/opt/homebrew/etc/my.cnf
```

For Intel-based Macs, it may be:

```text
/usr/local/etc/my.cnf
```

Under `[mysqld]`, configure:

```ini
bind-address=0.0.0.0
```

Restart:

```bash
brew services restart mariadb
```

### Create a Remote Database User

For example, to permit access from a particular LAN subnet:

```sql
CREATE USER 'remoteuser'@'192.168.1.%'
IDENTIFIED BY 'ReplaceWithAStrongPassword';

GRANT ALL PRIVILEGES ON mydatabase.*
TO 'remoteuser'@'192.168.1.%';

FLUSH PRIVILEGES;
```

Allow TCP port `3306` through the firewall only for trusted client addresses.

**Security warning:** Do not expose MariaDB port 3306 directly to the public internet. For remote administration, prefer a VPN or SSH tunnel.

---

## 11. Testing the Installation

Run:

```bash
mariadb -u appuser -p
```

Inside MariaDB:

```sql
SELECT VERSION();

SHOW DATABASES();

SELECT USER();

SELECT NOW();
```

Expected result:

- MariaDB returns its installed version.
- Databases are displayed.
- The connected account is identified.
- The current database server time is returned.

---

## 12. Troubleshooting

### Problem 1: MariaDB Service Not Starting

Linux:

```bash
sudo journalctl -u mariadb -n 50 --no-pager
```

Windows:

```powershell
Get-Service MariaDB
```

macOS:

```bash
brew services info mariadb
```

### Problem 2: Port 3306 Already in Use

Linux/macOS:

```bash
sudo lsof -i :3306
```

Windows:

```powershell
netstat -ano | findstr :3306
```

Identify the process occupying the port before changing the MariaDB configuration.

### Problem 3: Access Denied

Check the username, password, host permissions, and authentication method.

Try:

```bash
mariadb -u root -p
```

On Ubuntu, the root account may use Unix socket authentication, in which case:

```bash
sudo mariadb
```

### Problem 4: Cannot Connect Remotely

Check:

1. MariaDB bind address.
2. Database user host permissions.
3. Firewall configuration.
4. Network connectivity.
5. Whether port 3306 is listening.

Linux:

```bash
sudo ss -lntp | grep 3306
```

---

## 13. Uninstallation

### Windows

1. Open Control Panel.
2. Navigate to Programs and Features.
3. Select MariaDB.
4. Choose Uninstall.

Back up your databases before uninstalling.

### Ubuntu/Debian

```bash
sudo apt remove mariadb-server mariadb-client
```

To remove configuration files:

```bash
sudo apt purge mariadb-server mariadb-client
```

To remove remaining database files, only if you intend to permanently delete all databases:

```bash
sudo rm -rf /var/lib/mysql
```

### macOS

```bash
brew services stop mariadb
brew uninstall mariadb
```

Back up your databases before removing any data directories.

---

## 14. Useful References

- MariaDB Official Website: https://mariadb.org/
- MariaDB Documentation: https://mariadb.com/kb/en/documentation/
- MariaDB Downloads: https://mariadb.org/download/
- Homebrew: https://brew.sh/
- Ubuntu Documentation: https://ubuntu.com/server/docs

---

## 15. Quick Reference

| Operation | Windows | Ubuntu/Linux | macOS |
|---|---|---|---|
| Install | MSI Installer | `sudo apt install mariadb-server` | `brew install mariadb` |
| Start | `Start-Service MariaDB` | `sudo systemctl start mariadb` | `brew services start mariadb` |
| Stop | `Stop-Service MariaDB` | `sudo systemctl stop mariadb` | `brew services stop mariadb` |
| Restart | `Restart-Service MariaDB` | `sudo systemctl restart mariadb` | `brew services restart mariadb` |
| Version | `mariadb --version` | `mariadb --version` | `mariadb --version` |
| Connect | `mariadb -u root -p` | `sudo mariadb` | `mariadb -u root -p` |

---

**End of Guide**

MariaDB is now ready to serve as the database backend for your applications across Windows, Linux, and macOS.