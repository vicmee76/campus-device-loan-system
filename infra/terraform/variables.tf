variable "digitalocean_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "github_repo_url" {
  description = "GitHub repository URL for source code"
  type        = string
}

variable "database_url" {
  description = "External database connection URL (sensitive - database is managed outside Terraform)"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}
