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

variable "create_project" {
  description = "Whether to create a new DigitalOcean project. Set to false if project already exists."
  type        = bool
  default     = false
}
