# Preferred.pictures Node.js Client Library

The [Preferred.pictures](https://preferred.pictures) Node library provides a convenient way to call the
[Preferred.pictures](https://preferred.pictures) API for applications written in server side javascript.

## Installation

```
npm install --save @preferred-pictures/client
or
yarn add @preferred-pictures/client
```

## Usage

The package needs to be configured with your account's identity and
secret key, which is availabe in the Preferred.pictures interface.

```js
const PreferredPictures = require("@preferred-pictures/client");
const pp = new PreferredPictures({
  // Obtain your account's values by
  // signing into Preferred.pictures.

  identity: "test-identity",
  secretKey: "secret123456",
});

const choiceUrl = pp.createChooseUrl({
  choices: ["red", "green", "blue"],
  tournament: "testing",
  // The ttl for the action to be taken.
  ttl: 60 * 10,
  prefix: "https://example.com/jacket-",
  suffix: ".jpg",
});

// The url returned will appear to be something like:
//
// https://api.preferred.pictures/choose-url?choices=red%2Cgreen%2Cblue&tournament=testing&expiration=[EXPIRATION]&uid=[UNIQUEID]&ttl=600&prefix=https%3A%2F%2Fexample.com%2Fjacket-&suffix=.jpg&identity=test-identity&signature=[SIGNATURE]
//
// which should be placed where it is needed in your application or
// templates.
```
