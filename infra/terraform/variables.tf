variable "digitalocean_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "github_repo_url" {
  description = "GitHub repository URL for source code (format: owner/repo)"
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

variable "apps_exist" {
  description = "Set to true if apps already exist in DigitalOcean (will skip creation and require import). Set to false to create new apps."
  type        = bool
  default     = true
}
