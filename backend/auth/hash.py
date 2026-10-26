"""Password hashing utilities using PBKDF2 (built-in, no extra deps)."""

import hashlib
import os


def hash_password(password: str) -> str:
    """Hash a password with PBKDF2-SHA256 and a 16-byte salt.
    Returns a string in the format: pbkdf2:sha256:iterations$salt$hash
    """
    salt = os.urandom(16)
    iterations = 600_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2:sha256:{iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash produced by hash_password."""
    try:
        algorithm_field, rest = hashed.split(":", 1)
        if algorithm_field != "pbkdf2":
            return False
        _, hash_algo, iterations_str = rest.split(":", 1)
        iterations = int(iterations_str.split("$")[0])
        # Reconstruct full format
        # Format: pbkdf2:sha256:iterations$salt$hash
        parts = hashed.split("$")
        if len(parts) != 3:
            return False
        salt = bytes.fromhex(parts[1])
        expected_hash = parts[2]
        digest = hashlib.pbkdf2_hmac(hash_algo, password.encode("utf-8"), salt, iterations)
        return digest.hex() == expected_hash
    except (ValueError, IndexError):
        return False
