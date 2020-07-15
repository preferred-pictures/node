import { expect } from "chai";
import "mocha";
import * as qs from "querystring";
import * as url from "url";
import PreferredPictures from "../src";

describe("createChooseUrl", () => {
  it("should return the expected query fields", () => {
    const p = new PreferredPictures({
      identity: "test",
      secret_key: "test123456",
    });

    const u = p.createChooseUrl({
      choices: ["red", "green", "blue"],
      tournament: "testing",
      ttl: 60 * 10,
      prefix: "https://example.com/jacket-",
      suffix: ".jpg",
    });

    expect(u).to.not.be.undefined;
    expect(u).to.match(/^https:\/\/api\.preferred\.pictures\/choose-url/);

    const parsed = url.parse(u);

    expect(parsed.query).to.not.be.undefined;
    if (parsed.query != null) {
      const query_fields = qs.parse(parsed.query);

      const expected_fields = [
        "uid",
        "identity",
        "signature",
        "ttl",
        "prefix",
        "suffix",
        "choices",
        "expiration",
      ];
      for (const field_name of expected_fields) {
        expect(query_fields[field_name]).to.not.be.undefined;
      }
    }
  });
});
