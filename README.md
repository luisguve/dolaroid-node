# Root "/"

Check whether the user is logged in and return its data:

- username
- user id 
- type of account

And whether the client should send its coords.

Method: **GET**

credentials: include

Example: `curl localhost:8000 -b cookie.txt`

## Response for user not logged in:
```json
{
  "isLoggedIn": false,
  "sendLocation": false
}
```

## Response for user logged in:
```json
{
  "isLoggedIn": true,
  "session": {
    "username": "username",
    "typeOfAccount": "regular/business/admin",
    "userId": "user-id"
  },
  "sendLocation": true
}
```
`sendLocation` might be `false`.

# Login "/login"

Validate user credentials and return it's data: username, user id and type of account and wether the client should send its coords.

Method: **POST**

credentials: include

## Body:
```json
{
  "username": "John",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/login -H "Content-type:application/json" -b cookie.txt -c cookie.txt -d {\"username\":\"John\",\"password\":\"qwerty\"}`

## Response for successful login:
```json
{
  "isLoggedIn": true,
  "session": {
    "username": "username",
    "typeOfAccount": "regular/business/admin",
    "userId": "user id"
  },
  "sendLocation": true
}
```
`sendLocation` might be `false`.

Error responses:

- Username does not exist: "User unregistered"
- Stored password and submitted password don't match: "Invalid username or password"

# Signup "/signup"

Register user if username is available and return it's data:

- username
- user id
- type of account

And wether the client should send its coords.

Method: **POST**

credentials: include

## Body:
```json
{
  "username": "John",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/signup -H "Content-type:application/json" -b cookie.txt -c cookie.txt -d {\"username\":\"John\",\"password\":\"qwerty\"}`

Response for successful signup:
```json
{
  "isLoggedIn": true,
  "session": {
    "username": "username",
    "typeOfAccount": "regular/business/admin",
    "userId": "user id"
  },
  "sendLocation": true
}
```
`sendLocation` might be `false`.

Error responses:
- Username already exists: "Username " + username + " already taken"

# Logout "/logout"

Remove session cookie

Method: **POST**

credentials: include

## body: empty

Example: `curl localhost:8000/logout -b cookie.txt -c cookie.txt -X POST`

Response for successful logout: 200 OK

Error responses:

- No session cookie or successful logout response.

# Submit coords "/location"

Send coords of client, store them in session cookie and return 200 OK.

Method: **POST**

credentials: include

## Body:
```json
{
  "latt": "6.42375",
  "longt": "-66.58973"
}
```

Example: `curl localhost:8000/location -H "Content-type:application/json" -b cookie.txt -c cookie.txt -d {\"latt\":\"6.42375\",\"longt\":\"-66.58973\"}`

Error response:

Sent empty or invalid coords: status 400 bad request.

# Get review "/review"

Method: GET

credentials: include

## Query parameters:

- **sn** for serial number
- **value** denomination
- **series** series year

Example: 
`curl "localhost:8000/review?sn=44SOMETHING12&value=100&series=2013" -b cookie.txt`

## Full response

If the user is logged in, it returns a full response:
```json
{
  "billInfo": {
    "serialNumber": "44 SOMETHING 12",
    "value": "100",
    "series": "2013"
  },
  "goodReviews": 2,
  "badReviews": 2,
  "avgRating": 5.0,
  "defects": ["ft-3d-ribbon", "ft-watermark"],
  "userReviews": {
    "goodReviews": [
      {
        "userId": "user-id",
        "date": "js date",
        "comment": "comment",
        "rating": 5,
        "location": {
          "latt": "6.42375",
          "longt": "-66.58973"
        }
      }
    ],
    "badReviews": [
      {
        "userId": "user-id",
        "date": "js date",
        "comment": "comment",
        "defects": ["ft-3d-ribbon", "ft-watermark"],
        "location": {
          "latt": "6.42375",
          "longt": "-66.58973"
        }
      }
    ]
  },
  "businessReviews": {
    "goodReviews": [
      {
        "userId": "user-id",
        "date": "js date",
        "comment": "comment",
        "rating": 5,
        "location": {
          "latt": "6.42375",
          "longt": "-66.58973"
        }
      }
    ],
    "badReviews": [
      {
        "userId": "user-id",
        "date": "js date",
        "comment": "comment",
        "defects": ["ft-3d-ribbon", "ft-watermark"],
        "location": {
          "latt": "6.42375",
          "longt": "-66.58973"
        }
      }
    ]
  },
  "details": {
    "in": {
      "date": "js date",
      "involved": "from/to",
      "subject": "details subject",
      "notes": "private notes"
    },
    "out": {
      "date": "js date",
      "involved": "from/to",
      "subject": "details subject",
      "notes": "private notes"
    },
  }
}
```

`defects` is an array of strings, in case of a bad review.

`rating` is a number between 1 and 5 in case of a good review.

## Basic response

If the user is not logged in, this is what the response looks like:
```json
{
  "billInfo": {
    "serialNumber": "44 SOMETHING 12",
    "value": "100",
    "series": "2013"
  },
  "goodReviews": 0,
  "badReviews": 0,
  "avgRating": 0.0
}
```

If the bill does not have reviews, it returns 404 and the following body:
```json
{
  "msg": "Review not found"
}
```

# Post review "/review"

Method: **POST**

credentials: include

## Body:
```json
{
  "billInfo": {
    "serialNumber": "44 SOMETHING 12",
    "value": "100",
    "series": "2013"
  },
  "review": {
    "date": "js date",
    "comment": "comment",
    "rating": 0,
    "defects": []
  },
  "details": {
    "typeOfDetail": "incoming/outgoing",
    "detailsData": {
      "date": "js date",
      "involved": "from/to",
      "subject": "details subject",
      "notes": "private notes"
    }
  },
  "typeOfReview": "Good review/Bad review"
}
```

Example: `curl localhost:8000/review -H "Content-type:application/json" -b cookie.txt -d "{\"billInfo\":{\"serialNumber\":\"44 SOMETHING 12\",\"value\": 100,\"series\":\"2013\"},\"review\":{\"date\":\"25-Jun-2021\",\"comment\":\"\",\"rating\":5,\"defects\":[]},\"typeOfReview\":\"Good review\"}"`

`defects` is an array of strings, in case of a bad review.

`rating` is a number between 1 and 5 in case of a good review.

`details` is optional

Response for successful post: 200 OK

Error responses:

- The session cookie does not have the coords: "Location required"
- The user is not logged in: 401 Unauthorized