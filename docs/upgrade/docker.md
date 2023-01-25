# Docker Upgrade

## 1. Avoiding Breaking Changes
In software development, versioning is used to keep track of changes and updates to a program or application. The version number is usually represented in a **format of major.minor.patch**, where:

- The **major** version number is incremented when significant changes are made to the software that may **introduce breaking changes or significant new features**.

- The **minor** version number is incremented when new features are added or existing features are improved, but there are **no breaking changes**.

- The **patch** version number is incremented when bug fixes and security patches are made, **without introducing new features or changes that would break existing functionality**.

When upgrading from one version to another, it is **generally safe to upgrade from one minor version to another** if the major version stays the same, as this would not introduce any breaking changes. However, **when upgrading from one major version to another, there may be breaking changes** that users need to be careful of and read the documentation for upgrade. In this case, it's very **important to backup the data before upgrading** and to test the upgrade process in a test environment before applying to production environment.

In the case of Passky, the current version structure is **major.minor.patch**, so if users are currently using version **8.1.0** and the new version is **8.2.0**, it's safe to upgrade from one minor to another as major version stays the same, but if the new version is **9.1.0**, users must be careful and read the documentation for upgrade as it's a major version change.

## 2. Minor or Patch Upgrade
1. Navigate to `Passky-Server` folder
2. Perform soft or hard upgrade
	- Soft upgrade:
	```yml
	sudo docker-compose pull # Pull new Passky Server image from Docker Hub
	sudo docker-compose up -d # Recreate Passky Server container with the new image
	```
	- Hard upgrade:
	```yml
	sudo docker-compose pull # Pull new Passky Server image from Docker Hub
	sudo docker-compose down # Delete current Passky Server container
	sudo docker-compose up -d # Create Passky Server container with the new image
	```
	> ⚠️ In certain instances, a soft upgrade may not be sufficient and a hard upgrade will be necessary.