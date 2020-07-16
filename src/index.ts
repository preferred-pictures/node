import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import * as qs from "querystring";

/** The algorithm to use for creating HMAC signatures */
const HMAC_ALGO = "sha256";

interface ChooseUrlRequestParams {
  choices?: string;
  expiration: string;
  prefix?: string;
  suffix?: string;
  tournament: string;
  ttl?: string;
  uid: string;
}

interface ClientConstructorParameters {
  /** The identity that should be used for API calls generated */
  identity: string;
  /** The secret key of the identity that should be used to generated signatures */
  secretKey: string;
  /** The maximum number of choices to allow, default 35 */
  maxChoices?: number;
  /** The endpoint of the API to use, default is https://api.preferred.pictures/ */
  endpoint?: string;
}

/** A set of parameters for generating calls to /choose-url
 */
type ChooseUrlParameters = {
  /** A list of choices of which a selection should be made */
  choices: string[];
  /** The tournament of which this API call is a part */
  tournament: string;
  /**
   * The amount of time in seconds after a choice is made that an action
   * can be recorded.
   */
  ttl?: number;
  /** The amount of time in seconds that the request signature is valid */
  expirationTtl?: number;
  /** An optional prefix to prepend to all of the choices */
  prefix?: string;
  /** An optional suffix to append to all of the choices */
  suffix?: string;
};

/** The order that fields should be included in the signature */
const ChooseUrlSigningOrder: Array<keyof ChooseUrlRequestParams> = [
  "choices",
  "expiration",
  "prefix",
  "suffix",
  "tournament",
  "ttl",
  "uid",
];

export default class PreferredPictures {
  private readonly identity: string;
  private readonly secretKey: string;
  private readonly maxChoices: number = 35;
  private readonly endpoint: string = "https://api.preferred.pictures";

  /**
   *
   * @param identity The identity to use when creating requests
   * @param secret_key The secret key to use to create HMAC signatures
   */
  constructor(params: ClientConstructorParameters) {
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
   * Build a URL for a call to /choose-url of the Preferred.pictures API
   *
   */
  createChooseUrl(params: ChooseUrlParameters) {
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
      choices: params.choices.join(","),
      tournament: params.tournament,
      expiration: (
        Math.ceil(Date.now() / 1000) + params.expirationTtl
      ).toString(10),
      uid: uuidv4(),
    };
    if (params.ttl != null) {
      request_params.ttl = params.ttl.toString(10);
    }
    if (params.prefix != null) {
      request_params.prefix = params.prefix;
    }
    if (params.suffix != null) {
      request_params.suffix = params.suffix;
    }

    // Now create the signature.
    const signing_string = ChooseUrlSigningOrder.map((v) => request_params[v])
      .filter((v) => v != null)
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

    return `${this.endpoint}/choose-url?${query}`;
  }
}
