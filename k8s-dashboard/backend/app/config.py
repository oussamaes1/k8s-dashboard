"""
Application configuration settings.
Loads environment variables (including backend/.env) and exposes a singleton
`settings` used across the backend.
"""
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	# App
	APP_NAME: str = "K8s Dashboard API"
	APP_VERSION: str = "1.0.0"
	DEBUG: bool = False

	# Security / JWT
	SECRET_KEY: str = "change-me-in-production-use-a-strong-random-string"
	ALGORITHM: str = "HS256"
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

	# API
	API_V1_PREFIX: str = "/api/v1"

	# Kubernetes
	K8S_IN_CLUSTER: bool = False
	K8S_CONFIG_PATH: str = "~/.kube/config"
	K8S_NAMESPACE: str = "default"

	# Anomaly Detection
	ANOMALY_CONTAMINATION: float = 0.1
	ANOMALY_N_ESTIMATORS: int = 100

	# Logging
	LOG_LEVEL: str = "INFO"
	LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

	# CORS
	CORS_ORIGINS: str = Field(
		default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
	)

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=True,
		extra="ignore",
	)

	@property
	def cors_origins_list(self) -> List[str]:
		return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]


settings = Settings()
