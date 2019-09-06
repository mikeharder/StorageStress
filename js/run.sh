#!/bin/bash

docker run -it --rm --network host -e STORAGE_CONNECTION_STRING -e NODE_TLS_REJECT_UNAUTHORIZED storagestress/js "$@"
