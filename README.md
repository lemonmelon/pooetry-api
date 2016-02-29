pooetry-api
===========

## Endpoints

### Add note

    POST /note
    {
      "text": {text},
      "long": {longitude},
      "lat": {latitude}
    }

### Get notes

    GET /content?long={longitude}&lat={latitude}
