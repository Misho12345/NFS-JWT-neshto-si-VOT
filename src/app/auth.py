import os
from functools import wraps
from flask import request, jsonify
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

KEYCLOAK_PUBLIC_KEY = f"-----BEGIN PUBLIC KEY-----\n{os.getenv('KEYCLOAK_PUBLIC_KEY', '')}\n-----END PUBLIC KEY-----"
KEYCLOAK_ISSUER = os.getenv("KEYCLOAK_SERVER_URL", "http://localhost:8080") + "/realms/" + os.getenv("KEYCLOAK_REALM",
                                                                                                     "file-manager")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "file-manager-client")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            return jsonify({"error": "Authorization header is required"}), 401

        parts = auth_header.split()
        if parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must start with Bearer"}), 401
        elif len(parts) == 1:
            return jsonify({"error": "Token not found"}), 401
        elif len(parts) > 2:
            return jsonify({"error": "Authorization header must be Bearer token"}), 401

        token = parts[1]
        try:
            payload = jwt.decode(
                token,
                KEYCLOAK_PUBLIC_KEY,
                algorithms=["RS256"],
                issuer=KEYCLOAK_ISSUER,
                audience="account"
            )
        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)

    return decorated
