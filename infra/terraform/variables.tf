variable "github_repo_url" {
  description = "GitHub repository URL for source code (format: owner/repo)"
  type        = string
}

variable "database_url" {
  description = "External database connection URL (sensitive - database is managed outside Terraform)"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}
