---
title: Quickstart
nextjs:
  metadata:
    title: Quickstart
    description: Cloning and running BizTix locally
---

This section provides a step-by-step guide to get you started with BizTix development. By following these instructions, you can ensure that you have BizTix up and running on your local machine for development and testing purposes. {% .lead %}

## Prerequisites

Before you begin, ensure you have the following installed on your local system:

- Node.js (preferably the latest LTS version)
- npm (which comes with Node.js)
- Git

## Cloning the Project

To clone the project repository to your local machine, open a terminal and run the following command:

```bash
git clone https://github.com/bennypc/biztech-tickets.git
```

## Installing Dependencies

Navigate to the project directory and install its dependencies:

```bash
cd biztech-tickets
npm install
```

This command installs all the necessary npm packages defined in `package.json`.

{% callout title="Missing Packages" %}
If you encounter any issues during the installation, try running `npm install` again or use `npm ci` for a clean install based on `package-lock.json`.
{% /callout %}

## Running the Project

After successfully installing the dependencies, you can start the project by running:

```bash
npm start
```

This command will start the development server and open the project in your default web browser.
