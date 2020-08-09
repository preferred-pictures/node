import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import * as qs from "querystring";

/** The algorithm to use for creating HMAC signatures */
const HMAC_ALGO = "sha256";

type ChooseUrlRequestParams = {
  "choices[]"?: string[];
  choices_prefix?: string;
  choices_suffix?: string;
  expiration: string;
  tournament: string;
  ttl?: string;
  uid: string;
  "destinations[]"?: string[];
  destinations_prefix?: string;
  destinations_suffix?: string;
  go?: string;
  json?: string;
  limited_signature?: string;
};

/** The order that fields should be included in the signature */
const ChooseUrlSigningOrder: Array<keyof ChooseUrlRequestParams> = [
  "choices_prefix",
  "choices_suffix",
  "choices[]",
  "destinations_prefix",
  "destinations_suffix",
  "destinations[]",
  "expiration",
  "go",
  "json",
  "tournament",
  "ttl",
  "uid",
];

export default class PreferredPicturesClient {
  private readonly identity: string;
  private readonly secretKey: string;
  private readonly maxChoices: number = 35;
  private readonly endpoint: string = "https://api.preferred-pictures.com";

  /**
   * Create a new PreferredPicturesClient instance using
   * an identity and the secret API key associated with that
   * identity.
   *
   * Example:
   *
   * ```js
   * import PreferredPicturesClient from '@preferred-pictures/client';
   * const pp = new PreferredPicturesClient({
   *     // Obtain your account's values by
   *     // signing into PreferredPictures.
   *     identity: "test-identity",
   *     secretKey: "secret123456",
   * });
   * ```
   */
  constructor(params: {
    /** The identity that should be used for API calls generated */
    identity: string;
    /** The secret key of the identity that should be used to generated signatures */
    secretKey: string;
    /** The maximum number of choices to allow, default 35 */
    maxChoices?: number;
    /** The endpoint of the API to use, default is https://api.PreferredPictures/ */
    endpoint?: string;
  }) {
    this.identity = params.identity;
    this.secretKey = params.secretKey;
    if (params.maxChoices != null) {
      this.maxChoices = params.maxChoices;
    }
    if (params.endpoint != null) {
      this.endpoint = params.endpoint;
    }
  }

  /**
   * Build a URL for a call to `/choose` of the PreferredPictures API,
   * using the passed parameters.
   *
   * @returns A URL that when requested will return the result of the
   * API call.
   *
   * Example:
   * ```js
   * // A simple example of choosing between three different
   * // URLs.
   * const simpleChoiceUrl = pp.createChooseUrl({
   *     choices: [
   *         "https://example.com/image-red.jpg",
   *         "https://example.com/image-green.jpg",
   *         "https://example.com/image-blue.jpg",
   *     ],
   *     // Change the tournament as necessary to represent
   *     // different needs.
   *     tournament: "testing",
   * });
   * ```
   */
  createChooseUrl(params: {
    /** A list of choices from which a selection should be made.  Typically these are URLs.  */
    choices: string[];
    /** An optional prefix to prepend to all of the choices */
    choices_prefix?: string;
    /** An optional suffix to append to all of the choices */
    choices_suffix?: string;
    /** An optional list of destination URLs which are paired with each choice */
    destinations?: string[];
    /** An optional prefix to prepend to all of the destination URLs */
    destinations_prefix?: string;
    /** An optional suffix to append to all of the destination URLs */
    destinations_suffix?: string;
    /** The tournament of which this API call is a member */
    tournament: string;
    /**
     * The amount of time in seconds after a choice is made that an action
     * can be recorded.
     */
    ttl?: number;
    /** The amount of time in seconds that the request signature is valid */
    expirationTtl?: number;
    /** Indicate that the result should be returned as JSON, rather than a HTTP redirect*/
    json?: boolean;
    /**
     * Indicate that the user should be redirected to the destination URL
     * from a previously chosen option associated with the same tournament
     * and unique id.
     */
    go?: boolean;
    /** An optional unique identifier that is used to correlate choices and actions.
     *
     * If it is not specified a UUID v4 will be generated.
     */
    uid?: string;

    /**
     * Produce a limited signature over all fields except
     * uid, expiration, json, go.
     */
    limited_signature?: boolean;
  }) {
    if (params.expirationTtl == null) {
      // Default the request to have a valid time of 3600 from now.
      params.expirationTtl = 3600;
    }
    if (params.ttl != null && params.ttl > params.expirationTtl) {
      throw new Error("expiration_ttl must be >= ttl");
    }

    if (params.choices.length === 0) {
      throw new Error("No choices were passed");
    }

    if (params.choices.length > this.maxChoices) {
      throw new Error(`The maximum number of choices is ${this.maxChoices}`);
    }

    const request_params: ChooseUrlRequestParams = {
      tournament: params.tournament,
      expiration: (
        Math.ceil(Date.now() / 1000) + params.expirationTtl
      ).toString(10),
      uid: params.uid != null ? params.uid : uuidv4(),
    };

    request_params["choices[]"] = params.choices;

    if (params.ttl != null) {
      request_params.ttl = params.ttl.toString(10);
    }
    if (params.choices_prefix != null) {
      request_params.choices_prefix = params.choices_prefix;
    }
    if (params.choices_suffix != null) {
      request_params.choices_suffix = params.choices_suffix;
    }

    if (params.destinations != null) {
      request_params["destinations[]"] = params.destinations;
    }
    if (params.destinations_prefix != null) {
      request_params.destinations_prefix = params.destinations_prefix;
    }
    if (params.destinations_suffix != null) {
      request_params.destinations_suffix = params.destinations_suffix;
    }

    if (params.go) {
      request_params.go = "true";
    }
    if (params.json) {
      request_params.json = "true";
    }

    if (params.limited_signature) {
      request_params.limited_signature = "true";
    }

    // Now create the signature.
    const signing_string = ChooseUrlSigningOrder.filter((field_name) => {
      if (params.limited_signature) {
        return !(
          field_name === "uid" ||
          field_name === "expiration" ||
          field_name === "json" ||
          field_name === "go"
        );
      }
      return true;
    })
      .map((v) => request_params[v])
      .filter((v) => v != null)
      .map((v) => (Array.isArray(v) ? v.join(",") : v))
      .join("/");

    const signature = crypto
      .createHmac(HMAC_ALGO, this.secretKey)
      .update(signing_string)
      .digest("hex");

    const query = qs.stringify({
      ...request_params,
      identity: this.identity,
      signature: signature,
    });

    return `${this.endpoint}/choose?${query}`;
  }
}
