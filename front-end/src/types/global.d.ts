declare const google: any;

type JWTCredential = {
    "iss": string, // The JWT's issuer
    "nbf": string,
    "aud": string, // Your server's client ID
    "sub": string, // The unique ID of the user's Google Account
    "hd": string, // If present, the host domain of the user's GSuite email address
    "email": string, // The user's email address
    "email_verified": boolean // true, if Google has verified the email address
    "azp": string,
    "name": string,
                              // If presentstring a URL to user's profile picture
    "picture": string,
    "given_name": string
    "family_name": string
    "iat": number, // Unix timestamp of the assertion's creation time
    "exp": number, // Unix timestamp of the assertion's expiration time
    "jti": string
  }