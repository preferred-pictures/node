import { expect, assert } from "chai";
import "mocha";
import * as qs from "querystring";
import * as url from "url";
import { v4 as uuidv4 } from "uuid";

const bent = require("bent");

import PreferredPictures from "../src";

describe("integration tests", () => {
  let p: PreferredPictures;
  before(function () {
    if (!(process.env["PP_IDENTITY"] && process.env["PP_SECRET_KEY"])) {
      this.skip();
    }
    p = new PreferredPictures({
      identity: process.env["PP_IDENTITY"] || "",
      secretKey: process.env["PP_SECRET_KEY"] || "",
    });
  });

  it("should return one of the allowed choices as a HTTP redirect", async function () {
    // An example of just testing picking a choice.
    const url = p.createChooseUrl({
      choices: ["red", "green", "blue"],
      tournament: "testing",
      ttl: 60 * 10,
      choices_prefix: "https://example.com/jacket-",
      choices_suffix: ".jpg",
    });

    const request = bent(url, "GET", 302);
    const r = await request();
    expect(r.headers.location, "Location should be returned").to.not.be
      .undefined;
    expect(
      ["red", "green", "blue"].map(
        (v) => `https://example.com/jacket-${v}.jpg`
      ),
      "The choice url should be from the expected list"
    ).to.include(r.headers.location);
  });

  it("should be able to send an action report", async function () {
    // An example of just testing picking a choice.

    // The UID must be the same between the choice and the
    // destination redirect so set one.
    const uid = uuidv4();

    const choice_url = p.createChooseUrl({
      choices: ["red", "green", "blue"],
      tournament: "testing",
      ttl: 60 * 10,
      choices_prefix: "https://example.com/jacket-",
      choices_suffix: ".jpg",
      uid,
    });

    const choice_request = bent(choice_url, "GET", 302);
    await choice_request();

    const action_request = bent(choice_url, "POST", 200);
    await action_request();
  });

  it("should return one of the allowed choices as JSON", async function () {
    // An example of just testing picking a choice.
    const url = p.createChooseUrl({
      choices: ["red", "green", "blue"],
      tournament: "testing",
      ttl: 60 * 10,
      choices_prefix: "https://example.com/jacket-",
      choices_suffix: ".jpg",
      json: true,
    });
    const request = bent(url, "GET", "json", 200);
    const r = await request();
    expect(
      ["red", "green", "blue"].map(
        (v) => `https://example.com/jacket-${v}.jpg`
      ),
      "The choice url should be from the expected list"
    ).to.include(r);
  });

  it("should handle one choice as a HTTP redirect", async function () {
    // An example of just testing picking a choice.
    const choice = "https://example.com/jacket-yellow.jpg";
    const url = p.createChooseUrl({
      choices: [choice],
      tournament: "testing",
      ttl: 60 * 10,
    });

    const request = bent(url, "GET", 302);
    const r = await request();
    expect(r.headers.location, "Location should be returned").to.not.be
      .undefined;
    expect(choice).to.equal(r.headers.location);
  });

  it("should direct to the right destination associated with a choice", async function () {
    const choices: string[] = [];

    // Create 10 different choices with
    // 10 destiantions.
    for (let i = 0; i < 10; i++) {
      choices.push(i.toString(10));
    }

    // The UID must be the same between the choice and the
    // destination redirect so set one.
    const uid = uuidv4();

    const url = p.createChooseUrl({
      choices,
      choices_prefix: "https://example.com/c-",
      destinations: choices,
      destinations_prefix: "https://example.com/d-",
      tournament: "testing",
      ttl: 60 * 10,
      uid,
    });

    const request = bent(url, "GET", 302);
    const r = await request();
    expect(r.headers.location, "Location should be returned").to.not.be
      .undefined;
    const choice_value = r.headers.location.match(/\/c-(.+)$/)[1];
    expect(choice_value).to.not.be.undefined;

    // Now retrieve the destination url.
    const dest_url = p.createChooseUrl({
      choices,
      choices_prefix: "https://example.com/c-",
      destinations: choices,
      destinations_prefix: "https://example.com/d-",
      tournament: "testing",
      ttl: 60 * 10,
      go: true,
      uid,
    });

    const dest_request = bent(dest_url, "GET", 302);
    const dest_result = await dest_request();
    expect(dest_result.headers.location, "Location should be returned").to.not
      .be.undefined;
    const dest_value = dest_result.headers.location.match(/\/d-(.+)$/)[1];
    expect(dest_value).to.not.be.undefined;

    // Make sure the destination and choice are in sync.
    expect(dest_value).to.equal(choice_value);
  });
});

describe("createChooseUrl", () => {
  let p: PreferredPictures;
  before(function () {
    p = new PreferredPictures({
      identity: "testing",
      secretKey: "abcdefg",
    });
  });

  it("should throw an error when passed no choices", async function () {
    // An example of just testing picking a choice.
    assert.throw(
      () =>
        p.createChooseUrl({
          choices: [],
          tournament: "testing",
          ttl: 60 * 10,
        }),
      Error,
      "No choices were passed"
    );
  });

  it("should throw an error when too many choices are passed", () => {
    // An example of just testing picking a choice.
    const choices: string[] = [];
    for (let i = 0; i < 100; i++) {
      choices.push(`https://example.com/jacket-yellow-${i}.jpg`);
    }

    assert.throw(
      () =>
        p.createChooseUrl({
          choices,
          tournament: "testing",
          ttl: 60 * 10,
        }),
      Error,
      "The maximum number of choices is 35"
    );
  });

  it("should return the expected query fields", () => {
    // Try to test all of the options possible.
    const u = p.createChooseUrl({
      choices: ["red", "green", "blue"],
      tournament: "testing",
      ttl: 60 * 10,
      choices_prefix: "https://example.com/jacket-",
      choices_suffix: ".jpg",
      destinations_prefix: "https://www.example.com/destination-",
      destinations: ["red", "green", "blue"],
      destinations_suffix: ".html",
      json: true,
      go: true,
    });

    expect(u).to.not.be.undefined;
    expect(u).to.match(/^https:\/\/api\.preferred-pictures\.com\/choose/);

    const parsed = url.parse(u);
    expect(parsed.query).to.not.be.undefined;
    if (parsed.query != null) {
      const query_fields = qs.parse(parsed.query);

      const expected_fields = [
        "uid",
        "identity",
        "signature",
        "ttl",
        "choices[]",
        "expiration",
        "choices_prefix",
        "choices_suffix",
        "destinations[]",
        "destinations_prefix",
        "destinations_suffix",
        "json",
        "go",
      ];
      for (const field_name of expected_fields) {
        expect(
          query_fields[field_name],
          `${field_name} should not be missing from the query`
        ).to.not.be.undefined;
      }
    }
  });
});
