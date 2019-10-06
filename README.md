Coppell North Middle School Anouncements
----------------------------------

## Overview

The Coppell North Middle School PTO emails the school announcements to parents who pay to receive them. This Node JS program builds HTML from the announcements saved on to the school's Google Drive.

## Requirements

You'll need NodeJS. This app is written in Javascript, targeting the NodeJS runtime. I like to be able to quickly switch to different NodeJS versions. So I use [nvm](https://github.com/nvm-sh/nvm) to manage my NodeJS versions. I developed this program using version `v12.6.0`.

## Setup

This program integrates with Google Drive, requiring a `credentials.json` files containing account credentials to get access to the specified Google Drive folder. Contact me offline to get this file.

First step is to get all the necessary code by installing all the dependent libraries.

```bash
npm i
```

Second step is to get the `credentials.json` file (contact me).

Third step is to authenticate with Google.

```bash
npm start -- --date=10/2/2019
```

The date is the first folder to read in google drive (assuming they're named something like OCOTOBER 2).

When you run `npm start -- --date=10/2/2019` in your terminal, you'll see a URL. Enter that URL into your browser's URL field and hit `return`. The program will start a web server which will intercept the HTTP redirect from Google's OAuth sequence, capture the `code` and write it in a file called `token.json`. Subsequent executions shouldn't require you to enter an authentication code until that `Token` expires.

The output of the program will be a text file called `output.html` in the app directory and a scheduled newsletter. Then just login to membership toolkit and release the newsletter.