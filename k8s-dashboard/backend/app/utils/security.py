"""
Security Utilities
Password hashing and encryption utilities for sensitive data
"""
import hashlib
import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


# Encryption key management
# In production, use environment variables and secure key management (AWS KMS, Azure Key Vault, etc.)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a key if not provided (for development only)
    # In production, this MUST be set via environment variable and stored securely
    print("WARNING: ENCRYPTION_KEY not set. Generating temporary key (NOT FOR PRODUCTION)")
    ENCRYPTION_KEY = Fernet.generate_key().decode()


def get_fernet_cipher() -> Fernet:
    """Get Fernet cipher instance for encryption/decryption"""
    # Ensure key is bytes
    key = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY
    
    # If key is not a valid Fernet key, derive one
    if len(key) != 44:  # Fernet keys are 44 bytes (32 bytes base64 encoded)
        # Derive a proper key using PBKDF2HMAC
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'k8s_dashboard_salt',  # In production, use a random salt
            iterations=100000,
            backend=default_backend()
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key))
        return Fernet(derived_key)
    
    return Fernet(key)


def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data (kubeconfig, tokens)
    
    Args:
        data: Plain text data to encrypt
        
    Returns:
        Base64 encoded encrypted data
    """
    if not data:
        return ""
    
    cipher = get_fernet_cipher()
    encrypted = cipher.encrypt(data.encode())
    return base64.b64encode(encrypted).decode()


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt sensitive data
    
    Args:
        encrypted_data: Base64 encoded encrypted data
        
    Returns:
        Decrypted plain text data
    """
    if not encrypted_data:
        return ""
    
    try:
        cipher = get_fernet_cipher()
        decoded = base64.b64decode(encrypted_data.encode())
        decrypted = cipher.decrypt(decoded)
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt data: {str(e)}")


def hash_password(password: str) -> str:
    """
    Hash password using SHA256
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored password hash
        
    Returns:
        True if password matches, False otherwise
    """
    return hash_password(plain_password) == hashed_password


def encrypt_kubeconfig(kubeconfig_content: str) -> str:
    """
    Encrypt kubeconfig file content
    
    Args:
        kubeconfig_content: Full kubeconfig YAML content
        
    Returns:
        Encrypted kubeconfig
    """
    return encrypt_data(kubeconfig_content)


def decrypt_kubeconfig(encrypted_kubeconfig: str) -> str:
    """
    Decrypt kubeconfig file content
    
    Args:
        encrypted_kubeconfig: Encrypted kubeconfig
        
    Returns:
        Plain text kubeconfig YAML content
    """
    return decrypt_data(encrypted_kubeconfig)


def encrypt_token(token: str) -> str:
    """
    Encrypt API token
    
    Args:
        token: Plain text token
        
    Returns:
        Encrypted token
    """
    return encrypt_data(token)


def decrypt_token(encrypted_token: str) -> str:
    """
    Decrypt API token
    
    Args:
        encrypted_token: Encrypted token
        
    Returns:
        Plain text token
    """
    return decrypt_data(encrypted_token)


def generate_encryption_key() -> str:
    """
    Generate a new encryption key
    
    Returns:
        Base64 encoded encryption key
    """
    return Fernet.generate_key().decode()


# Example usage and testing
if __name__ == "__main__":
    # Test encryption/decryption
    test_data = "apiVersion: v1\nkind: Config\nclusters:\n- name: test"
    print("Original:", test_data)
    
    encrypted = encrypt_data(test_data)
    print("Encrypted:", encrypted[:50] + "...")
    
    decrypted = decrypt_data(encrypted)
    print("Decrypted:", decrypted)
    
    assert test_data == decrypted, "Encryption/Decryption failed"
    print("✓ Encryption test passed")
    
    # Test password hashing
    password = "test_password_123"
    hashed = hash_password(password)
    print(f"\nPassword hash: {hashed}")
    
    assert verify_password(password, hashed), "Password verification failed"
    assert not verify_password("wrong_password", hashed), "Wrong password should fail"
    print("✓ Password hashing test passed")
    
    print("\n✓ All security tests passed")
