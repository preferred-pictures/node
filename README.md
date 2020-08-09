# PreferredPictures Node.js Client Library

The [PreferredPictures](https://preferred.pictures) Node library provides a convenient way to call the
PreferredPictures API.

[View the full documentation about the PreferredPicture's API](https://docs.preferred.pictures/api-sdks/api)

[Learn more about what PreferredPictures can do.](https://docs.preferred.pictures/)

## Installation

```
npm install --save @preferred-pictures/client
or
yarn add @preferred-pictures/client
```

## Usage

The package needs to be configured with your account's identity and
secret key, which is available in the PreferredPictures interface.

```js
const PreferredPictures = require("@preferred-pictures/client");
const pp = new PreferredPictures({
  // Obtain your account's values by
  // signing into PreferredPictures.
  identity: "test-identity",
  secretKey: "secret123456",
});

// A simple example of choosing between three different
// URLs.
const simpleChoiceUrl = pp.createChooseUrl({
  choices: [
    "https://example.com/image-red.jpg",
    "https://example.com/image-green.jpg",
    "https://example.com/image-blue.jpg",
  ],

  // Change the tournament as necessary to represent
  // different needs.
  tournament: "testing",
});

// A more in-depth example that uses a prefix and a suffix
// rather than explict URLs.
const choiceUrl = pp.createChooseUrl({
  choices: ["red", "green", "blue"],
  tournament: "testing",
  // The ttl for the action to be tracked specified in seconds.
  ttl: 60 * 10,
  // This will add a prefix and suffix to all of the choices
  // specified previously.
  choices_prefix: "https://example.com/jacket-",
  choices_suffix: ".jpg",
});

// The URL returned will appear to be something like:
//
// https://api.preferred.pictures/choose-url?choices=red%2Cgreen%2Cblue&tournament=testing&expiration=1597000373&uid=135a0ff2-b49d-422a-984b-b5aef29637f0&ttl=600&identity=test-identity&signature=f4329ac7956d060e8560e7bdaa5d7fb6c849a87d3157f6f2aeeb63a7b9b11da0
//
// which should be placed where it is needed in your application or
// templates.
```
